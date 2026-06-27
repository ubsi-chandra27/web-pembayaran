import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  CreditCard,
  FileText,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [
    totalStudents,
    studentsByClass,
    monthlyIncome,
    unpaidInvoices,
    waitingCount,
    savingsBalance,
    latestPayments,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.schoolClass.findMany({
      include: {
        students: {
          where: { status: "ACTIVE" },
          include: {
            invoices: {
              where: { status: { in: ["BELUM_DIBAYAR", "DITOLAK"] } },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.payment.aggregate({
      where: {
        status: "TERVERIFIKASI",
        paidAt: { gte: monthStart, lt: nextMonth },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["BELUM_DIBAYAR", "DITOLAK"] } },
      include: { student: { include: { class: true } } },
    }),
    prisma.payment.count({ where: { status: "MENUNGGU_VERIFIKASI" } }),
    prisma.savingsAccount.aggregate({ _sum: { balance: true } }),
    prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const unpaidTotal = unpaidInvoices.reduce(
    (total, invoice) => total + invoice.totalAmount.toNumber(),
    0,
  );
  const arrearsByClass = studentsByClass.map((kelas) => {
    const invoices = kelas.students.flatMap((student) => student.invoices);
    const amount = invoices.reduce((total, invoice) => total + invoice.totalAmount.toNumber(), 0);
    const studentCount = new Set(
      kelas.students
        .filter((student) => student.invoices.length > 0)
        .map((student) => student.id),
    ).size;
    return {
      kelas: kelas.name,
      siswa: studentCount,
      amount,
      percent: unpaidTotal > 0 ? Math.min(100, Math.round((amount / unpaidTotal) * 100)) : 0,
    };
  });
  const stats = [
    {
      label: "Total siswa",
      value: String(totalStudents),
      hint: `${studentsByClass.length} kelas aktif`,
      icon: Users,
      className: "text-[#2412a8]",
    },
    {
      label: "Pemasukan bulan ini",
      value: formatCurrency(monthlyIncome._sum.amount ?? 0),
      hint: "Pembayaran terverifikasi",
      icon: WalletCards,
      className: "text-[#078435]",
    },
    {
      label: "Total tunggakan",
      value: formatCurrency(unpaidTotal),
      hint: `${unpaidInvoices.length} tagihan perlu follow up`,
      icon: ReceiptText,
      className: "text-rose-700",
    },
    {
      label: "Menunggu verifikasi",
      value: `${waitingCount} pembayaran`,
      hint: "Butuh tindakan bendahara",
      icon: Clock3,
      className: "text-amber-700",
    },
    {
      label: "Saldo tabungan",
      value: formatCurrency(savingsBalance._sum.balance ?? 0),
      hint: "Dihitung dari akun tabungan",
      icon: WalletCards,
      className: "text-sky-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Dashboard admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Ringkasan Keuangan TK Islam Azkia
          </h1>
        </div>
        <Button asChild className="bg-[#10b447] text-white hover:bg-[#078435]">
          <Link href="/admin/transaksi">
            Input Transaksi Tunai
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200 bg-white">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-500">{stat.label}</CardTitle>
              <stat.icon className={`size-5 ${stat.className}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Tunggakan per Kelas</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Membantu TU melihat kelas mana yang perlu diprioritaskan.
              </p>
            </div>
            <Badge className="bg-rose-100 text-rose-700">Database live</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {arrearsByClass.map((item) => (
              <div key={item.kelas} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-950">{item.kelas}</p>
                    <p className="text-xs text-slate-500">{item.siswa} siswa menunggak</p>
                  </div>
                  <p className="font-semibold text-rose-700">{formatCurrency(item.amount)}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-rose-50">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="grid gap-3 rounded-lg border border-[#b7d889] bg-[#f3f8ea] p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Total kelas</p>
                <p className="font-bold text-slate-950">{studentsByClass.length} kelas</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tagihan menunggak</p>
                <p className="font-bold text-rose-700">{unpaidInvoices.length} tagihan</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nominal</p>
                <p className="font-bold text-rose-700">{formatCurrency(unpaidTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Transaksi terbaru</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/pembayaran">Lihat</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                    {payment.method === "TUNAI" ? (
                      <CreditCard className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">
                      {payment.invoice.student.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.invoice.invoiceNumber} - {payment.invoice.title}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-[#078435]">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
