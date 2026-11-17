"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Native modal semantics provide focus trapping, Escape and focus restoration. */
export function BottomSheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  footer,
}: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      dialog.close();
      return;
    }
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/40 sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-2">
        <h2 id={titleId} className="text-base font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="p-4">{children}</div>
      {footer && (
        <div className="sticky bottom-0 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </dialog>
  );
}
