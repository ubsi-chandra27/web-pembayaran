import Link from "next/link";
import { ArrowLeft, Banknote } from "lucide-react";

import { ParentPaymentProofForm } from "@/components/parent-payment-proof-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function periodLabel(month?: number | null, year?: number | null) {
  if (!month || !year) return "Tahun ajaran";
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export default async function PembayaranPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const { invoiceId = "" } = await searchParams;
  const user = await getCurrentUser();
  const [invoice, bank] = await Promise.all([
    user && invoiceId
      ? prisma.invoice.findFirst({
          where: {
            id: invoiceId,
            student: {
              guardians: {
                some: {
                  guardian: { userId: user.id },
                },
              },
            },
          },
          include: {
            student: { include: { class: true } },
            tariff: true,
          },
        })
      : null,
    prisma.bankAccount.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
  ]);

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/tagihan">
            <ArrowLeft className="size-4" />
            Kembali ke tagihan
          </Link>
        </Button>
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-6 text-sm text-rose-700">
            Pilih tagihan yang valid dari halaman Tagihan sebelum mengirim bukti pembayaran.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tagihan" aria-label="Kembali ke tagihan">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Pembayaran Tagihan</h1>
          <p className="text-sm text-slate-500">Transfer lalu unggah bukti pembayaran.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <Badge className="w-fit bg-rose-100 text-rose-700">
                {invoice.status === "DITOLAK" ? "Ditolak, kirim ulang" : "Belum Dibayar"}
              </Badge>
              <CardTitle>{invoice.title}</CardTitle>
              <CardDescription>
                {invoice.student.fullName} - {invoice.student.class.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["No Invoice", invoice.invoiceNumber],
                ["Tarif", invoice.tariff.name],
                ["Periode", periodLabel(invoice.periodMonth, invoice.periodYear)],
                ["Nominal", formatCurrency(invoice.amount)],
                [
                  "Diskon / Denda",
                  `${formatCurrency(invoice.discountAmount)} / ${formatCurrency(invoice.fineAmount)}`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t pt-4">
                <span className="font-semibold text-slate-950">Total bayar</span>
                <span className="text-xl font-bold text-[#078435]">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#b7d889] bg-[#f3f8ea]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[#10b447] text-white">
                  <Banknote className="size-5" />
                </span>
                <div>
                  <CardTitle>Rekening Resmi</CardTitle>
                  <CardDescription>Gunakan rekening ini untuk transfer.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{bank?.bankName ?? "Bank sekolah"}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#078435]">
                {bank?.accountNumber ?? "-"}
              </p>
              <p className="mt-1 text-sm text-slate-600">a.n. {bank?.accountHolder ?? "-"}</p>
            </CardContent>
          </Card>
        </div>

        <ParentPaymentProofForm
          invoiceId={invoice.id}
          defaultAmount={invoice.totalAmount.toNumber()}
        />
      </div>
    </div>
  );
}
