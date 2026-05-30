"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary text-sm">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "btn-danger text-sm"
                : "btn-primary text-sm"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
