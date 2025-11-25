import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  disabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts
 * Automatically prevents default behavior and stops propagation
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const shortcut = shortcuts.find(s => s.key.toLowerCase() === key && !s.disabled);

      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

// Common shortcut definitions
export const getExecutionShortcuts = (handlers: {
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward?: () => void;
  onReset: () => void;
  canStep: boolean;
  canStepBack?: boolean;
}): KeyboardShortcut[] => [
  {
    key: ' ',
    description: 'Play / Pause',
    action: handlers.onPlayPause,
    disabled: !handlers.canStep,
  },
  {
    key: 'k',
    description: 'Play / Pause',
    action: handlers.onPlayPause,
    disabled: !handlers.canStep,
  },
  {
    key: 's',
    description: 'Step Forward',
    action: handlers.onStepForward,
    disabled: !handlers.canStep,
  },
  {
    key: 'b',
    description: 'Step Backward',
    action: handlers.onStepBackward || (() => {}),
    disabled: !handlers.canStepBack,
  },
  {
    key: 'r',
    description: 'Reset',
    action: handlers.onReset,
  },
];
