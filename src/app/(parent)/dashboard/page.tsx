import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  HelpCircle,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const shortcuts = [
  { href: "/tagihan", label: "Bayar Tagihan", icon: CreditCard },
  { href: "/riwayat", label: "Riwayat", icon: FileText },
  { href: "/tabungan", label: "Tabungan Anak", icon: WalletCards },
  { href: "/", label: "Bantuan", icon: HelpCircle },
];

export default async function ParentDashboard() {
  const user = await getCurrentUser();
  const guardian = user
    ? await prisma.guardian.findFirst({
        where: { userId: user.id },
        include: {
          students: {
            include: {
              student: {
                include: {
                  class: { include: { academicYear: true } },
                  savingsAccount: true,
                  invoices: { orderBy: { createdAt: "desc" } },
                },
              },
            },
          },
        },
      })
    : null;
  const student = guardian?.students[0]?.student;
  const invoices = student?.invoices ?? [];
  const unpaid = invoices.filter((invoice) => invoice.status === "BELUM_DIBAYAR");
  const waiting = invoices.filter((invoice) => invoice.status === "MENUNGGU_VERIFIKASI");
  const paid = invoices.filter((invoice) => invoice.status === "LUNAS");
  const sum = (items: typeof invoices) =>
    items.reduce((total, invoice) => total + invoice.totalAmount.toNumber(), 0);
  const summary = [
    {
      label: "Belum dibayar",
      value: formatCurrency(sum(unpaid)),
      hint: `${unpaid.length} tagihan aktif`,
      icon: ReceiptText,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    },
    {
      label: "Menunggu verifikasi",
      value: formatCurrency(sum(waiting)),
      hint: `${waiting.length} bukti dikirim`,
      icon: CalendarClock,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Sudah lunas",
      value: formatCurrency(sum(paid)),
      hint: `${paid.length} transaksi`,
      icon: CheckCircle2,
      className: "border-[#b7d889] bg-[#f3f8ea] text-[#078435]",
    },
    {
      label: "Saldo tabungan",
      value: formatCurrency(student?.savingsAccount?.balance ?? 0),
      hint: student?.savingsAccount?.accountNumber ?? "-",
      icon: WalletCards,
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#078435]">
            Assalamu&apos;alaikum, {user?.name?.split(" ")[0] ?? "Wali"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Ringkasan {student?.fullName ?? "Anak"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {student?.class.name ?? "Kelas belum terhubung"} - Tahun Ajaran{" "}
            {student?.class.academicYear.name ?? "aktif"}
          </p>
        </div>
        <Button variant="outline" size="icon" className="relative bg-white">
          <Bell className="size-4" />
          {unpaid.length > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
          )}
        </Button>
      </div>

      <Card className="border-[#b7d889] bg-[#078435] text-white">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge className="bg-white/12 text-[#f3f8ea] ring-1 ring-white/20">
              Anak aktif
            </Badge>
            <h2 className="mt-4 text-xl font-semibold">
              {student?.fullName ?? "Data anak belum tersedia"}
            </h2>
            <p className="mt-1 text-sm text-[#f3f8ea]/78">
              Data tagihan dan tabungan dibaca dari database lokal.
            </p>
          </div>
          <Button asChild className="bg-white text-[#12301d] hover:bg-[#f3f8ea]">
            <Link href="/tagihan">
              Lihat Tagihan
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className={item.className}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide">
                  {item.label}
                </CardTitle>
                <item.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs opacity-80">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Tagihan perlu dibayar</CardTitle>
            <Link href="/tagihan" className="text-sm font-medium text-[#078435]">
              Semua
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {unpaid.slice(0, 3).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{invoice.title}</p>
                  <p className="text-xs text-slate-500">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-950">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                  <Badge className="mt-1 bg-rose-100 text-rose-700">
                    Belum dibayar
                  </Badge>
                </div>
              </div>
            ))}
            {unpaid.length === 0 && (
              <p className="rounded-lg border border-[#b7d889] bg-[#f3f8ea] p-4 text-sm text-[#078435]">
                Tidak ada tagihan aktif untuk anak ini.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Shortcut</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:border-[#b7d889] hover:bg-[#f3f8ea] hover:text-[#078435]"
              >
                <item.icon className="mb-3 size-5" />
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
