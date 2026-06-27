import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Download, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function statusMeta(status: string) {
  if (status === "TERVERIFIKASI") {
    return {
      label: "Terverifikasi",
      icon: CheckCircle2,
      className: "bg-[#e7f3d7] text-[#078435]",
    };
  }
  if (status === "DITOLAK") {
    return { label: "Ditolak", icon: XCircle, className: "bg-rose-100 text-rose-700" };
  }
  return {
    label: "Menunggu Verifikasi",
    icon: Clock,
    className: "bg-amber-100 text-amber-800",
  };
}

export default async function RiwayatPage() {
  const user = await getCurrentUser();
  const payments = user
    ? await prisma.payment.findMany({
        where: {
          invoice: {
            student: {
              guardians: {
                some: {
                  guardian: { userId: user.id },
                },
              },
            },
          },
        },
        include: {
          receipt: true,
          invoice: {
            include: {
              student: { include: { class: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Kembali ke dashboard">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Riwayat Pembayaran</h1>
          <p className="text-sm text-slate-500">Status upload bukti dan struk digital.</p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Transaksi terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.map((payment) => {
            const meta = statusMeta(payment.status);
            const Icon = meta.icon;
            return (
              <div
                key={payment.id}
                className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="flex min-w-0 gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${meta.className}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">{payment.invoice.title}</p>
                    <p className="text-xs text-slate-500">
                      {payment.invoice.invoiceNumber} - Upload {formatDate(payment.createdAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className={meta.className}>{meta.label}</Badge>
                      {payment.rejectionReason && (
                        <Badge className="bg-white text-rose-700 ring-1 ring-rose-200">
                          {payment.rejectionReason}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 md:block md:text-right">
                  <p className="font-bold text-slate-950">{formatCurrency(payment.amount)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-0 bg-white md:mt-2"
                    disabled={!payment.receipt}
                  >
                    <Download className="size-4" />
                    {payment.receipt?.receiptNumber ?? "Struk"}
                  </Button>
                </div>
              </div>
            );
          })}
          {payments.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Belum ada riwayat pembayaran.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
