import { X } from 'lucide-react';
import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

interface ModalProps {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current
      ?.querySelector<HTMLElement>('[data-autofocus]')
      ?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        aria-describedby="modal-description"
        aria-labelledby="modal-title"
        aria-modal="true"
        className="max-h-[min(90vh,760px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-6">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight text-ink-950"
              id="modal-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-400" id="modal-description">
              {description}
            </p>
          </div>
          <button
            aria-label="Fechar janela"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
