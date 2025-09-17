"use client";

import React from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  top?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: string;
  modalStyle?: React.CSSProperties;
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  top,
  footer,
  children,
  maxWidth = "max-w-3xl",
  modalStyle,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-4 py-6"
      aria-modal="true"
      role="dialog"
      aria-label={title ?? "Modal"}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full ${maxWidth} mx-4 rounded-lg shadow-lg overflow-hidden`}
        style={{ background: "transparent", zIndex: 70, ...(modalStyle ?? {}) }}
      >
        <div style={{ background: "#F7F9FF", borderBottom: "1px solid #E2E8F8" }}>
          <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
            <div>
              {title && (
                <div className="text-lg font-semibold" style={{ color: "#1F2A44" }}>
                  {title}
                </div>
              )}
              {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
          {top}
        </div>
        <div style={{ background: "#FFFFFF" }}>
          <div
            className="max-w-5xl mx-auto px-6 py-6"
            style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}
          >
            {children}
          </div>
        </div>
        {footer && (
          <div style={{ background: "#F7F9FF", borderTop: "1px solid #E2E8F8" }}>
            <div className="max-w-5xl mx-auto px-6 py-4">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
