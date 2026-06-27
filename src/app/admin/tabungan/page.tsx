import { FileText } from "lucide-react";

import { LedgerTable, type LedgerRow } from "./ledger-table";
import { TabunganForm } from "./tabungan-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminTabunganPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [students, transactions, totalBalance, activeAccounts, todayCount] = await Promise.all([
    prisma.student.findMany({
      where: { status: "ACTIVE" },
      include: { class: true, savingsAccount: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.savingsTransaction.findMany({
      include: {
        createdBy: true,
        account: { include: { student: { include: { class: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savingsAccount.aggregate({ _sum: { balance: true } }),
    prisma.savingsAccount.count({ where: { status: "ACTIVE" } }),
    prisma.savingsTransaction.count({ where: { createdAt: { gte: today } } }),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    nis: s.nis,
    fullName: s.fullName,
    className: s.class.name,
    balance: s.savingsAccount?.balance.toNumber() ?? 0,
  }));

  const ledgerRows: LedgerRow[] = transactions.map((t) => ({
    id: t.id,
    transactionNumber: t.transactionNumber,
    type: t.type,
    amount: t.amount.toNumber(),
    balanceAfter: t.balanceAfter.toNumber(),
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
    studentName: t.account.student.fullName,
    className: t.account.student.class.name,
    createdByName: t.createdBy.name,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Tabungan siswa
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Setoran, penarikan, dan ledger saldo
          </h1>
        </div>
        <Button variant="outline" className="bg-white">
          <FileText className="size-4" />
          Cetak Buku Tabungan
        </Button>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total saldo aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">
              {formatCurrency(totalBalance._sum.balance ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Rekening aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">{activeAccounts}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Transaksi hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">{todayCount}</p>
          </CardContent>
        </Card>
      </section>

      {/* Form */}
      <TabunganForm students={studentOptions} />

      {/* Ledger table */}
      <LedgerTable transactions={ledgerRows} />
    </div>
  );
}
