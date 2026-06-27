import Link from "next/link";
import { ArrowLeft, CalendarDays, ReceiptText, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function statusClass(status: string) {
  if (status === "LUNAS") return "bg-[#e7f3d7] text-[#078435]";
  if (status === "MENUNGGU_VERIFIKASI") return "bg-amber-100 text-amber-800";
  if (status === "DITOLAK") return "bg-rose-100 text-rose-700";
  if (status === "DIBATALKAN") return "bg-slate-200 text-slate-600";
  return "bg-rose-100 text-rose-700";
}

function statusLabel(status: string) {
  if (status === "BELUM_DIBAYAR") return "Belum Dibayar";
  if (status === "MENUNGGU_VERIFIKASI") return "Menunggu Verifikasi";
  if (status === "LUNAS") return "Lunas";
  if (status === "DITOLAK") return "Ditolak";
  return "Dibatalkan";
}

function periodLabel(month?: number | null, year?: number | null) {
  if (!month || !year) return "Tahun ajaran";
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export default async function TagihanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const user = await getCurrentUser();
  const guardian = user
    ? await prisma.guardian.findFirst({
        where: { userId: user.id },
        include: { students: { include: { student: true } } },
      })
    : null;
  const studentIds = guardian?.students.map((item) => item.studentId) ?? [];
  const invoices = await prisma.invoice.findMany({
    where: {
      studentId: { in: studentIds },
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { invoiceNumber: { contains: q } },
              { tariff: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      student: { include: { class: true } },
      tariff: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const activeStudent = guardian?.students[0]?.student;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Kembali ke dashboard">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Tagihan {activeStudent?.fullName ?? "Anak"}
          </h1>
          <p className="text-sm text-slate-500">
            Semua tagihan diambil dari database dan dibatasi ke akun wali ini.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari tagihan atau invoice..."
              className="h-10 bg-white pl-9"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
          <form>
            {q && <input type="hidden" name="q" value={q} />}
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm md:w-56"
            >
              <option value="">Semua status</option>
              <option value="BELUM_DIBAYAR">Belum dibayar</option>
              <option value="MENUNGGU_VERIFIKASI">Menunggu verifikasi</option>
              <option value="LUNAS">Lunas</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </form>
          <Button variant="outline" className="h-10 justify-start bg-white">
            <CalendarDays className="size-4" />
            {new Date().getFullYear()}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="border-slate-200 bg-white">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <ReceiptText className="size-5" />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base text-slate-950">{invoice.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {invoice.invoiceNumber} - {invoice.tariff.name} -{" "}
                    {periodLabel(invoice.periodMonth, invoice.periodYear)}
                  </p>
                </div>
              </div>
              <Badge className={statusClass(invoice.status)}>{statusLabel(invoice.status)}</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Siswa</p>
                  <p className="font-medium text-slate-900">{invoice.student.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kelas</p>
                  <p className="font-medium text-slate-900">{invoice.student.class.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Jatuh tempo</p>
                  <p className="font-medium text-slate-900">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 md:block md:text-right">
                <div>
                  <p className="text-xs text-slate-500">Total bayar</p>
                  <p className="text-xl font-bold text-slate-950">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
                {["BELUM_DIBAYAR", "DITOLAK"].includes(invoice.status) ? (
                  <Button asChild className="bg-[#10b447] text-white hover:bg-[#078435]">
                    <Link href={`/pembayaran?invoiceId=${invoice.id}`}>Bayar</Link>
                  </Button>
                ) : (
                  <Button variant="outline" asChild className="bg-white">
                    <Link href="/riwayat">Detail</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {invoices.length === 0 && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-6 text-sm text-slate-500">
              Tidak ada tagihan sesuai filter.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
