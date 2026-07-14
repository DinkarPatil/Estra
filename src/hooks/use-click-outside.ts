import { useEffect, type RefObject } from 'react';

export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const isInside = refs.some((ref) => ref.current?.contains(target));
      if (!isInside) handler();
    }

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [refs, handler, enabled]);
}
