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
  bodyClassName?: string;
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
  bodyClassName,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center px-2 py-3 sm:items-center sm:px-4 sm:py-6"
      aria-modal="true"
      role="dialog"
      aria-label={title ?? "Modal"}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full ${maxWidth} mx-0 overflow-hidden rounded-t-xl shadow-lg sm:mx-4 sm:rounded-lg`}
        style={{ background: "transparent", zIndex: 70, ...(modalStyle ?? {}) }}
      >
        <div style={{ background: "#F7F9FF", borderBottom: "1px solid #E2E8F8" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <div>
              {title && (
                <div
                  className="text-[18px] font-medium sm:text-[20px]"
                  style={{ color: "#191F33" }}
                >
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-[14px] font-normal sm:text-[16px]" style={{ color: "#5A6480" }}>
                  {subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="cursor-pointer p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
          {top}
        </div>
        <div style={{ background: "#FFFFFF" }}>
          <div
            className={`max-h-[calc(100vh-220px)] overflow-x-hidden overflow-y-auto px-4 py-4 sm:max-h-[calc(100vh-180px)] sm:px-6 sm:py-6 max-w-5xl mx-auto ${bodyClassName ?? ""}`}
            style={{ overscrollBehaviorX: "contain" }}
          >
            {children}
          </div>
        </div>
        {footer && (
          <div style={{ background: "#F7F9FF", borderTop: "1px solid #E2E8F8" }}>
            <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-4">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
