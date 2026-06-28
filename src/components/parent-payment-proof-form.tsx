"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Info, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

import { submitPaymentProof } from "@/app/(parent)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function notify(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

function todayInputValue() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function ParentPaymentProofForm({
  invoiceId,
  defaultAmount,
}: {
  invoiceId: string;
  defaultAmount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await submitPaymentProof(formData);
        notify({
          type: "success",
          title: "Bukti terkirim",
          description: result.message,
        });
        router.push("/riwayat");
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal kirim bukti",
          description:
            error instanceof Error
              ? error.message
              : "Periksa nominal, tanggal, dan file bukti.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Konfirmasi Pembayaran</CardTitle>
          <CardDescription>
            Setelah dikirim, status tagihan menjadi Menunggu Verifikasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-sky-200 bg-sky-50 text-sky-900">
            <Info className="size-4" />
            <AlertDescription>
              File bukti disimpan di storage privat lokal dan hanya dapat dibuka oleh wali terkait atau staff berwenang.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="method">Metode pembayaran</Label>
              <select
                id="method"
                name="method"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#10b447] focus:ring-3 focus:ring-[#dce9d0]"
              >
                <option value="TRANSFER">Transfer bank</option>
                <option value="EWALLET">E-wallet</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAt">Tanggal bayar</Label>
              <Input
                id="paidAt"
                name="paidDate"
                type="date"
                className="h-10 bg-white"
                defaultValue={todayInputValue()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal transfer</Label>
            <Input
              id="amount"
              name="amount"
              className="h-10 bg-white"
              defaultValue={defaultAmount}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Bukti transfer</Label>
            <label
              htmlFor="proof"
              className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-[#10b447] hover:bg-[#f3f8ea]"
            >
              <UploadCloud className="mx-auto size-9 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-800">
                {fileName || "Pilih JPG, PNG, atau PDF"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Maksimal 2 MB</p>
            </label>
            <Input
              id="proof"
              name="proof"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              required
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan untuk bendahara</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Contoh: transfer dari rekening BCA atas nama Budi Santoso"
              className="min-h-24 bg-white"
            />
          </div>
        </CardContent>
        <CardFooter className="grid gap-3 border-t bg-slate-50">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 bg-[#10b447] text-white hover:bg-[#078435] disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {isPending ? "Mengirim bukti..." : "Kirim Bukti Pembayaran"}
          </Button>
          <Button type="button" variant="outline" asChild className="h-11 bg-white">
            <Link href="/tagihan">Kembali ke Tagihan</Link>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
