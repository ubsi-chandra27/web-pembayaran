"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";

export type LedgerRow = {
  id: string;
  transactionNumber: string;
  type: string;
  amount: number;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
  studentName: string;
  className: string;
  createdByName: string;
};

const PER_PAGE_OPTIONS = [5, 10, 20, 30] as const;

function typeLabel(type: string) {
  if (type === "SETORAN") return "Setoran";
  if (type === "PENARIKAN") return "Penarikan";
  if (type === "KOREKSI_MASUK") return "Koreksi Masuk";
  if (type === "KOREKSI_KELUAR") return "Koreksi Keluar";
  return type;
}

function isIncoming(type: string) {
  return type === "SETORAN" || type === "KOREKSI_MASUK";
}

export function LedgerTable({ transactions }: { transactions: LedgerRow[] }) {
  const [perPage, setPerPage] = useState<(typeof PER_PAGE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(1);

  const total = transactions.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const rows = transactions.slice(start, start + perPage);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  function onPerPageChange(value: number) {
    setPerPage(value as (typeof PER_PAGE_OPTIONS)[number]);
    setPage(1);
  }

  const pageNumbers = buildPageNumbers(safePage, totalPages);

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle>Ledger tabungan</CardTitle>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Tampilkan</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-950"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>baris</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Siswa</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="text-right">Saldo Akhir</TableHead>
              <TableHead>Petugas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-slate-400">
                  Belum ada transaksi tabungan.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, i) => {
              const incoming = isIncoming(row.type);
              return (
                <TableRow key={row.id}>
                  <TableCell className="text-center text-xs text-slate-400">
                    {start + i + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {row.transactionNumber}
                    {row.notes && (
                      <p className="mt-0.5 font-sans text-slate-400">{row.notes}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(new Date(row.createdAt))}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-950">{row.studentName}</p>
                    <p className="text-xs text-slate-400">{row.className}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        incoming
                          ? "bg-[#e7f3d7] text-[#078435]"
                          : "bg-rose-100 text-rose-700"
                      }
                    >
                      {typeLabel(row.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold ${
                        incoming ? "text-[#078435]" : "text-rose-700"
                      }`}
                    >
                      {incoming ? "+" : "-"}
                      {formatCurrency(row.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600">
                    {formatCurrency(row.balanceAfter)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {row.createdByName}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Footer: info + pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row">
          <p className="text-xs text-slate-400">
            {total === 0
              ? "Tidak ada data"
              : `Menampilkan ${start + 1}–${Math.min(start + perPage, total)} dari ${total} transaksi`}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 1}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </button>

              {pageNumbers.map((item, idx) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex size-8 items-center justify-center text-xs text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goTo(item as number)}
                    className={`flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                      safePage === item
                        ? "border-[#10b447] bg-[#10b447] text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                onClick={() => goTo(safePage + 1)}
                disabled={safePage === totalPages}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
