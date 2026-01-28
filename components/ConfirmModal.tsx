import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6 transform transition-all">
        <h3 className="text-xl font-bold text-[var(--text)] mb-3">{title}</h3>
        <p className="text-sm text-[var(--muted)] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--row-hover)] transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-slate-900 font-bold hover:bg-[var(--success)] transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
