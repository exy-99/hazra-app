import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

/**
 * Reads `prefers-reduced-motion` via `AccessibilityInfo` and stays subscribed to
 * `reduceMotionChanged`. Returns `false` until React Native resolves the initial
 * query so callers never see a stale "reduced" value during boot.
 *
 * Only animation logic should consult this; state changes (enter/exit, show/hide)
 * never skip based on it — per design.md §9 and D-03/D-12.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      if (mounted) {
        setReduced(enabled);
      }
    })();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (mounted) {
          setReduced(enabled);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
