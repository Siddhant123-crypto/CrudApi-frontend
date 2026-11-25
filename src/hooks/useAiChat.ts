import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AiChatMessage,
  sendAiChatMessage,
  getAiChatHistory,
  getAiServiceStatus,
  getChatClearedTimestamp,
  setChatClearedTimestamp,
  getDeletedMessageIds,
  saveDeletedMessageIds,
  deleteAiChatHistory,
  INITIAL_SUGGESTION_CHIPS,
  getFollowUpSuggestions,
} from '../services/aiService';
import {
  CUSTOMER_INITIAL_SUGGESTION_CHIPS,
  getCustomerFollowUpSuggestions,
} from '../utils/aiChatHelpers';

export interface UseAiChatOptions {
  userId?: string | null;
  role?: 'FARMER' | 'CUSTOMER';
  initialChips?: string[];
}

export function useAiChat({ userId, role = 'FARMER', initialChips }: UseAiChatOptions = {}) {
  const isCustomer = role === 'CUSTOMER';
  const followUpFn = isCustomer ? getCustomerFollowUpSuggestions : getFollowUpSuggestions;
  const activeInitialChips = initialChips || (isCustomer ? CUSTOMER_INITIAL_SUGGESTION_CHIPS : INITIAL_SUGGESTION_CHIPS);

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [followUpChips, setFollowUpChips] = useState<string[]>([]);
  const isSendingRef = useRef(false);

  // Check AI Service Status
  // Note: Farm2Home's built-in knowledge base, farmer advisory, FAQ, and live catalog search
  // operate inside the backend even when optional local Ollama LLM is offline in cloud production.
  const checkStatus = useCallback(async () => {
    try {
      await getAiServiceStatus();
      setIsAiAvailable(true);
      setStatusMessage(null);
    } catch {
      // If status call fails transiently, allow chat requests to determine availability
      setIsAiAvailable(true);
      setStatusMessage(null);
    }
  }, []);

  // Load chat history filtered by clearedAt timestamp and deleted IDs
  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const [historyRes, clearedAt, deletedIds] = await Promise.all([
        getAiChatHistory(0, 50).catch(() => null),
        getChatClearedTimestamp(userId),
        getDeletedMessageIds(userId),
      ]);

      const clearedTime = clearedAt ? new Date(clearedAt).getTime() : 0;
      const deletedSet = new Set(deletedIds || []);

      if (historyRes && historyRes.data && historyRes.data.content) {
        const rawItems = historyRes.data.content;
        const mappedMessages: AiChatMessage[] = [];

        // Reverse rawItems if backend returned latest first, so chronological in UI
        const sortedItems = [...rawItems].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        for (const item of sortedItems) {
          const itemTime = new Date(item.createdAt).getTime();
          // Hide items older than or equal to chatClearedAt
          if (clearedTime > 0 && itemTime <= clearedTime) {
            continue;
          }

          const qId = `${item.id}-q`;
          const aId = `${item.id}-a`;

          // If entire turn was deleted, skip
          if (deletedSet.has(item.id)) {
            continue;
          }

          if (item.question && item.question.trim() && !deletedSet.has(qId)) {
            mappedMessages.push({
              id: qId,
              historyId: item.id,
              sender: 'USER',
              text: item.question,
              createdAt: item.createdAt,
            });
          }

          if (item.answer && item.answer.trim() && !deletedSet.has(aId)) {
            mappedMessages.push({
              id: aId,
              historyId: item.id,
              sender: 'AI',
              text: item.answer,
              sources: item.sources || [],
              createdAt: item.createdAt,
            });
          }
        }

        setMessages(mappedMessages);

        // Compute follow-up chips from the last question/answer
        if (mappedMessages.length > 0) {
          const lastMsg = mappedMessages[mappedMessages.length - 1];
          const lastUserMsg = [...mappedMessages]
            .reverse()
            .find((m) => m.sender === 'USER');
          if (lastMsg.sender === 'AI' && lastUserMsg) {
            setFollowUpChips(followUpFn(lastUserMsg.text, lastMsg.text));
          }
        }
      }
    } catch (err) {
      console.log('Error loading AI chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
    loadHistory();
  }, [checkStatus, loadHistory]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSendingRef.current) return;

      isSendingRef.current = true;
      setIsSending(true);
      setFollowUpChips([]); // Clear chips while sending

      const userMsgId = `user-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const userMessage: AiChatMessage = {
        id: userMsgId,
        sender: 'USER',
        text: trimmed,
        createdAt: nowIso,
      };

      // Optimistic update
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await sendAiChatMessage(trimmed);
        if (response && response.data) {
          const backendId = response.data.id;
          const aiMessage: AiChatMessage = {
            id: backendId ? `${backendId}-a` : `ai-${Date.now()}`,
            historyId: backendId,
            sender: 'AI',
            text: response.data.answer,
            summary: response.data.summary,
            sources: response.data.sources || [],
            data: response.data,
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId && backendId
                ? { ...m, id: `${backendId}-q`, historyId: backendId }
                : m
            ).concat(aiMessage)
          );

          setFollowUpChips(followUpFn(trimmed, response.data.answer));
        } else {
          throw new Error('Empty response from AI server');
        }
      } catch (err: any) {
        const status = err?.response?.status;
        let friendlyMessage = 'AI abhi busy hai, dobara koshish karein.';

        if (status === 429) {
          friendlyMessage =
            'Aap bahut jaldi sawaal bhej rahe hain, thodi der baad try karein.';
        } else if (err?.code === 'ECONNABORTED' || status === 504) {
          friendlyMessage = 'AI abhi busy hai, dobara koshish karein.';
        } else if (status === 401) {
          friendlyMessage = 'Session expire ho gaya hai, kripya dobara login karein.';
        }

        const errorAiMessage: AiChatMessage = {
          id: `ai-err-${Date.now()}`,
          sender: 'AI',
          text: friendlyMessage,
          createdAt: new Date().toISOString(),
          error: true,
          errorMessage: friendlyMessage,
          canRetry: status !== 401,
        };

        setMessages((prev) => [...prev, errorAiMessage]);
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
      }
    },
    [followUpFn]
  );

  // Retry sending the last user message
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'USER');
    if (lastUserMessage) {
      // Remove any trailing error message
      setMessages((prev) => prev.filter((m) => !m.error));
      sendMessage(lastUserMessage.text);
    }
  }, [messages, sendMessage]);

  // Permanently delete selected messages
  const deleteMessages = useCallback(
    async (idsToDelete: string[]) => {
      if (!idsToDelete || idsToDelete.length === 0) return;

      // 1. Immediately remove from local messages state
      setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));

      // 2. Persist to AsyncStorage
      await saveDeletedMessageIds(idsToDelete, userId);

      // 3. Extract DB history UUIDs
      const historyIdsSet = new Set<string>();
      for (const id of idsToDelete) {
        const matchingMsg = messages.find((m) => m.id === id);
        if (matchingMsg?.historyId) {
          historyIdsSet.add(matchingMsg.historyId);
        } else if (id.endsWith('-q') || id.endsWith('-a')) {
          const hId = id.substring(0, id.length - 2);
          if (hId) historyIdsSet.add(hId);
        }
      }

      // 4. Send delete request to backend database
      await deleteAiChatHistory(Array.from(historyIdsSet), idsToDelete);
    },
    [userId, messages]
  );

  // Clear chat locally and persist timestamp
  const clearChat = useCallback(async () => {
    await setChatClearedTimestamp(userId);
    setMessages([]);
    setFollowUpChips([]);
  }, [userId]);

  return {
    messages,
    loadingHistory,
    isSending,
    isAiAvailable,
    statusMessage,
    followUpChips,
    initialChips: activeInitialChips,
    sendMessage,
    retryLastMessage,
    deleteMessages,
    clearChat,
    reloadHistory: loadHistory,
    checkStatus,
  };
}
