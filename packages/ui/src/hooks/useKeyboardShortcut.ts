import { useEffect } from 'react';

export function useKeyboardShortcut(keys: string[], callback: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const match = keys.every(key => {
        if (key === 'mod') return event.metaKey || event.ctrlKey;
        if (key === 'shift') return event.shiftKey;
        if (key === 'alt') return event.altKey;
        return event.key.toLowerCase() === key.toLowerCase();
      });
      if (match) callback();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys, callback]);
}