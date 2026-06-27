"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Edit,
  Printer,
  ReceiptText,
  Save,
  Search,
} from "lucide-react";

import { createCashTransaction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TariffRow = {
  id: string;
  name: string;
  amount: number;
  amountLabel: string;
  fixed: boolean;
  defaultPaid: string;
};

type SppMonth = {
  number: string;
  month: string;
  amount: string;
  status: "green" | "yellow" | "red";
};

type StudentSummary = {
  id: string;
  nis: string;
  name: string;
  className: string;
};

function monthClass(status: SppMonth["status"]) {
  if (status === "green") return "bg-[#10b447] text-white";
  if (status === "yellow") return "bg-[#ffc400] text-[#2412a8]";
  return "bg-rose-500 text-white";
}

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseAmount(value: string) {
  return Number(value.replace(/[^\d]/g, "") || 0);
}

function formatPaidDate(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function maskDateText(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateText(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toast(
  type: "success" | "error",
  title: string,
  description?: string
) {
  window.dispatchEvent(
    new CustomEvent("azkia-toast", {
      detail: { type, title, description },
    })
  );
}

export function CashTransactionForm({
  nis,
  student,
  tariffs,
  months,
  paidTotal,
  outstandingTotal,
  nextInvoiceNumber,
  activeYearName,
}: {
  nis: string;
  student: StudentSummary | null;
  tariffs: TariffRow[];
  months: SppMonth[];
  paidTotal: number;
  outstandingTotal: number;
  nextInvoiceNumber: string;
  activeYearName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nisInput, setNisInput] = useState(nis);
  const [paidDate, setPaidDate] = useState("");
  const [paidDateText, setPaidDateText] = useState("");
  const [cashReceivedAmount, setCashReceivedAmount] = useState("");
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(tariffs.map((row) => [row.id, row.defaultPaid]))
  );
  const grandTotal = useMemo(
    () =>
      Object.values(amounts).reduce((sum, value) => {
        return sum + parseAmount(value);
      }, 0),
    [amounts]
  );
  const cashReceived = useMemo(
    () => parseAmount(cashReceivedAmount),
    [cashReceivedAmount]
  );
  const paidDateLabel = formatPaidDate(paidDate);
  const changeAmount = Math.max(cashReceived - grandTotal, 0);
  const previewParams = new URLSearchParams();

  if (previewInvoiceNumber) {
    previewParams.set("invoice", previewInvoiceNumber);
  } else if (nisInput.trim()) {
    previewParams.set("nis", nisInput.trim());
  }

  const previewHref = `/admin/transaksi/kwitansi${previewParams.size ? `?${previewParams.toString()}` : ""}`;
  const cardHref = `/admin/transaksi/kartu${nisInput.trim() ? `?nis=${encodeURIComponent(nisInput.trim())}` : ""}`;

  useEffect(() => {
    const nextNis = nisInput.trim();
    const currentNis = nis.trim();

    if (nextNis === currentNis) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(
        nextNis
          ? `/admin/transaksi?nis=${encodeURIComponent(nextNis)}`
          : "/admin/transaksi"
      );
      setPreviewInvoiceNumber("");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [nis, nisInput, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await createCashTransaction(formData);
        setPreviewInvoiceNumber(result.invoiceNumber);
        toast("success", "Transaksi tersimpan", result.message);
        router.refresh();
      } catch (error) {
        toast(
          "error",
          "Transaksi gagal",
          error instanceof Error ? error.message : "Cek kembali data transaksi."
        );
      }
    });
  }

  function onPaidDateTextChange(value: string) {
    const masked = maskDateText(value);

    setPaidDateText(masked);
    setPaidDate(parseDateText(masked));
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Transaksi tunai
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Input Pembayaran di Sekolah
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Untuk orang tua yang membayar langsung ke TU tanpa transfer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="bg-white">
            <Link href={previewHref}>
              <Printer className="size-4" />
              Preview Kwitansi
            </Link>
          </Button>
          <Button variant="outline" asChild className="bg-white">
            <Link href={cardHref}>
              <ReceiptText className="size-4" />
              Preview Kartu
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-[#b7d889] bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="nis">No. Induk / NIS</Label>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="nis"
                  name="nis"
                  value={nisInput}
                  onChange={(event) => setNisInput(event.target.value)}
                  autoComplete="off"
                  placeholder="Masukkan NIS siswa"
                  className="h-11 bg-white pl-9 text-base font-semibold"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-[#f3f8ea] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-semibold text-slate-950">
                {nisInput.trim()
                  ? student?.name ?? "Siswa tidak ditemukan"
                  : "Masukkan NIS siswa"}
              </p>
              <p className="font-semibold text-[#2412a8]">
                {student?.className ?? "-"}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" asChild className="h-11 bg-white">
                <Link href={student ? `/admin/siswa?q=${encodeURIComponent(student.nis)}` : "/admin/siswa"}>
                  <Edit className="size-4" />
                  Edit Siswa
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 pt-5 xl:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="studentId" value={student?.id ?? ""} />
            <div className="hidden grid-cols-[1fr_140px_180px] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Jenis pembayaran</span>
              <span>Tarif pokok</span>
              <span>Bayar sekarang</span>
            </div>
            {tariffs.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_140px_180px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
              >
                <div>
                  <p className="font-medium text-slate-950">{row.name}</p>
                  {row.fixed && (
                    <p className="text-xs text-slate-500">
                      Wajib dari pengaturan tarif pokok
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500 sm:hidden">
                    Tarif pokok
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium sm:bg-slate-50">
                    {row.amountLabel}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500 sm:hidden">
                    Bayar sekarang
                  </p>
                  <Input
                    name={`amount-${row.id}`}
                    value={amounts[row.id] ?? ""}
                    onChange={(event) =>
                      setAmounts((current) => ({
                        ...current,
                        [row.id]: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="h-10 bg-white text-right"
                  />
                </div>
              </div>
            ))}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="grid gap-4 md:grid-cols-[minmax(260px,1fr)_220px_180px] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="paidDate">Tanggal bayar</Label>
                  <input type="hidden" name="paidDate" value={paidDate} />
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="paidDate"
                      type="text"
                      inputMode="numeric"
                      value={paidDateText}
                      onChange={(event) => onPaidDateTextChange(event.target.value)}
                      placeholder="dd/mm/yyyy"
                      maxLength={10}
                      className="h-11 w-full bg-white pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cashReceivedAmount">Nominal uang diterima</Label>
                  <Input
                    id="cashReceivedAmount"
                    name="cashReceivedAmount"
                    value={cashReceivedAmount}
                    onChange={(event) => setCashReceivedAmount(event.target.value)}
                    placeholder={grandTotal > 0 ? rupiah(grandTotal) : "0"}
                    className="h-11 w-full bg-white text-right font-semibold"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!student || !paidDate || grandTotal <= 0 || isPending}
                  className="h-11 w-full bg-[#10b447] text-white disabled:opacity-45"
                >
                  <Save className="size-4" />
                  {isPending ? "Menyimpan..." : "Simpan Transaksi"}
                </Button>
              </div>
              <p className="text-xs text-amber-700">
                {paidDateLabel
                  ? `Tanggal terpilih: ${paidDateLabel} WIB`
                  : "Tombol simpan aktif setelah tanggal bayar terisi."}
              </p>
            </div>
          </form>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Ringkasan transaksi
                </p>
                <p className="text-xs text-slate-500">
                  Nomor invoice tetap dipakai di sistem web.
                </p>
              </div>
              <Badge className="bg-[#ffc400] text-[#2412a8]">
                {nextInvoiceNumber}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Sudah dibayar</p>
                <p className="text-xl font-bold text-[#078435]">
                  {rupiah(paidTotal)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Kekurangan SPP 1 tahun</p>
                <p className="text-xl font-bold text-rose-700">
                  {rupiah(outstandingTotal)}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Grand total bayar sekarang</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">
                {rupiah(grandTotal)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Nominal uang diterima</p>
                <p className="mt-1 text-2xl font-bold text-[#2412a8]">
                  {rupiah(cashReceived)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Kembalian</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {rupiah(changeAmount)}
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Informasi Pembayaran SPP</CardTitle>
          <Badge className="bg-[#e7f3d7] text-[#078435]">
            Tahun Ajaran {activeYearName}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 text-center text-sm sm:grid-cols-4 lg:grid-cols-12">
            {months.map((item) => (
              <div
                key={item.month}
                className="border-b border-r border-slate-200 last:border-r-0"
              >
                <div className={monthClass(item.status)}>
                  <p className="py-2 font-bold">{item.number}</p>
                </div>
                <div className="bg-white px-2 py-2">
                  <p className="text-xs font-medium text-slate-600">{item.month}</p>
                  <p
                    className={
                      item.status === "green"
                        ? "font-semibold text-[#078435]"
                        : item.status === "yellow"
                          ? "font-semibold text-amber-700"
                          : "font-semibold text-rose-600"
                    }
                  >
                    {item.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#10b447]" /> Sudah bayar
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-500" /> Belum bayar
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ffc400]" /> Perlu dicek
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
