"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, PlusCircle } from "lucide-react";

import { createSavingsTransaction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";

type StudentOption = {
  id: string;
  nis: string;
  fullName: string;
  className: string;
  balance: number;
};

function toast(type: "success" | "error", title: string, description?: string) {
  window.dispatchEvent(
    new CustomEvent("azkia-toast", { detail: { type, title, description } }),
  );
}

export function TabunganForm({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<"SETORAN" | "PENARIKAN">("SETORAN");

  const selected = students.find((s) => s.id === selectedId);
  const isSetoran = mode === "SETORAN";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createSavingsTransaction(formData);
        toast(
          "success",
          "Transaksi tersimpan",
          `${isSetoran ? "Setoran" : "Penarikan"} berhasil dicatat.`,
        );
        setSelectedId("");
        formRef.current?.reset();
        router.refresh();
      } catch (error) {
        toast(
          "error",
          "Transaksi gagal",
          error instanceof Error ? error.message : "Cek kembali data transaksi.",
        );
      }
    });
  }

  return (
    <Card
      className={`border transition-colors ${
        isSetoran ? "border-[#b7d889] bg-[#f3f8ea]" : "border-rose-200 bg-rose-50"
      }`}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-lg text-white ${
              isSetoran ? "bg-[#10b447]" : "bg-rose-600"
            }`}
          >
            {isSetoran ? (
              <ArrowDownCircle className="size-5" />
            ) : (
              <ArrowUpCircle className="size-5" />
            )}
          </span>
          <CardTitle>Catat Transaksi Tabungan</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
          {/* Student selector */}
          <div className="space-y-2">
            <Label>Siswa</Label>
            <select
              name="studentId"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`h-10 w-full rounded-lg border bg-white px-3 text-sm ${
                isSetoran ? "border-[#b7d889]" : "border-rose-200"
              }`}
              required
            >
              <option value="">Pilih siswa...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nis} – {s.fullName} ({s.className})
                </option>
              ))}
            </select>
          </div>

          {/* Balance display */}
          {selected && (
            <div
              className={`flex items-center justify-between rounded-lg border p-3 ${
                isSetoran ? "border-[#b7d889] bg-white" : "border-rose-200 bg-white"
              }`}
            >
              <p className="text-sm text-slate-500">Saldo saat ini</p>
              <p className="text-xl font-bold text-slate-950">
                {formatCurrency(selected.balance)}
              </p>
            </div>
          )}

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("SETORAN")}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                isSetoran
                  ? "border-[#10b447] bg-[#10b447] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowDownCircle className="size-4" />
              Setoran
            </button>
            <button
              type="button"
              onClick={() => setMode("PENARIKAN")}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                !isSetoran
                  ? "border-rose-600 bg-rose-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowUpCircle className="size-4" />
              Penarikan
            </button>
          </div>

          <input type="hidden" name="type" value={mode} />

          {/* Amount */}
          <div className="space-y-2">
            <Label>Nominal</Label>
            <Input
              name="amount"
              inputMode="numeric"
              placeholder="50000"
              className={`h-10 bg-white ${isSetoran ? "border-[#b7d889]" : "border-rose-200"}`}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>
              Catatan{" "}
              {!isSetoran ? (
                <span className="text-rose-600">*</span>
              ) : (
                <span className="text-xs font-normal text-slate-400">(opsional)</span>
              )}
            </Label>
            <Textarea
              name="notes"
              placeholder={
                isSetoran
                  ? "Catatan setoran (opsional)..."
                  : "Alasan penarikan (wajib)..."
              }
              className={`min-h-20 bg-white ${isSetoran ? "border-[#b7d889]" : "border-rose-200"}`}
              required={!isSetoran}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className={`h-11 text-white ${
              isSetoran ? "bg-[#10b447] hover:bg-[#078435]" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            <PlusCircle className="size-4" />
            {isPending
              ? "Menyimpan..."
              : isSetoran
                ? "Simpan Setoran"
                : "Proses Penarikan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
