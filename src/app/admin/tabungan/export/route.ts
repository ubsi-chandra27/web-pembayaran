import { NextResponse } from "next/server";

import { getCurrentUser, type DemoRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !can(user.role as DemoRole, "report.read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const transactions = await prisma.savingsTransaction.findMany({
    include: {
      createdBy: true,
      account: { include: { student: { include: { class: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const rows = [
    [
      "No Transaksi",
      "Tanggal",
      "NIS",
      "Siswa",
      "Kelas",
      "Jenis",
      "Nominal",
      "Saldo Sebelum",
      "Saldo Sesudah",
      "Petugas",
      "Catatan",
    ],
    ...transactions.map((item) => [
      item.transactionNumber,
      formatDateTime(item.createdAt),
      item.account.student.nis,
      item.account.student.fullName,
      item.account.student.class.name,
      item.type,
      formatCurrency(item.amount),
      formatCurrency(item.balanceBefore),
      formatCurrency(item.balanceAfter),
      item.createdBy.name,
      item.notes ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ledger-tabungan-azkia.csv"',
    },
  });
}
