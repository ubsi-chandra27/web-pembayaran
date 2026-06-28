import { NextResponse } from "next/server";

import { getCurrentUser, type DemoRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || !can(user.role as DemoRole, "report.read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const method = searchParams.get("method") ?? "";
  const status = searchParams.get("status") ?? "";
  const month = searchParams.get("month") ?? "";
  const monthStart = month ? new Date(`${month}-01T00:00:00.000Z`) : null;
  const monthEnd = monthStart
    ? new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1))
    : null;
  const payments = await prisma.payment.findMany({
    where: {
      ...(method ? { method } : {}),
      ...(status ? { status } : {}),
      ...(monthStart && monthEnd ? { paidAt: { gte: monthStart, lt: monthEnd } } : {}),
      ...(q
        ? {
            OR: [
              { method: { contains: q } },
              { paymentNumber: { contains: q } },
              { invoice: { invoiceNumber: { contains: q } } },
              { invoice: { title: { contains: q } } },
              { invoice: { student: { fullName: { contains: q } } } },
              { invoice: { student: { nis: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: {
      invoice: {
        include: {
          student: { include: { class: true } },
          tariff: true,
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });
  const rows = [
    [
      "No Invoice",
      "No Payment",
      "Tanggal Bayar",
      "NIS",
      "Siswa",
      "Kelas",
      "Tagihan",
      "Tarif",
      "Metode",
      "Nominal",
      "Status",
    ],
    ...payments.map((payment) => [
      payment.invoice.invoiceNumber,
      payment.paymentNumber,
      formatDateTime(payment.paidAt),
      payment.invoice.student.nis,
      payment.invoice.student.fullName,
      payment.invoice.student.class.name,
      payment.invoice.title,
      payment.invoice.tariff.name,
      payment.method,
      formatCurrency(payment.amount),
      payment.status,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="laporan-pembayaran-azkia.csv"',
    },
  });
}
