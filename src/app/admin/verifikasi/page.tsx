import Link from "next/link";
import { CheckCircle2, FileImage, Search, XCircle } from "lucide-react";

import { approvePayment, rejectPayment } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default async function VerifikasiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const payments = await prisma.payment.findMany({
    where: {
      status: "MENUNGGU_VERIFIKASI",
      ...(q
        ? {
            OR: [
              { method: { contains: q } },
              { invoice: { invoiceNumber: { contains: q } } },
              { invoice: { title: { contains: q } } },
              { invoice: { student: { fullName: { contains: q } } } },
              { invoice: { student: { nis: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: {
      createdBy: true,
      proofs: true,
      invoice: {
        include: {
          student: { include: { class: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Verifikasi bendahara
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Antrean pembayaran menunggu verifikasi
          </h1>
        </div>
        <Badge className="w-fit bg-amber-100 text-amber-800">
          {payments.length} pembayaran menunggu
        </Badge>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <form className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari siswa, invoice, kelas, atau metode..."
              className="h-10 bg-white pl-9"
            />
          </form>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead className="min-w-72">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const proof = payment.proofs[0];
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium text-slate-950">
                        {payment.invoice.student.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {payment.invoice.student.class.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{payment.invoice.title}</div>
                      <div className="text-xs text-slate-500">{payment.invoice.invoiceNumber}</div>
                      <Badge className="mt-1 bg-amber-100 text-amber-800">Menunggu</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(payment.paidAt)}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                      <div className="text-xs text-slate-500">{payment.method}</div>
                    </TableCell>
                    <TableCell>
                      {proof ? (
                        <Button variant="outline" size="sm" asChild className="bg-white">
                          <Link href={proof.fileUrl} target="_blank">
                            <FileImage className="size-4" />
                            Lihat
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500">Tidak ada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-2">
                        <form action={approvePayment}>
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <Button className="h-9 w-full bg-[#10b447] text-white hover:bg-[#078435]">
                            <CheckCircle2 className="size-4" />
                            Setujui
                          </Button>
                        </form>
                        <form action={rejectPayment} className="grid gap-2">
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <Textarea
                            name="rejectionReason"
                            placeholder="Alasan penolakan..."
                            className="min-h-16 bg-white"
                            required
                          />
                          <Button
                            variant="outline"
                            className="h-9 border-rose-200 bg-white text-rose-700"
                          >
                            <XCircle className="size-4" />
                            Tolak
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    Tidak ada pembayaran menunggu verifikasi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
