"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { deletePaymentAsSuperAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

function notify(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function DeletePaymentButton({
  paymentId,
  invoiceNumber,
  studentName,
}: {
  paymentId: string;
  invoiceNumber: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    const formData = new FormData();
    formData.set("paymentId", paymentId);

    startTransition(async () => {
      try {
        const result = await deletePaymentAsSuperAdmin(formData);
        setOpen(false);
        notify({
          type: "success",
          title: "Pembayaran dihapus",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal menghapus",
          description:
            error instanceof Error ? error.message : "Pembayaran tidak bisa dihapus.",
        });
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
        onClick={() => setOpen(true)}
        aria-label={`Hapus pembayaran ${invoiceNumber}`}
      >
        <Trash2 className="size-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex justify-end p-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Tutup modal"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="px-6 pb-6 text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <AlertTriangle className="size-9" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-slate-950">
                Hapus pembayaran?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {invoiceNumber} milik {studentName} akan dihapus dari laporan.
                Status tagihan akan dikembalikan sesuai payment yang tersisa.
              </p>
              <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700">
                Aksi ini hanya untuk Super Admin dan akan dicatat di audit log.
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 bg-white"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="h-11 bg-rose-600 text-white hover:bg-rose-700"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Ya, Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
