import { AppState, AppStateStatus } from 'react-native';
import { refreshAccessTokenSingleFlight, resolveBaseUrl } from './api';
import { getAccessToken } from './tokenStorage';
import { NotificationResponse } from '../types';

export type NotificationEventListener = (notification: NotificationResponse) => void;

class SseNotificationClient {
  private xhr: XMLHttpRequest | null = null;
  private isConnecting = false;
  private isConnected = false;
  private shouldRun = false;
  private reconnectTimer: any = null;
  private retryCount = 0;
  private unauthorizedRetryCount = 0;
  private seenBytes = 0;
  private buffer = '';
  private currentEventName = 'message';
  private processedNotificationIds = new Set<string>();
  private listeners: Set<NotificationEventListener> = new Set();
  private appStateSubscription: any = null;

  public start() {
    if (this.shouldRun) return;
    this.shouldRun = true;
    this.retryCount = 0;
    this.unauthorizedRetryCount = 0;

    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }

    this.connect();
  }

  public stop() {
    this.shouldRun = false;
    this.disconnect();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  public subscribe(listener: NotificationEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      if (this.shouldRun && !this.isConnected && !this.isConnecting) {
        this.retryCount = 0;
        this.connect();
      }
    } else {
      // In background/inactive, disconnect stream to save battery and network
      this.disconnect();
    }
  };

  private async connect() {
    if (!this.shouldRun || this.isConnecting || this.isConnected) return;
    this.isConnecting = true;

    try {
      const token = await getAccessToken();
      if (!token) {
        this.isConnecting = false;
        return;
      }

      const baseUrl = resolveBaseUrl();
      const streamUrl = `${baseUrl}/farmer/notifications/stream`;

      this.disconnect();

      const xhr = new XMLHttpRequest();
      this.xhr = xhr;
      this.seenBytes = 0;
      this.buffer = '';
      this.currentEventName = 'message';

      xhr.open('GET', streamUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            this.isConnected = true;
            this.isConnecting = false;
            this.retryCount = 0;
            this.unauthorizedRetryCount = 0;
            this.handleIncomingText(xhr.responseText);
          } else if (xhr.status === 401) {
            xhr.onloadend = null;
            xhr.onerror = null;
            this.handleUnauthorizedAndRefresh();
          } else if (xhr.status === 403) {
            xhr.onloadend = null;
            xhr.onerror = null;
            // Forbidden role/account; stop stream to avoid flooding
            this.stop();
          }
        }
      };

      xhr.onprogress = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          this.isConnected = true;
          this.isConnecting = false;
          this.handleIncomingText(xhr.responseText);
        }
      };

      xhr.onerror = () => {
        this.handleDisconnectAndRetry();
      };

      xhr.onloadend = () => {
        this.handleDisconnectAndRetry();
      };

      xhr.send();
    } catch (err) {
      this.isConnecting = false;
      this.handleDisconnectAndRetry();
    }
  }

  private async handleUnauthorizedAndRefresh() {
    this.disconnect();
    if (!this.shouldRun || this.unauthorizedRetryCount >= 2) {
      this.stop();
      return;
    }
    this.unauthorizedRetryCount += 1;
    try {
      const refreshedToken = await refreshAccessTokenSingleFlight();
      if (refreshedToken && this.shouldRun) {
        this.handleDisconnectAndRetry();
        return;
      }
    } catch {
      // Refresh failed; fall through to stop
    }
    this.stop();
  }

  private disconnect() {
    if (this.xhr) {
      try {
        this.xhr.abort();
      } catch {}
      this.xhr = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }

  private handleDisconnectAndRetry() {
    this.disconnect();

    if (!this.shouldRun || AppState.currentState !== 'active') return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff: 3s, 6s, 12s, max 30s
    this.retryCount = Math.min(this.retryCount + 1, 5);
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);

    this.reconnectTimer = setTimeout(() => {
      if (this.shouldRun && AppState.currentState === 'active') {
        this.connect();
      }
    }, delay);
  }

  private handleIncomingText(responseText: string) {
    if (!responseText || responseText.length <= this.seenBytes) return;

    const newChunk = responseText.substring(this.seenBytes);
    this.seenBytes = responseText.length;
    this.buffer += newChunk;

    // Process complete SSE message blocks separated by double newline
    const blocks = this.buffer.split(/\r?\n\r?\n/);
    // The last piece might be an incomplete block
    this.buffer = blocks.pop() || '';

    for (const block of blocks) {
      this.parseAndDispatchBlock(block.trim());
    }
  }

  private parseAndDispatchBlock(block: string) {
    if (!block) return;

    const lines = block.split(/\r?\n/);
    let eventName = 'message';
    let dataStr = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const value = line.substring(5).trim();
        dataStr = dataStr ? `${dataStr}\n${value}` : value;
      }
    }

    if (!dataStr) return;

    try {
      const parsedData = JSON.parse(dataStr);
      const notification: NotificationResponse = {
        ...parsedData,
        type: (parsedData.notificationType || parsedData.type || eventName) as any,
        notificationType: parsedData.notificationType || parsedData.type || eventName,
      };

      // Deduplicate: avoid triggering twice for the same notificationId
      if (notification.notificationId) {
        if (this.processedNotificationIds.has(notification.notificationId)) {
          return;
        }
        this.processedNotificationIds.add(notification.notificationId);

        // Keep set size reasonable
        if (this.processedNotificationIds.size > 200) {
          const arr = Array.from(this.processedNotificationIds);
          this.processedNotificationIds = new Set(arr.slice(arr.length - 100));
        }
      }

      // Notify all registered listeners
      this.listeners.forEach(listener => {
        try {
          listener(notification);
        } catch (listenerErr) {
          console.log('Error in notification listener:', listenerErr);
        }
      });
    } catch {
      // Non-JSON SSE message (e.g., connection ping), safely ignore
    }
  }
}

export const sseNotificationClient = new SseNotificationClient();
