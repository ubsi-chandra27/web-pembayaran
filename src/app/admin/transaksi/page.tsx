import { CashTransactionForm } from "@/components/cash-transaction-form";
import { formatCurrency, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const sppMonthOrder = [
  { month: 7, year: 2026, label: "Juli" },
  { month: 8, year: 2026, label: "Agustus" },
  { month: 9, year: 2026, label: "September" },
  { month: 10, year: 2026, label: "Oktober" },
  { month: 11, year: 2026, label: "November" },
  { month: 12, year: 2026, label: "Desember" },
  { month: 1, year: 2027, label: "Januari" },
  { month: 2, year: 2027, label: "Februari" },
  { month: 3, year: 2027, label: "Maret" },
  { month: 4, year: 2027, label: "April" },
  { month: 5, year: 2027, label: "Mei" },
  { month: 6, year: 2027, label: "Juni" },
];

function invoiceStatusColor(status?: string) {
  if (status === "LUNAS") return "green";
  if (status === "MENUNGGU_VERIFIKASI") return "yellow";
  return "red";
}

export default async function AdminTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ nis?: string }>;
}) {
  const { nis = "" } = await searchParams;
  const searchedNis = nis.trim();
  const [student, tariffs, invoiceCount, activeYear] = await Promise.all([
    searchedNis
      ? prisma.student.findUnique({
          where: { nis: searchedNis },
          include: {
            class: true,
            invoices: {
              include: { tariff: true },
              orderBy: { createdAt: "desc" },
            },
          },
        })
      : null,
    prisma.baseTariff.findMany({
      where: { isActive: true },
      orderBy: [{ isLocked: "desc" }, { name: "asc" }],
    }),
    prisma.invoice.count({
      where: { invoiceNumber: { startsWith: `INV-${new Date().getFullYear()}-` } },
    }),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
  ]);
  const sppTariff = tariffs.find((tariff) => tariff.name.toUpperCase() === "SPP");
  const effectiveSppAmount =
    student && sppTariff
      ? student.class.sppAmount?.toNumber() ?? sppTariff.amount.toNumber()
      : sppTariff?.amount.toNumber() ?? 0;
  const paidTotal =
    student?.invoices
      .filter((invoice) => invoice.status === "LUNAS")
      .reduce((sum, invoice) => sum + invoice.totalAmount.toNumber(), 0) ?? 0;
  const paidSppInvoices = sppMonthOrder
    .map((period) =>
      student?.invoices.find(
        (invoice) =>
          invoice.tariffId === sppTariff?.id &&
          invoice.status === "LUNAS" &&
          invoice.periodMonth === period.month &&
          invoice.academicYearId === activeYear?.id
      )
    )
    .filter(Boolean);
  const paidSppTotal = paidSppInvoices.reduce(
    (sum, invoice) => sum + (invoice?.totalAmount.toNumber() ?? 0),
    0
  );
  const annualSppTotal = student && sppTariff ? effectiveSppAmount * 12 : 0;
  const outstandingTotal = Math.max(annualSppTotal - paidSppTotal, 0);
  const months = sppMonthOrder.map((item) => {
    const monthInvoices = (student?.invoices ?? []).filter(
      (entry) =>
        entry.tariffId === sppTariff?.id &&
        entry.periodMonth === item.month &&
        entry.academicYearId === activeYear?.id
    );
    const invoice =
      monthInvoices.find((entry) => entry.status === "LUNAS") ?? monthInvoices[0];

    return {
      number: String(item.month),
      month: item.label,
      amount: invoice?.status === "LUNAS" ? formatNumber(invoice.totalAmount) : "0",
      status: invoiceStatusColor(invoice?.status) as "green" | "yellow" | "red",
    };
  });

  return (
    <div className="space-y-6">
      <CashTransactionForm
        nis={searchedNis}
        student={
          student
            ? {
                id: student.id,
                nis: student.nis,
                name: student.fullName,
                className: student.class.name,
              }
            : null
        }
        tariffs={tariffs.map((tariff) => ({
          id: tariff.id,
          name: tariff.name,
          amount: tariff.name.toUpperCase() === "SPP" ? effectiveSppAmount : tariff.amount.toNumber(),
          amountLabel:
            tariff.name.toUpperCase() === "SPP"
              ? formatCurrency(effectiveSppAmount)
              : formatCurrency(tariff.amount),
          fixed: tariff.isMandatory,
          defaultPaid: tariff.name.toUpperCase() === "SPP" ? formatNumber(effectiveSppAmount) : "",
        }))}
        months={months}
        paidTotal={paidTotal}
        outstandingTotal={outstandingTotal}
        nextInvoiceNumber={`INV-${new Date().getFullYear()}-${String(invoiceCount + 7001).padStart(5, "0")}`}
        activeYearName={activeYear?.name ?? "Aktif"}
      />
    </div>
  );
}
