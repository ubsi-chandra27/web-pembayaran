import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/school-logo";
import { formatCurrency, formatDate, formatNumber, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function receiptNoteLines(notes: string) {
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getCashReceived(after: unknown) {
  if (!after || typeof after !== "object" || !("cashReceivedAmount" in after)) {
    return 0;
  }

  return Number((after as { cashReceivedAmount?: unknown }).cashReceivedAmount ?? 0);
}

function getCashInvoiceNumber(after: unknown) {
  if (!after || typeof after !== "object" || !("cashInvoiceNumber" in after)) {
    return "";
  }

  return String((after as { cashInvoiceNumber?: unknown }).cashInvoiceNumber ?? "");
}

function numberToWords(value: number): string {
  const words = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
  ];
  const amount = Math.floor(Math.abs(value));

  if (amount < 12) return words[amount];
  if (amount < 20) return `${numberToWords(amount - 10)} belas`;
  if (amount < 100) {
    return `${numberToWords(Math.floor(amount / 10))} puluh ${numberToWords(amount % 10)}`.trim();
  }
  if (amount < 200) return `seratus ${numberToWords(amount - 100)}`.trim();
  if (amount < 1000) {
    return `${numberToWords(Math.floor(amount / 100))} ratus ${numberToWords(amount % 100)}`.trim();
  }
  if (amount < 2000) return `seribu ${numberToWords(amount - 1000)}`.trim();
  if (amount < 1000000) {
    return `${numberToWords(Math.floor(amount / 1000))} ribu ${numberToWords(amount % 1000)}`.trim();
  }
  if (amount < 1000000000) {
    return `${numberToWords(Math.floor(amount / 1000000))} juta ${numberToWords(amount % 1000000)}`.trim();
  }

  return `${numberToWords(Math.floor(amount / 1000000000))} miliar ${numberToWords(amount % 1000000000)}`.trim();
}

function rupiahWords(value: number) {
  if (value <= 0) return "Nol rupiah";

  const words = numberToWords(value).replace(/\s+/g, " ").trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupiah`;
}

export default async function KwitansiPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string; nis?: string }>;
}) {
  const { invoice = "", nis = "" } = await searchParams;
  const [school, targetPayment] = await Promise.all([
    prisma.schoolSetting.findFirst(),
    invoice
      ? prisma.payment.findFirst({
          where: { invoice: { invoiceNumber: invoice } },
          include: {
            createdBy: true,
            invoice: { include: { student: { include: { class: true } }, tariff: true } },
            receipt: true,
          },
        })
      : prisma.payment.findFirst({
          where: {
            method: "TUNAI",
            status: "TERVERIFIKASI",
            ...(nis ? { invoice: { student: { nis } } } : {}),
          },
          include: {
            createdBy: true,
            invoice: { include: { student: { include: { class: true } }, tariff: true } },
            receipt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
  ]);

  const relatedPayments = targetPayment
    ? await prisma.payment.findMany({
        where: {
          method: "TUNAI",
          status: "TERVERIFIKASI",
          paidAt: targetPayment.paidAt,
          createdById: targetPayment.createdById,
          invoice: { studentId: targetPayment.invoice.studentId },
        },
        include: {
          invoice: { include: { tariff: true, student: { include: { class: true } } } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const auditLog = targetPayment
    ? await prisma.auditLog.findFirst({
        where: {
          action: "CASH_PAYMENT_CREATED",
          entity: "invoices",
          entityId: targetPayment.invoiceId,
        },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const receiptRows = relatedPayments.map((payment, index) => [
    String(index + 1),
    payment.invoice.title,
    "Rp",
    formatNumber(payment.amount),
  ]);
  const emptyRows = Array.from({ length: Math.max(0, 8 - receiptRows.length) }).map(
    (_, index) => [String(receiptRows.length + index + 1), "", "Rp", "-"]
  );
  const total = relatedPayments.reduce(
    (sum, payment) => sum + payment.amount.toNumber(),
    0
  );
  const cashReceived = getCashReceived(auditLog?.after);
  const displayInvoiceNumber =
    getCashInvoiceNumber(auditLog?.after) || targetPayment?.invoice.invoiceNumber || "-";
  const paidAt = targetPayment?.paidAt ?? new Date();
  const student = targetPayment?.invoice.student;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-[#106b43] p-4 text-white md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href={nis ? `/admin/transaksi?nis=${encodeURIComponent(nis)}` : "/admin/transaksi"} aria-label="Kembali ke transaksi">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Preview Kwitansi</h1>
            <p className="text-sm text-white/75">Data diambil dari transaksi tunai dan identitas sekolah aktif.</p>
          </div>
        </div>
        <Button className="bg-[#ffc400] text-[#2412a8] hover:bg-[#ffd338]">
          <Printer className="size-4" />
          Cetak
        </Button>
      </div>

      <section className="mx-auto max-w-[940px] bg-white p-4 text-[13px] text-black shadow-sm ring-1 ring-slate-300">
        <div className="flex items-start justify-between border-b border-black pb-2">
          <div className="flex items-start gap-3">
            <SchoolLogo className="size-16" />
            <div>
              <p className="text-xs">{school?.foundationName ?? "YAYASAN PENDIDIKAN ISLAM"}</p>
              <p className="text-lg font-semibold leading-tight">{school?.schoolName ?? "TK Islam Azkia"}</p>
              <p>{school?.address ?? "-"}</p>
              <p>
                Telepon: {school?.phone ?? "-"} | Email: {school?.email ?? "-"}
              </p>
            </div>
          </div>
          <h2 className="text-4xl font-semibold tracking-wide">KWITANSI</h2>
        </div>

        <div className="grid grid-cols-2 border-b border-black py-2">
          <div className="space-y-1">
            <p>No Invoice : {displayInvoiceNumber}</p>
            <p>Tanggal : {formatDate(paidAt)}</p>
            <p>Jam Cetak : {formatTime(new Date())}</p>
          </div>
          <div className="space-y-1 text-right">
            <p>No Induk : {student?.nis ?? "-"}</p>
            <p>Nama Siswa : {student?.fullName ?? "-"}</p>
            <p>Kelas : {student?.class.name ?? "-"}</p>
          </div>
        </div>

        <table className="w-full border-b border-black">
          <thead>
            <tr className="border-b border-black">
              <th className="w-16 py-1 text-center">No</th>
              <th className="py-1 text-left">Jenis Pembayaran</th>
              <th className="w-16 py-1 text-left"> </th>
              <th className="w-40 py-1 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {[...receiptRows, ...emptyRows].map(([no, name, currency, amount]) => (
              <tr key={no}>
                <td className="py-1 text-center">{no}</td>
                <td>{name}</td>
                <td>{currency}</td>
                <td className="text-right">{amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 border-b border-black py-2">
          <div>
            <p className="font-semibold">Terbilang :</p>
            <p className="mt-3 italic">{rupiahWords(total)}</p>
          </div>
          <div>
            <div className="flex justify-between border-b border-black pb-1 font-semibold">
              <span>Grand Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {cashReceived > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                <span>Uang diterima</span>
                <span className="text-right">{formatCurrency(cashReceived)}</span>
                <span>Kembalian</span>
                <span className="text-right">{formatCurrency(Math.max(cashReceived - total, 0))}</span>
              </div>
            )}
            <div className="mt-6 text-center">
              <p>
                {school?.receiptCity ?? "Bekasi"}, {formatDate(paidAt)}
              </p>
              <p className="mt-2">Yang Menerima</p>
              <p className="col-span-2 mt-12">{school?.treasurerName ?? targetPayment?.createdBy.name ?? "-"}</p>
              <p>NIP. ....................................</p>
            </div>
          </div>
        </div>

        <div className="pt-3 text-[11px]">
          <p className="font-semibold">Catatan:</p>
          {receiptNoteLines(
            school?.receiptNotes ??
              "- Disimpan sebagai bukti pembayaran yang sah\n- Uang yang sudah dibayarkan tidak dapat diminta kembali"
          ).map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
