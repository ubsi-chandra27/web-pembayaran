import Link from "next/link";
import { Banknote, CreditCard, Download, FileText, Search, WalletCards } from "lucide-react";

import { DeletePaymentButton } from "@/components/payment-report-actions";
import { PrintButton } from "@/components/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function statusClass(status: string) {
  if (status === "Terverifikasi") return "bg-[#e7f3d7] text-[#078435]";
  if (status === "Ditolak") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-800";
}

function statusLabel(status: string) {
  if (status === "TERVERIFIKASI") return "Terverifikasi";
  if (status === "DITOLAK") return "Ditolak";
  if (status === "DIBATALKAN") return "Dibatalkan";
  return "Menunggu";
}

export default async function AdminPembayaranPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; method?: string; status?: string; month?: string }>;
}) {
  const { q = "", method = "", status = "", month = "" } = await searchParams;
  const monthStart = month ? new Date(`${month}-01T00:00:00.000Z`) : null;
  const monthEnd = monthStart
    ? new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1))
    : null;
  const [user, payments] = await Promise.all([
    getCurrentUser(),
    prisma.payment.findMany({
      where: {
        ...(method ? { method } : {}),
        ...(status ? { status } : {}),
        ...(monthStart && monthEnd ? { paidAt: { gte: monthStart, lt: monthEnd } } : {}),
        ...(q
          ? {
              OR: [
                { method: { contains: q } },
                { paymentNumber: { contains: q } },
                { invoice: { invoiceNumber: { contains: q } } },
                { invoice: { title: { contains: q } } },
                { invoice: { student: { fullName: { contains: q } } } },
                { invoice: { student: { nis: { contains: q } } } },
              ],
            }
          : {}),
      },
      include: {
        invoice: {
          include: {
            student: { include: { class: true } },
            tariff: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 25,
    }),
  ]);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const todayPayments = payments.filter((payment) => {
    const paidAt = payment.paidAt;

    return (
      paidAt.getFullYear() === thisYear &&
      paidAt.getMonth() === thisMonth &&
      paidAt.getDate() === today.getDate()
    );
  });
  const transferPayments = payments.filter((payment) => payment.method !== "TUNAI");
  const cashPayments = payments.filter((payment) => payment.method === "TUNAI");
  const waitingPayments = payments.filter((payment) => payment.status === "MENUNGGU_VERIFIKASI");
  const sum = (items: typeof payments) =>
    items.reduce((total, payment) => total + payment.amount.toNumber(), 0);
  const exportParams = new URLSearchParams();

  if (q) exportParams.set("q", q);
  if (method) exportParams.set("method", method);
  if (status) exportParams.set("status", status);
  if (month) exportParams.set("month", month);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Laporan pembayaran
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Rekap Pembayaran Siswa
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Transaksi tunai diinput dari menu Transaksi. Halaman ini khusus untuk membaca, mencari, dan mencetak laporan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="bg-white">
            <Link href={`/admin/pembayaran/export${exportParams.size ? `?${exportParams}` : ""}`}>
              <Download className="size-4" />
              Export CSV
            </Link>
          </Button>
          <PrintButton label="Cetak Laporan" />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total hari ini", formatCurrency(sum(todayPayments)), `${todayPayments.length} invoice`, CreditCard],
          ["Transfer", formatCurrency(sum(transferPayments)), `${transferPayments.length} invoice`, WalletCards],
          ["Tunai", formatCurrency(sum(cashPayments)), `${cashPayments.length} invoice`, Banknote],
          ["Menunggu", formatCurrency(sum(waitingPayments)), `${waitingPayments.length} invoice`, FileText],
        ].map(([label, value, hint, Icon]) => (
          <Card key={label as string} className="border-slate-200 bg-white">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-500">{label as string}</CardTitle>
              <Icon className="size-5 text-[#078435]" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">{value as string}</p>
              <p className="mt-1 text-xs text-slate-500">{hint as string}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <form className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Cari invoice, siswa, atau metode..."
                className="h-10 bg-white pl-9"
              />
            </div>
            <select name="method" defaultValue={method} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Semua metode</option>
              <option value="TRANSFER">Transfer</option>
              <option value="TUNAI">Tunai</option>
              <option value="EWALLET">E-wallet</option>
              <option value="QRIS">QRIS</option>
            </select>
            <select name="status" defaultValue={status} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Semua status</option>
              <option value="TERVERIFIKASI">Terverifikasi</option>
              <option value="MENUNGGU_VERIFIKASI">Menunggu</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
            <Input name="month" type="month" defaultValue={month} className="h-10 bg-white" />
            <button className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Filter
            </button>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No Invoice</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Tagihan</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const status = statusLabel(payment.status);

                return (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {payment.invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="font-medium text-slate-950">
                    {payment.invoice.student.fullName}
                  </TableCell>
                  <TableCell>{payment.invoice.title}</TableCell>
                  <TableCell>{payment.method === "TUNAI" ? "Tunai" : payment.method}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(status)}>{status}</Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <DeletePaymentButton
                        paymentId={payment.id}
                        invoiceNumber={payment.invoice.invoiceNumber}
                        studentName={payment.invoice.student.fullName}
                      />
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
