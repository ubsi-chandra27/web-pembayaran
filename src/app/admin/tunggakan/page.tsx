import Link from "next/link";
import { Download, Search } from "lucide-react";

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
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function statusLabel(status: string) {
  if (status === "MENUNGGU_VERIFIKASI") return "Menunggu";
  if (status === "DITOLAK") return "Ditolak";
  return "Belum Dibayar";
}

function statusTone(status: string) {
  if (status === "MENUNGGU_VERIFIKASI") return "bg-amber-100 text-amber-800";
  if (status === "DITOLAK") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

export default async function TunggakanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const { q = "", classId = "" } = await searchParams;
  const [classes, invoices] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { name: "asc" } }),
    prisma.invoice.findMany({
      where: {
        status: { in: ["BELUM_DIBAYAR", "MENUNGGU_VERIFIKASI", "DITOLAK"] },
        ...(classId ? { student: { classId } } : {}),
        ...(q
          ? {
              OR: [
                { invoiceNumber: { contains: q } },
                { title: { contains: q } },
                { student: { fullName: { contains: q } } },
                { student: { nis: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        student: { include: { class: true } },
        tariff: true,
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  const totalOutstanding = invoices.reduce(
    (total, invoice) => total + invoice.totalAmount.toNumber(),
    0
  );
  const waitingCount = invoices.filter((invoice) => invoice.status === "MENUNGGU_VERIFIKASI").length;
  const classSummary = classes
    .map((kelas) => {
      const items = invoices.filter((invoice) => invoice.student.classId === kelas.id);

      return {
        id: kelas.id,
        name: kelas.name,
        count: items.length,
        amount: items.reduce((total, invoice) => total + invoice.totalAmount.toNumber(), 0),
      };
    })
    .filter((item) => item.count > 0);
  const exportParams = new URLSearchParams();

  if (q) exportParams.set("q", q);
  if (classId) exportParams.set("classId", classId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Laporan tunggakan
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Tunggakan Pembayaran Siswa
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau invoice belum dibayar, ditolak, dan menunggu verifikasi.
          </p>
        </div>
        <Button asChild variant="outline" className="bg-white">
          <Link href={`/admin/tunggakan/export${exportParams.size ? `?${exportParams}` : ""}`}>
            <Download className="size-4" />
            Export CSV
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total tunggakan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Invoice perlu ditindak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Menunggu verifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">{waitingCount}</p>
          </CardContent>
        </Card>
      </section>

      {classSummary.length > 0 && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {classSummary.map((item) => (
            <Card key={item.id} className="border-[#b7d889] bg-[#f3f8ea]">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.count} invoice</p>
                </div>
                <p className="font-bold text-rose-700">{formatCurrency(item.amount)}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Cari siswa, NIS, invoice..."
                className="h-10 bg-white pl-9"
              />
            </div>
            <select
              name="classId"
              defaultValue={classId}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Semua kelas</option>
              {classes.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.name}
                </option>
              ))}
            </select>
            <button className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Filter
            </button>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Invoice</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tagihan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-slate-950">
                      {invoice.student.fullName}
                      <p className="text-xs font-normal text-slate-500">{invoice.student.nis}</p>
                    </TableCell>
                    <TableCell>{invoice.student.class.name}</TableCell>
                    <TableCell>
                      <p>{invoice.title}</p>
                      <p className="text-xs text-slate-500">{invoice.tariff.name}</p>
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                      Tidak ada tunggakan sesuai filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
