import { useEffect } from 'react';

interface ShortcutOptions {
  metaKey?: boolean;
  ctrlKey?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const { metaKey = false, ctrlKey = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (!e.key || e.key.toLowerCase() !== key.toLowerCase()) return;
      if (metaKey && !e.metaKey && !e.ctrlKey) return;
      if (ctrlKey && !e.ctrlKey) return;

      e.preventDefault();
      callback();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key, callback, metaKey, ctrlKey, enabled]);
}
