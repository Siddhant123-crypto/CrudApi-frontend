export interface FocusedScrollCalculationInput {
  scrollY: number;
  scrollViewTop: number;
  scrollViewHeight: number;
  inputTop: number;
  inputHeight: number;
  windowHeight: number;
  keyboardHeight: number;
  keyboardScreenY?: number;
  bottomMargin?: number;
  topMargin?: number;
}

/**
 * Computes the target ScrollView vertical offset needed to keep a focused
 * registration input (plus its label and validation message) completely visible
 * above the soft keyboard. Returns null when the input is already comfortably visible.
 */
export function computeFocusedInputScrollY(
  params: FocusedScrollCalculationInput,
): number | null {
  const {
    scrollY,
    scrollViewTop,
    scrollViewHeight,
    inputTop,
    inputHeight,
    windowHeight,
    keyboardHeight,
    keyboardScreenY,
    bottomMargin = 42,
    topMargin = 32,
  } = params;

  if (keyboardHeight <= 0 || scrollViewHeight <= 0 || windowHeight <= 0) {
    return null;
  }

  const scrollViewBottom = scrollViewTop + scrollViewHeight;
  const fallbackKeyboardTop = windowHeight - keyboardHeight;
  const keyboardTop =
    typeof keyboardScreenY === 'number' && keyboardScreenY > 0
      ? Math.min(fallbackKeyboardTop, keyboardScreenY)
      : fallbackKeyboardTop;

  const visibleBottom = Math.min(scrollViewBottom, keyboardTop);
  const desiredBottom = inputTop + inputHeight + bottomMargin;
  const desiredTop = inputTop - topMargin;

  if (desiredBottom > visibleBottom) {
    const delta = desiredBottom - visibleBottom;
    return Math.max(0, Math.round(scrollY + delta));
  }

  if (desiredTop < scrollViewTop) {
    const delta = scrollViewTop - desiredTop;
    return Math.max(0, Math.round(scrollY - delta));
  }

  return null;
}

/**
 * Returns the bottom content padding required inside a registration ScrollView
 * so the final input fields and submit action remain comfortably reachable when
 * the keyboard is open or closed.
 */
export function getRegistrationScrollBottomPadding(
  keyboardHeight: number,
  basePadding = 44,
  extraClearance = 36,
): number {
  if (keyboardHeight > 0) {
    return Math.max(basePadding, Math.round(keyboardHeight + extraClearance));
  }
  return basePadding;
}
