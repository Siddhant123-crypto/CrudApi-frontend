import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  TextInput,
} from 'react-native';
import {
  computeAiChatScrollMetrics,
  shouldAutoScrollAiChat,
} from '../utils/aiChatKeyboardUtils';

interface UseAiChatKeyboardOptions {
  messagesCount: number;
  isSending: boolean;
}

/**
 * Shared keyboard persistence and scroll controller for Customer & Farmer AI Chat.
 * Ensures scrolling never dismisses the keyboard, tapping suggested questions keeps
 * the keyboard open if already active, and auto-scroll respects manual reading.
 */
export function useAiChatKeyboard({
  messagesCount,
  isSending,
}: UseAiChatKeyboardOptions) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const isKeyboardOpenRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const pendingSubmitScrollRef = useRef(false);
  const showScrollBottomRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleScrollToBottom = useCallback((delayMs = 90) => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      flatListRef.current?.scrollToEnd({ animated: true });
    }, delayMs);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardOpen(true);
      isKeyboardOpenRef.current = true;
      if (
        shouldAutoScrollAiChat({
          hasPendingSubmitScroll: pendingSubmitScrollRef.current,
          isNearBottom: isNearBottomRef.current,
        })
      ) {
        scheduleScrollToBottom(Platform.OS === 'ios' ? 60 : 100);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardOpen(false);
      isKeyboardOpenRef.current = false;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [scheduleScrollToBottom]);

  useEffect(() => {
    if (
      (messagesCount > 0 || isSending) &&
      shouldAutoScrollAiChat({
        hasPendingSubmitScroll: pendingSubmitScrollRef.current,
        isNearBottom: isNearBottomRef.current,
      })
    ) {
      scheduleScrollToBottom(100);
      if (!isSending && messagesCount > 0) {
        pendingSubmitScrollRef.current = false;
      }
    }
  }, [messagesCount, isSending, scheduleScrollToBottom]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const metrics = computeAiChatScrollMetrics({
        contentHeight: contentSize.height,
        viewportHeight: layoutMeasurement.height,
        offsetY: contentOffset.y,
      });

      isNearBottomRef.current = metrics.isNearBottom;
      if (!metrics.isNearBottom && pendingSubmitScrollRef.current) {
        pendingSubmitScrollRef.current = false;
      }

      if (metrics.shouldShowScrollButton !== showScrollBottomRef.current) {
        showScrollBottomRef.current = metrics.shouldShowScrollButton;
        setShowScrollBottom(metrics.shouldShowScrollButton);
      }
    },
    [],
  );

  const handleContentSizeChange = useCallback(() => {
    if (
      shouldAutoScrollAiChat({
        hasPendingSubmitScroll: pendingSubmitScrollRef.current,
        isNearBottom: isNearBottomRef.current,
      })
    ) {
      scheduleScrollToBottom(40);
      if (!isSending && pendingSubmitScrollRef.current) {
        pendingSubmitScrollRef.current = false;
      }
    }
  }, [isSending, scheduleScrollToBottom]);

  const scrollToBottom = useCallback(() => {
    pendingSubmitScrollRef.current = false;
    isNearBottomRef.current = true;
    showScrollBottomRef.current = false;
    setShowScrollBottom(false);
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const prepareSubmit = useCallback((preserveKeyboardFocus: boolean) => {
    pendingSubmitScrollRef.current = true;
    isNearBottomRef.current = true;
    showScrollBottomRef.current = false;
    setShowScrollBottom(false);

    if (preserveKeyboardFocus && isKeyboardOpenRef.current) {
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
    }
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    isKeyboardOpen,
    isKeyboardOpenRef,
    showScrollBottom,
    textInputRef,
    flatListRef,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
    prepareSubmit,
    dismissKeyboard,
  };
}
