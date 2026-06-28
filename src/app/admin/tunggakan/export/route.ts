import { NextResponse } from "next/server";

import { getCurrentUser, type DemoRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/format";
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
  const classId = searchParams.get("classId") ?? "";
  const invoices = await prisma.invoice.findMany({
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
    include: { student: { include: { class: true } }, tariff: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  const rows = [
    ["No Invoice", "NIS", "Siswa", "Kelas", "Tagihan", "Tarif", "Jatuh Tempo", "Nominal", "Status"],
    ...invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.student.nis,
      invoice.student.fullName,
      invoice.student.class.name,
      invoice.title,
      invoice.tariff.name,
      invoice.dueDate ? formatDate(invoice.dueDate) : "",
      formatCurrency(invoice.totalAmount),
      invoice.status,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="laporan-tunggakan-azkia.csv"',
    },
  });
}
