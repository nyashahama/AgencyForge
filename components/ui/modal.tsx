"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 id="modal-title" className="font-serif text-3xl tracking-[-0.04em]">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-[var(--surface-muted)] text-lg transition hover:bg-[var(--surface-strong)]"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] px-6 py-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
