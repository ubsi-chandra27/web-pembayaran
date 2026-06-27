import Link from "next/link";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Download, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function isIn(type: string) {
  return type === "SETORAN";
}

function typeLabel(type: string) {
  return type === "SETORAN" ? "Setoran" : "Penarikan";
}

export default async function TabunganPage() {
  const user = await getCurrentUser();
  const guardian = user
    ? await prisma.guardian.findFirst({
        where: { userId: user.id },
        include: {
          students: {
            include: {
              student: {
                include: {
                  class: true,
                  savingsAccount: {
                    include: {
                      transactions: {
                        include: { createdBy: true },
                        orderBy: { createdAt: "desc" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    : null;
  const student = guardian?.students[0]?.student;
  const account = student?.savingsAccount;
  const mutations = account?.transactions ?? [];
  const now = new Date();
  const monthlyIn = mutations
    .filter(
      (item) =>
        isIn(item.type) &&
        item.createdAt.getMonth() === now.getMonth() &&
        item.createdAt.getFullYear() === now.getFullYear(),
    )
    .reduce((total, item) => total + item.amount.toNumber(), 0);
  const monthlyOut = mutations
    .filter(
      (item) =>
        !isIn(item.type) &&
        item.createdAt.getMonth() === now.getMonth() &&
        item.createdAt.getFullYear() === now.getFullYear(),
    )
    .reduce((total, item) => total + item.amount.toNumber(), 0);

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
            Tabungan {student?.fullName ?? "Anak"}
          </h1>
          <p className="text-sm text-slate-500">Saldo dan mutasi buku tabungan digital.</p>
        </div>
      </div>

      {/* Account card */}
      <Card className="border-sky-200 bg-sky-950 text-white">
        <CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-white text-sky-800">
                <WalletCards className="size-6" />
              </span>
              <div>
                <p className="text-sm text-sky-100/80">No. rekening tabungan</p>
                <p className="font-mono font-semibold">{account?.accountNumber ?? "-"}</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-sky-100/80">
              Total saldo {student?.fullName ?? "anak"}
            </p>
            <p className="mt-1 text-4xl font-bold">
              {formatCurrency(account?.balance ?? 0)}
            </p>
          </div>
          <Button className="bg-white text-sky-950 hover:bg-sky-50">
            <Download className="size-4" />
            Cetak Mutasi
          </Button>
        </CardContent>
      </Card>

      {/* Monthly summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Setoran bulan ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#078435]">{formatCurrency(monthlyIn)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Penarikan bulan ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(monthlyOut)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Transaksi terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">
              {mutations[0] ? formatDate(mutations[0].createdAt) : "-"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Mutation history */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Riwayat mutasi</CardTitle>
          <Badge className="bg-[#e7f3d7] text-[#078435]">Ledger tabungan</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {mutations.map((mutation) => {
            const incoming = isIn(mutation.type);
            const Icon = incoming ? ArrowDownCircle : ArrowUpCircle;
            return (
              <div
                key={mutation.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      incoming ? "bg-[#e7f3d7] text-[#078435]" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">{typeLabel(mutation.type)}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(mutation.createdAt)} · {mutation.createdBy.name}
                    </p>
                    {mutation.notes && (
                      <p className="mt-1 text-xs text-slate-500">{mutation.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${incoming ? "text-[#078435]" : "text-rose-700"}`}>
                    {incoming ? "+" : "-"}
                    {formatCurrency(mutation.amount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Saldo: {formatCurrency(mutation.balanceAfter)}
                  </p>
                </div>
              </div>
            );
          })}
          {mutations.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Belum ada mutasi tabungan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
