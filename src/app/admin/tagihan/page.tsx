import Link from "next/link";
import { Download, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CancelInvoiceButton,
  CreateInvoiceDialog,
  EditInvoiceDialog,
  InvoiceFilterButton,
} from "@/components/invoice-admin-actions";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, toInputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function tone(status: string) {
  if (status === "LUNAS") return "bg-[#e7f3d7] text-[#078435]";
  if (status === "MENUNGGU_VERIFIKASI") return "bg-amber-100 text-amber-800";
  if (status === "DITOLAK") return "bg-rose-100 text-rose-700";
  if (status === "DIBATALKAN") return "bg-slate-200 text-slate-600";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "BELUM_DIBAYAR") return "Belum Dibayar";
  if (status === "MENUNGGU_VERIFIKASI") return "Menunggu";
  if (status === "LUNAS") return "Lunas";
  if (status === "DITOLAK") return "Ditolak";
  return "Dibatalkan";
}

export default async function AdminTagihanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tariffId?: string }>;
}) {
  const { q = "", status = "", tariffId = "" } = await searchParams;
  const [user, students, tariffs, classes, invoices] = await Promise.all([
    getCurrentUser(),
    prisma.student.findMany({
      where: { status: "ACTIVE" },
      include: { class: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.baseTariff.findMany({
      where: { isActive: true },
      orderBy: [{ isLocked: "desc" }, { name: "asc" }],
    }),
    prisma.schoolClass.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(tariffId ? { tariffId } : {}),
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
      orderBy: { createdAt: "desc" },
      take: 75,
    }),
  ]);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const tariffOptions = tariffs.map((tariff) => ({
    id: tariff.id,
    name: tariff.name,
    amountLabel: formatCurrency(tariff.amount),
    amount: tariff.amount.toNumber(),
  }));
  const exportParams = new URLSearchParams();

  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  if (tariffId) exportParams.set("tariffId", tariffId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Manajemen tagihan
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Daftar dan Pembuatan Tagihan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat, filter, edit sebelum lunas, dan batalkan tagihan yang salah input.
          </p>
        </div>
        <CreateInvoiceDialog
          students={students.map((student) => ({
            id: student.id,
            nis: student.nis,
            name: student.fullName,
            className: student.class.name,
          }))}
          tariffs={tariffOptions}
          classes={classes.map((kelas) => ({
            id: kelas.id,
            name: kelas.name,
          }))}
        />
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Cari invoice atau siswa..."
                className="h-10 bg-white pl-9"
              />
              {status && <input type="hidden" name="status" value={status} />}
              {tariffId && <input type="hidden" name="tariffId" value={tariffId} />}
            </form>
            <div className="flex flex-wrap gap-2">
              <InvoiceFilterButton q={q} status={status} tariffId={tariffId} tariffs={tariffOptions} />
              <Button asChild variant="outline" className="h-10 bg-white">
                <Link href={`/admin/tagihan/export${exportParams.size ? `?${exportParams}` : ""}`}>
                  <Download className="size-4" />
                  Export CSV
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tagihan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const actionDisabled = invoice.status === "LUNAS" || invoice.status === "DIBATALKAN";

                  return (
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
                        {invoice.periodMonth && invoice.periodYear
                          ? `${invoice.periodMonth}/${invoice.periodYear}`
                          : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={tone(invoice.status)}>{statusLabel(invoice.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <EditInvoiceDialog
                            invoice={{
                              id: invoice.id,
                              invoiceNumber: invoice.invoiceNumber,
                              title: invoice.title,
                              amount: invoice.amount.toNumber(),
                              dueDate: invoice.dueDate ? toInputDate(invoice.dueDate) : "",
                              notes: invoice.notes ?? "",
                              status: invoice.status,
                            }}
                          />
                          <CancelInvoiceButton
                            invoiceId={invoice.id}
                            invoiceNumber={invoice.invoiceNumber}
                            disabled={!isSuperAdmin && actionDisabled}
                            permanent={isSuperAdmin}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
