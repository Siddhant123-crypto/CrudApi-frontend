import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import {
  getChatClearedKey,
  CHAT_CLEARED_PREFIX,
  getDeletedMessagesKey,
  DELETED_MESSAGES_PREFIX,
} from '../utils/aiChatHelpers';

export * from '../utils/aiChatHelpers';

export interface AiChatMessage {
  id: string;
  historyId?: string;
  sender: 'USER' | 'AI';
  text: string;
  summary?: string;
  sources?: string[];
  createdAt: string;
  data?: any;
  error?: boolean;
  errorMessage?: string;
  canRetry?: boolean;
}

export interface AiChatApiResponseData {
  id?: string;
  answer: string;
  summary?: string;
  role?: string;
  model?: string;
  sources?: string[];
  products?: any[];
}

export interface AiChatApiResponse {
  message: string;
  data: AiChatApiResponseData | null;
}

export interface AiHistoryItemResponse {
  id: string;
  question: string;
  answer: string;
  role?: string;
  model?: string;
  language?: string;
  sources?: string[];
  createdAt: string;
}

export interface AiHistoryPageResponse {
  content: AiHistoryItemResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface AiHistoryApiResponse {
  message: string;
  data: AiHistoryPageResponse | null;
}

export interface AiStatusResponse {
  message: string;
  data: {
    available: boolean;
    llmAvailable?: boolean;
    mode?: string;
    model?: string;
  } | null;
}

export const getChatClearedTimestamp = async (userId?: string | null): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(getChatClearedKey(userId));
  } catch {
    return null;
  }
};

export const setChatClearedTimestamp = async (userId?: string | null): Promise<string> => {
  const now = new Date().toISOString();
  try {
    await AsyncStorage.setItem(getChatClearedKey(userId), now);
  } catch (err) {
    console.log('Error saving chat cleared timestamp:', err);
  }
  return now;
};

export const clearChatTimestampOnLogout = async (userId?: string | null): Promise<void> => {
  try {
    if (userId) {
      await AsyncStorage.removeItem(getChatClearedKey(userId));
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter((k) => k.startsWith(CHAT_CLEARED_PREFIX));
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
      }
    }
  } catch (err) {
    console.log('Error removing chat cleared timestamp on logout:', err);
  }
};

/**
 * Sends a message to the backend AI assistant with a 120-second timeout.
 */
export const sendAiChatMessage = async (
  message: string,
  language?: string
): Promise<AiChatApiResponse> => {
  const payload: { message: string; language?: string } = {
    message: message.trim(),
  };
  if (language && language.trim() !== '') {
    payload.language = language.trim();
  }

  const response = await api.post<AiChatApiResponse>('/api/ai/chat', payload, {
    timeout: 120000, // 120s timeout for local Ollama / AI models
  });

  return response.data;
};

/**
 * Fetches recent chat history.
 */
export const getAiChatHistory = async (
  page = 0,
  size = 50
): Promise<AiHistoryApiResponse> => {
  const response = await api.get<AiHistoryApiResponse>('/api/ai/history', {
    params: { page, size },
    timeout: 30000,
  });

  return response.data;
};

/**
 * Checks AI service availability.
 */
export const getAiServiceStatus = async (): Promise<AiStatusResponse> => {
  const response = await api.get<AiStatusResponse>('/api/ai/status', {
    timeout: 15000,
  });

  return response.data;
};
export const getDeletedMessageIds = async (userId?: string | null): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(getDeletedMessagesKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveDeletedMessageIds = async (
  newIds: string[],
  userId?: string | null
): Promise<string[]> => {
  try {
    const existing = await getDeletedMessageIds(userId);
    const combined = Array.from(new Set([...existing, ...newIds]));
    await AsyncStorage.setItem(getDeletedMessagesKey(userId), JSON.stringify(combined));
    return combined;
  } catch (err) {
    console.log('Error saving deleted message IDs to AsyncStorage:', err);
    return newIds;
  }
};

/**
 * Permanently deletes chat history items on the backend database.
 */
export const deleteAiChatHistory = async (
  historyIds: string[],
  messageIds?: string[]
): Promise<void> => {
  try {
    await api.delete('/api/ai/history', {
      data: {
        historyIds,
        messageIds,
      },
    });
  } catch (err) {
    console.log('Error deleting chat history from backend:', err);
  }
};

