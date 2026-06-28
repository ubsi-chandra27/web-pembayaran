"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Edit, Loader2, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClass, deleteClasses, updateClass } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

type ClassRow = {
  id: string;
  name: string;
  level: string;
  sppAmount: number | null;
  studentCount: number;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Tutup modal">
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function toast(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function ClassAdminPanel({
  classes,
  defaultSppAmount,
}: {
  classes: ClassRow[];
  defaultSppAmount: number;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const allSelected = classes.length > 0 && selectedIds.length === classes.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? classes.map((kelas) => kelas.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((selectedId) => selectedId !== id),
    );
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const formData = new FormData();
      selectedIds.forEach((id) => formData.append("ids", id));

      try {
        const result = await deleteClasses(formData);
        toast({
          type: result.ok ? "success" : "error",
          title: result.ok ? "Kelas berhasil dihapus" : "Tidak ada kelas terhapus",
          description: result.message,
        });
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal menghapus kelas",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createClass(formData);
        setCreateOpen(false);
        toast({
          type: "success",
          title: "Kelas berhasil ditambahkan",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal menambahkan kelas",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await updateClass(formData);
        setEditing(null);
        toast({
          type: "success",
          title: "Kelas berhasil diperbarui",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal memperbarui kelas",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Master kelas
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Data Kelas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola kelas untuk siswa dan tagihan massal.
          </p>
        </div>
        <Button className="bg-[#10b447] text-white hover:bg-[#078435]" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Tambah Kelas
        </Button>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="flex min-h-10 items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">
              {classes.length} kelas terdaftar
            </p>
            {selectedIds.length > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-10 border-rose-200 bg-white text-rose-700"
                onClick={handleBulkDelete}
                disabled={isPending}
                title="Hapus kelas terpilih"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {allSelected ? "Hapus Semua" : `Hapus Terpilih (${selectedIds.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      aria-label="Pilih semua kelas"
                      checked={allSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                      className="size-4 rounded border-slate-300 accent-[#10b447]"
                    />
                  </TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>SPP</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${kelas.name}`}
                        checked={selectedSet.has(kelas.id)}
                        onChange={(event) => toggleOne(kelas.id, event.target.checked)}
                        className="size-4 rounded border-slate-300 accent-[#10b447]"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-950">{kelas.name}</TableCell>
                    <TableCell>{kelas.level || "-"}</TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">
                        {rupiah(kelas.sppAmount ?? defaultSppAmount)}
                      </p>
                      {!kelas.sppAmount && (
                        <p className="text-xs text-slate-500">Ikut default</p>
                      )}
                    </TableCell>
                    <TableCell>{kelas.studentCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(kelas)}
                          aria-label={`Edit ${kelas.name}`}
                          title="Edit kelas"
                        >
                          <Edit className="size-4 text-sky-700" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {classes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      Belum ada data kelas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Kelas"
        description="Isi nama dan level kelas. Tahun ajaran aktif dipakai otomatis."
      >
        <form action={handleCreate} className="grid gap-4">
          <div className="space-y-2">
            <Label>Nama Kelas</Label>
            <Input name="name" required placeholder="TK A Ceria" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Level Kelas</Label>
            <Input name="level" placeholder="TK A" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Nominal SPP khusus</Label>
            <Input
              name="sppAmount"
              inputMode="numeric"
              placeholder={`Kosongkan untuk default ${rupiah(defaultSppAmount)}`}
              className="h-10 bg-white"
            />
            <p className="text-xs text-slate-500">
              Contoh PAUD: 75000. Jika kosong, kelas memakai SPP default.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isPending ? "Menyimpan..." : "Simpan Kelas"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? "Kelas"}`}
      >
        {editing && (
          <form action={handleUpdate} className="grid gap-4">
            <input type="hidden" name="id" value={editing.id} />
            <div className="space-y-2">
              <Label>Nama Kelas</Label>
              <Input name="name" required defaultValue={editing.name} className="h-10 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Level Kelas</Label>
              <Input name="level" defaultValue={editing.level} className="h-10 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Nominal SPP khusus</Label>
              <Input
                name="sppAmount"
                inputMode="numeric"
                defaultValue={editing.sppAmount ?? ""}
                placeholder={`Kosongkan untuk default ${rupiah(defaultSppAmount)}`}
                className="h-10 bg-white"
              />
              <p className="text-xs text-slate-500">
                Nilai ini dipakai otomatis saat membuat tagihan dan transaksi SPP.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="bg-white" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
