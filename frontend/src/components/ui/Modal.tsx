"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Clicking outside the panel closes the modal, which is the normal
          expected behavior for a lightweight dialog like this. */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* This is the actual modal card. The `size` prop lets pages reuse the
          same component for small confirmations and larger forms. */}
      <div
        className={clsx(
          "relative w-full bg-white rounded-2xl shadow-xl animate-fade-in",
          "border border-gray-100",
          sizeStyles[size]
        )}
      >
        {/* Standard modal header when a title is provided. */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Even if the modal has no title, it still needs a visible close button. */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Page-specific content gets rendered here. */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
export type { ModalProps };
