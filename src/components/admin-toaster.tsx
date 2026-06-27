"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type ToastPayload = {
  type?: "success" | "error";
  title: string;
  description?: string;
};

type ToastItem = ToastPayload & {
  id: number;
};

declare global {
  interface WindowEventMap {
    "azkia-toast": CustomEvent<ToastPayload>;
  }
}

export function AdminToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(event: WindowEventMap["azkia-toast"]) {
      const id = Date.now();
      setToasts((items) => [...items, { id, type: "success", ...event.detail }]);
      window.setTimeout(() => {
        setToasts((items) => items.filter((item) => item.id !== id));
      }, 3600);
    }

    window.addEventListener("azkia-toast", onToast);
    return () => window.removeEventListener("azkia-toast", onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[70] grid w-[min(420px,calc(100vw-2rem))] gap-3">
      {toasts.map((toast) => {
        const success = toast.type !== "error";
        const Icon = success ? CheckCircle2 : XCircle;

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border bg-white p-4 shadow-xl ${
              success ? "border-[#b7d889]" : "border-rose-200"
            }`}
          >
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                success ? "bg-[#e7f3d7] text-[#078435]" : "bg-rose-100 text-rose-700"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-950">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm leading-5 text-slate-500">{toast.description}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
              aria-label="Tutup notifikasi"
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
