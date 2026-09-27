import { useEffect, useRef } from 'react';

/** Keyboard and focus behavior for the existing modal markup. */
export function useModalFocus(
  isOpen: boolean,
  pending: boolean,
  onClose: () => void,
) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const behavior = useRef({ pending, onClose });
  useEffect(() => {
    behavior.current = { pending, onClose };
  }, [pending, onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const controls = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [],
      );
    (controls()[0] ?? dialog)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!behavior.current.pending) behavior.current.onClose();
      }
      if (event.key === 'Tab') {
        const items = controls();
        if (!items.length) {
          event.preventDefault();
          dialog?.focus();
          return;
        }
        const first = items[0],
          last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !dialog?.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !dialog?.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, [isOpen]);
  return dialogRef;
}
