"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { approvePayment, rejectPayment } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function notify(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function PaymentVerificationActions({ paymentId }: { paymentId: string }) {
  const [reason, setReason] = useState("");
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const router = useRouter();

  function approve() {
    const formData = new FormData();
    formData.set("paymentId", paymentId);

    startApprove(async () => {
      try {
        await approvePayment(formData);
        notify({
          type: "success",
          title: "Pembayaran disetujui",
          description: "Invoice sudah berubah menjadi lunas.",
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal menyetujui",
          description: error instanceof Error ? error.message : "Pembayaran tidak bisa diproses.",
        });
      }
    });
  }

  function reject() {
    const formData = new FormData();
    formData.set("paymentId", paymentId);
    formData.set("rejectionReason", reason);

    startReject(async () => {
      try {
        await rejectPayment(formData);
        notify({
          type: "success",
          title: "Pembayaran ditolak",
          description: "Alasan penolakan tersimpan untuk orang tua.",
        });
        setReason("");
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal menolak",
          description: error instanceof Error ? error.message : "Pembayaran tidak bisa ditolak.",
        });
      }
    });
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        onClick={approve}
        disabled={isApproving || isRejecting}
        className="h-9 w-full bg-[#10b447] text-white hover:bg-[#078435]"
      >
        {isApproving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Setujui
      </Button>
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Alasan penolakan..."
        className="min-h-16 bg-white"
      />
      <Button
        type="button"
        onClick={reject}
        disabled={isApproving || isRejecting || !reason.trim()}
        variant="outline"
        className="h-9 border-rose-200 bg-white text-rose-700"
      >
        {isRejecting ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
        Tolak
      </Button>
    </div>
  );
}
