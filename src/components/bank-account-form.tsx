"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Loader2, Save } from "lucide-react";

import { saveBankAccount } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

function toast(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function BankAccountForm({ account }: { account: BankAccount | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await saveBankAccount(formData);
        toast({ type: "success", title: "Rekening tersimpan", description: result.message });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal menyimpan rekening",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-[#078435]" />
              Rekening Pembayaran Resmi
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Diambil untuk landing, instruksi bayar, dan kwitansi.
            </p>
          </div>
          {account ? (
            <Badge className="bg-[#e7f3d7] text-[#078435]">Aktif</Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-500">Belum diisi</Badge>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">Nama Bank</Label>
            <Input
              id="bankName"
              name="bankName"
              placeholder="contoh: BRI, BCA, Mandiri"
              required
              defaultValue={account?.bankName ?? ""}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">No Rekening</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              inputMode="numeric"
              placeholder="contoh: 1234567890"
              required
              defaultValue={account?.accountNumber ?? ""}
              className="h-10 bg-white font-mono tracking-wider"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="accountHolder">Atas Nama</Label>
            <Input
              id="accountHolder"
              name="accountHolder"
              placeholder="contoh: Yayasan Pendidikan Islam Azkia"
              required
              defaultValue={account?.accountHolder ?? ""}
              className="h-10 bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              className="bg-[#10b447] text-white hover:bg-[#078435]"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isPending ? "Menyimpan..." : "Simpan Rekening Bank"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
