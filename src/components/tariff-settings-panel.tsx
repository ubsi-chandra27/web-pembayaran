"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Edit, Loader2, LockKeyhole, Plus, Save, Trash2, WalletCards, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addBaseTariff,
  deleteBaseTariff,
  updateBaseTariff,
  updateSppTariff,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";

type TariffRow = {
  id: string;
  name: string;
  amount: number;
  description: string;
  isMandatory: boolean;
  isLocked: boolean;
};

function toast(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Tutup modal">
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function TariffSettingsPanel({ tariffs }: { tariffs: TariffRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TariffRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const spp = tariffs.find((tariff) => tariff.name.toUpperCase() === "SPP");

  function runAction(
    formData: FormData,
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>,
    successTitle: string,
    errorTitle: string,
    after?: () => void,
  ) {
    startTransition(async () => {
      try {
        const result = await action(formData);
        toast({ type: "success", title: successTitle, description: result.message });
        after?.();
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: errorTitle,
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
          Pengaturan
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Tarif Pokok Pembayaran
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          SPP wajib selalu ada dan tidak bisa dihapus. Tarif tambahan tanpa kategori.
        </p>
      </div>

      <form
        action={(formData) =>
          runAction(formData, addBaseTariff, "Tarif berhasil ditambahkan", "Gagal menambahkan tarif")
        }
      >
        <Card className="border-[#b7d889] bg-[#f3f8ea]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-5 text-[#078435]" />
              Tambah Tarif Pokok
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div className="space-y-2">
              <Label>Nama tarif pokok</Label>
              <Input name="name" required placeholder="Contoh: Buku, Kegiatan, Jemputan" className="h-10 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Tarif</Label>
              <Input name="amount" required placeholder="150000" className="h-10 bg-white" />
            </div>
            <Button type="submit" className="h-10 bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Tambah
            </Button>
          </CardContent>
        </Card>
      </form>

      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <form
          action={(formData) =>
            runAction(formData, updateSppTariff, "SPP berhasil disimpan", "Gagal menyimpan SPP")
          }
        >
          <Card className="border-[#b7d889] bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="size-5 text-[#078435]" />
                Tarif Wajib SPP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama tarif</Label>
                <Input value="SPP" readOnly className="h-10 bg-slate-50 font-semibold" />
              </div>
              <div className="space-y-2">
                <Label>Nominal SPP</Label>
                <Input
                  name="amount"
                  required
                  defaultValue={spp ? formatNumber(spp.amount) : "250000"}
                  className="h-10 bg-white"
                />
              </div>
              <p className="rounded-lg border border-[#b7d889] bg-[#f3f8ea] p-3 text-xs text-slate-600">
                Nama SPP dikunci karena menjadi dasar pembayaran bulanan, kwitansi, dan transaksi tunai.
              </p>
              <Button type="submit" className="w-full bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Simpan Nominal SPP
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="size-5 text-[#2412a8]" />
              Daftar Tarif Pokok
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama tarif</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs.map((tariff) => {
                  const type = tariff.isMandatory ? "Wajib" : "Tambahan";

                  return (
                    <TableRow key={tariff.id}>
                      <TableCell className="font-medium text-slate-950">{tariff.name}</TableCell>
                      <TableCell>{formatCurrency(tariff.amount)}</TableCell>
                      <TableCell>
                        <Badge className={type === "Wajib" ? "bg-[#e7f3d7] text-[#078435]" : "bg-slate-100 text-slate-700"}>
                          {type}
                        </Badge>
                      </TableCell>
                      <TableCell>Aktif</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={tariff.isLocked}
                            onClick={() => setEditing(tariff)}
                            aria-label={`Edit tarif ${tariff.name}`}
                          >
                            <Edit className="size-4 text-sky-700" />
                          </Button>
                          <form
                            action={(formData) =>
                              runAction(formData, deleteBaseTariff, "Tarif berhasil dihapus", "Gagal menghapus tarif")
                            }
                          >
                            <input type="hidden" name="id" value={tariff.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              disabled={tariff.isLocked || isPending}
                              className="text-rose-700 disabled:text-slate-300"
                              aria-label={`Nonaktifkan tarif ${tariff.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? "Tarif"}`}>
        {editing && (
          <form
            action={(formData) =>
              runAction(
                formData,
                updateBaseTariff,
                "Tarif berhasil diperbarui",
                "Gagal memperbarui tarif",
                () => setEditing(null),
              )
            }
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={editing.id} />
            <div className="space-y-2">
              <Label>Nama tarif</Label>
              <Input name="name" required defaultValue={editing.name} className="h-10 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Nominal</Label>
              <Input name="amount" required defaultValue={editing.amount} className="h-10 bg-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="bg-white" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
