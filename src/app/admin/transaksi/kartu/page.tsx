import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const sppMonths = [
  { month: 7, year: 2026, label: "Juli 2026" },
  { month: 8, year: 2026, label: "Agustus 2026" },
  { month: 9, year: 2026, label: "September 2026" },
  { month: 10, year: 2026, label: "Oktober 2026" },
  { month: 11, year: 2026, label: "November 2026" },
  { month: 12, year: 2026, label: "Desember 2026" },
  { month: 1, year: 2027, label: "Januari 2027" },
  { month: 2, year: 2027, label: "Februari 2027" },
  { month: 3, year: 2027, label: "Maret 2027" },
  { month: 4, year: 2027, label: "April 2027" },
  { month: 5, year: 2027, label: "Mei 2027" },
  { month: 6, year: 2027, label: "Juni 2027" },
];

export default async function KartuPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ nis?: string }>;
}) {
  const { nis = "" } = await searchParams;
  const [school, student, sppTariff, activeYear] = await Promise.all([
    prisma.schoolSetting.findFirst(),
    nis
      ? prisma.student.findUnique({
          where: { nis },
          include: {
            class: true,
            invoices: { include: { tariff: true }, orderBy: { createdAt: "asc" } },
          },
        })
      : null,
    prisma.baseTariff.findFirst({ where: { name: "SPP", isActive: true } }),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
  ]);
  const sppRows = sppMonths.map((item) => {
    const invoice = student?.invoices.find(
      (entry) =>
        entry.tariffId === sppTariff?.id &&
        entry.periodMonth === item.month &&
        entry.periodYear === item.year &&
        entry.status === "LUNAS"
    );

    return [item.label, invoice ? formatNumber(invoice.totalAmount) : "-"];
  });
  const otherRows = (student?.invoices ?? [])
    .filter((invoice) => invoice.tariffId !== sppTariff?.id && invoice.status === "LUNAS")
    .slice(0, 5)
    .map((invoice) => [invoice.title, formatNumber(invoice.totalAmount)]);
  const otherTotal = (student?.invoices ?? [])
    .filter((invoice) => invoice.tariffId !== sppTariff?.id && invoice.status === "LUNAS")
    .reduce((sum, invoice) => sum + invoice.totalAmount.toNumber(), 0);
  const sppTotal = (student?.invoices ?? [])
    .filter((invoice) => invoice.tariffId === sppTariff?.id && invoice.status === "LUNAS")
    .reduce((sum, invoice) => sum + invoice.totalAmount.toNumber(), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-sky-600 p-4 text-white md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href={nis ? `/admin/transaksi?nis=${encodeURIComponent(nis)}` : "/admin/transaksi"} aria-label="Kembali ke transaksi">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Preview Kartu Pembayaran</h1>
            <p className="text-sm text-white/75">Kartu mengikuti data siswa, identitas sekolah, dan pembayaran lunas.</p>
          </div>
        </div>
        <Button className="bg-white text-sky-700 hover:bg-sky-50">
          <Printer className="size-4" />
          Cetak
        </Button>
      </div>

      <section className="mx-auto max-w-[560px] bg-white p-5 text-[13px] text-black shadow-sm ring-1 ring-slate-300">
        <div className="border-b-2 border-black pb-3 text-center">
          <h2 className="text-2xl font-bold tracking-[0.24em]">KARTU PEMBAYARAN</h2>
          <p className="text-xl font-semibold">{school?.schoolName ?? "TK Islam Azkia"}</p>
          <p>Tahun Ajaran {activeYear?.name ?? school?.activeYearName ?? "-"}</p>
          <p>Alamat: {school?.address ?? "-"}</p>
          <p>Phone: {school?.phone ?? "-"}</p>
          <p>E-mail: {school?.email ?? "-"}</p>
        </div>

        <div className="grid grid-cols-3 border-b border-black py-3">
          <div>
            <p className="text-xs">No Induk</p>
            <p className="font-bold">{student?.nis ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs">Nama</p>
            <p className="font-bold">{student?.fullName ?? "-"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">Kelas</p>
            <p className="font-bold">{student?.class.name ?? "-"}</p>
          </div>
        </div>

        <div className="grid gap-4 py-3 md:grid-cols-2">
          <table className="w-full border border-black">
            <thead>
              <tr>
                <th className="border border-black py-1">Bulan</th>
                <th className="border border-black py-1">Bayar</th>
              </tr>
            </thead>
            <tbody>
              {sppRows.map(([month, amount]) => (
                <tr key={month}>
                  <td className="border border-black px-2 py-1">{month}</td>
                  <td className="border border-black px-2 py-1 text-right">{amount}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="border border-black px-2 py-1">TOTAL</td>
                <td className="border border-black px-2 py-1 text-right">{formatNumber(sppTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div>
            <table className="w-full border border-black">
              <thead>
                <tr>
                  <th className="border border-black py-1">Jenis</th>
                  <th className="border border-black py-1">Bayar</th>
                </tr>
              </thead>
              <tbody>
                {[...otherRows, ...Array.from({ length: Math.max(0, 4 - otherRows.length) }).map(() => ["", "-"])].map(
                  ([name, amount], index) => (
                    <tr key={`${name}-${index}`}>
                      <td className="border border-black px-2 py-1">{name}</td>
                      <td className="border border-black px-2 py-1 text-right">{amount}</td>
                    </tr>
                  )
                )}
                <tr className="font-bold">
                  <td className="border border-black px-2 py-1">JUMLAH</td>
                  <td className="border border-black px-2 py-1 text-right">{otherTotal > 0 ? formatNumber(otherTotal) : "-"}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-8 text-center">
              <div className="grid grid-cols-2">
                <p>{school?.receiptCity ?? "Bekasi"}</p>
                <p>{formatDate(new Date())}</p>
              </div>
              <p>Bendahara,</p>
              <p className="mt-16 font-semibold">{school?.treasurerName ?? "-"}</p>
              <p>NIP. ............................</p>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-[#2412a8] p-3 text-[11px]">
          <p>1. Tunjukkan kartu ini kepada orang tua sebagai tanda pembayaran yang sah.</p>
          <p>2. Bila ada koreksi pembayaran, segera hubungi petugas TU.</p>
        </div>
      </section>
    </div>
  );
}
