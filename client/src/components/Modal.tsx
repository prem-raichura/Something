import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

const SCRIM =
  "fixed inset-0 z-[100] flex bg-[#0B1020]/50 backdrop-blur-[3px] animate-[fadeIn_0.15s_ease-out]";

const CARD =
  "w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-20px_rgba(11,16,32,0.45)] animate-fade-up";

// Lock body scroll + close on Escape while a modal is mounted.
function useModalEffects(onClose: () => void) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", h);
    };
  }, [onClose]);
}

interface ShellProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string; // tailwind max-w-* class
}

// Centered dialog — portaled to <body> so it escapes any transformed ancestor.
export function ModalShell({ onClose, children, maxWidth = "max-w-md" }: ShellProps) {
  useModalEffects(onClose);
  return createPortal(
    <div className={`${SCRIM} items-center justify-center p-4`} onClick={onClose}>
      <div className={`${CARD} ${maxWidth}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Right-side slide-over drawer — also portaled to <body>.
export function DrawerShell({ onClose, children, maxWidth = "max-w-md" }: ShellProps) {
  useModalEffects(onClose);
  return createPortal(
    <div className={`${SCRIM} justify-end`} onClick={onClose}>
      <div
        className={`flex h-full w-full ${maxWidth} flex-col border-l border-[#E6E8EE] bg-white shadow-[-20px_0_60px_-15px_rgba(11,16,32,0.3)] animate-fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
