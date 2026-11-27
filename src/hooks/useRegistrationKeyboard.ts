import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  computeFocusedInputScrollY,
  getRegistrationScrollBottomPadding,
} from '../utils/registrationKeyboardUtils';

/**
 * Shared keyboard responsiveness hook for long registration forms.
 * Keeps the currently focused input cleanly above the soft keyboard on both
 * Android and iOS without dismissing the keyboard during scrolling.
 */
export function useRegistrationKeyboard() {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const keyboardScreenYRef = useRef<number | undefined>(undefined);
  const focusedInputRef = useRef<TextInput | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollToInput = useCallback((targetInput?: TextInput | null) => {
    const scrollNode = scrollViewRef.current as any;
    const inputNode = targetInput as any;
    if (
      !scrollNode ||
      !inputNode ||
      typeof scrollNode.measureInWindow !== 'function' ||
      typeof inputNode.measureInWindow !== 'function'
    ) {
      return;
    }

    const activeKeyboardHeight = keyboardHeightRef.current;
    if (activeKeyboardHeight <= 0) {
      return;
    }

    scrollNode.measureInWindow(
      (_sx: number, scrollViewTop: number, _sw: number, scrollViewHeight: number) => {
        inputNode.measureInWindow(
          (_ix: number, inputTop: number, _iw: number, inputHeight: number) => {
            const targetY = computeFocusedInputScrollY({
              scrollY: scrollYRef.current,
              scrollViewTop,
              scrollViewHeight,
              inputTop,
              inputHeight,
              windowHeight: Dimensions.get('window').height,
              keyboardHeight: activeKeyboardHeight,
              keyboardScreenY: keyboardScreenYRef.current,
            });
            if (targetY !== null) {
              scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
            }
          },
        );
      },
    );
  }, []);

  const scheduleScrollToFocused = useCallback(
    (delayMs: number) => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        if (focusedInputRef.current && keyboardHeightRef.current > 0) {
          scrollToInput(focusedInputRef.current);
        }
      }, delayMs);
    },
    [scrollToInput],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      const height = event?.endCoordinates?.height || 0;
      const screenY = event?.endCoordinates?.screenY;
      keyboardHeightRef.current = height;
      keyboardScreenYRef.current = typeof screenY === 'number' ? screenY : undefined;
      setKeyboardHeight(height);
      if (focusedInputRef.current) {
        scheduleScrollToFocused(Platform.OS === 'ios' ? 40 : 60);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      keyboardHeightRef.current = 0;
      keyboardScreenYRef.current = undefined;
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [scheduleScrollToFocused]);

  const handleInputFocus = useCallback(
    (inputRef?: React.RefObject<TextInput | null>) => {
      focusedInputRef.current = inputRef?.current ?? null;
      if (keyboardHeightRef.current > 0) {
        scheduleScrollToFocused(Platform.OS === 'ios' ? 50 : 90);
      } else {
        // Fallback if keyboard event arrived slightly before focus
        scheduleScrollToFocused(260);
      }
    },
    [scheduleScrollToFocused],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    scrollViewRef,
    keyboardHeight,
    scrollBottomPadding: getRegistrationScrollBottomPadding(keyboardHeight),
    handleInputFocus,
    handleScroll,
    dismissKeyboard,
  };
}
