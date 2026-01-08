import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  disabled?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
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
      
      // Don't trigger shortcuts when inside a dialog/modal
      if (target.closest('[role="dialog"]') || target.closest('[data-radix-dialog-content]')) {
        return;
      }

      const key = event.key.toLowerCase();
      
      const shortcut = shortcuts.find(s => {
        if (s.disabled) return false;
        if (s.key.toLowerCase() !== key) return false;
        
        // Check modifier keys
        const needsCtrl = s.ctrl || s.meta;
        const hasCtrl = event.ctrlKey || event.metaKey;
        if (needsCtrl && !hasCtrl) return false;
        if (!needsCtrl && hasCtrl) return false;
        
        if (s.shift && !event.shiftKey) return false;
        if (!s.shift && event.shiftKey && key.length === 1) return false;
        
        if (s.alt && !event.altKey) return false;
        if (!s.alt && event.altKey) return false;
        
        return true;
      });

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
