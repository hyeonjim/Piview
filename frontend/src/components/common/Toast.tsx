"use client";

interface ToastProps {
  msg: string;
}

export function Toast({ msg }: ToastProps) {
  if (!msg) return null;
  return (
    <div className="fixed top-16 left-1/2 z-[60] -translate-x-1/2 pointer-events-none px-[18px] py-[10px] rounded-[40px] bg-[rgba(40,40,40,0.88)] text-white text-xs font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-sm whitespace-nowrap">
      {msg}
    </div>
  );
}
