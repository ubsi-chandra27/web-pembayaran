import { NextResponse } from "next/server";

import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const tariffId = searchParams.get("tariffId") ?? "";
  const invoices = await prisma.invoice.findMany({
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
  });
  const rows = [
    ["No Invoice", "NIS", "Siswa", "Kelas", "Tagihan", "Tarif", "Nominal", "Status"],
    ...invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.student.nis,
      invoice.student.fullName,
      invoice.student.class.name,
      invoice.title,
      invoice.tariff.name,
      formatCurrency(invoice.totalAmount),
      invoice.status,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tagihan-azkia.csv"',
    },
  });
}
