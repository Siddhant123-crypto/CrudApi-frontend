export interface AiChatScrollMetricsInput {
  contentHeight: number;
  viewportHeight: number;
  offsetY: number;
  nearBottomThreshold?: number;
  scrollButtonMinOverflow?: number;
}

export interface AiChatScrollMetrics {
  distanceFromBottom: number;
  isNearBottom: boolean;
  shouldShowScrollButton: boolean;
}

/**
 * Evaluates scroll position relative to the bottom of the AI chat transcript
 * so automatic scrolling respects manual upward reading while keeping the
 * scroll-to-bottom control accurate.
 */
export function computeAiChatScrollMetrics(
  input: AiChatScrollMetricsInput,
): AiChatScrollMetrics {
  const {
    contentHeight,
    viewportHeight,
    offsetY,
    nearBottomThreshold = 120,
    scrollButtonMinOverflow = 60,
  } = input;

  if (contentHeight <= viewportHeight + scrollButtonMinOverflow) {
    return {
      distanceFromBottom: 0,
      isNearBottom: true,
      shouldShowScrollButton: false,
    };
  }

  const distanceFromBottom = Math.max(
    0,
    contentHeight - (viewportHeight + offsetY),
  );
  const isNearBottom = distanceFromBottom <= nearBottomThreshold;

  return {
    distanceFromBottom,
    isNearBottom,
    shouldShowScrollButton: distanceFromBottom > nearBottomThreshold,
  };
}

/**
 * Determines whether the chat list should automatically scroll to the latest
 * message/follow-up chips without interrupting a user who scrolled up to read
 * earlier responses.
 */
export function shouldAutoScrollAiChat(params: {
  hasPendingSubmitScroll: boolean;
  isNearBottom: boolean;
}): boolean {
  return params.hasPendingSubmitScroll || params.isNearBottom;
}
