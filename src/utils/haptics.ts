/**
 * Modern Web Haptic Feedback Utility
 * Provides tactile haptic vibration patterns for mobile PWA interactions.
 * Gracefully degrades when the Vibration API is unsupported.
 */

export const triggerHaptic = (pattern: number | number[] = 10): boolean => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
};

export const hapticFeedback = {
  /** Light click tick (10ms) - ideal for steppers, toggle switches, buttons */
  light: () => triggerHaptic(10),

  /** Medium tick (25ms) - ideal for card selection, tab changes, filter chips */
  medium: () => triggerHaptic(25),

  /** Success fanfare pattern (15ms, 40ms pause, 25ms) - ideal for saving, copying, goal reached */
  success: () => triggerHaptic([15, 40, 25]),

  /** Warning / Error pattern (30ms, 50ms pause, 40ms) - ideal for validation errors, delete confirmations */
  error: () => triggerHaptic([30, 50, 40]),

  /** Milestone celebration pattern - ideal for trophy unlocked */
  celebrate: () => triggerHaptic([20, 30, 20, 30, 40])
};
