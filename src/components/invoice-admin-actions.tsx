"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Edit, Filter, Loader2, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";

import {
  cancelInvoice,
  createBulkInvoices,
  createIndividualInvoice,
  deleteInvoiceAsSuperAdmin,
  updateInvoice,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentOption = {
  id: string;
  nis: string;
  name: string;
  className: string;
};

type TariffOption = {
  id: string;
  name: string;
  amountLabel: string;
  amount: number;
};

type ClassOption = {
  id: string;
  name: string;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  dueDate: string;
  notes: string;
  status: string;
};

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
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl ring-1 ring-slate-200">
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

export function CreateInvoiceDialog({
  students,
  tariffs,
  classes,
}: {
  students: StudentOption[];
  tariffs: TariffOption[];
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [individualOpen, setIndividualOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  function handleIndividual(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createIndividualInvoice(formData);
        setIndividualOpen(false);
        toast({
          type: "success",
          title: "Tagihan individual berhasil dibuat",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal membuat tagihan",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  function handleBulk(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createBulkInvoices(formData);
        setBulkOpen(false);
        toast({
          type: "success",
          title: "Tagihan massal selesai",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal membuat tagihan massal",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button className="bg-[#10b447] text-white hover:bg-[#078435]" onClick={() => setIndividualOpen(true)}>
        <Plus className="size-4" />
        Buat Tagihan Individual
      </Button>
      <Button variant="outline" className="bg-white" onClick={() => setBulkOpen(true)}>
        <Plus className="size-4" />
        Tagihan Massal
      </Button>
      <Modal
        open={individualOpen}
        onClose={() => setIndividualOpen(false)}
        title="Buat Tagihan Individual"
        description="Nominal mengikuti tarif pokok. Judul invoice dibuat otomatis dari tagihan dan periode."
      >
        <form action={handleIndividual} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Siswa</Label>
            <select name="studentId" required className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Pilih siswa</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nis} - {student.name} ({student.className})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tagihan</Label>
            <select name="tariffId" required className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Pilih tagihan</option>
              {tariffs.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {tariff.name} - {tariff.amountLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Bulan Periode</Label>
            <select name="periodMonth" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Tidak periodik</option>
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tahun</Label>
            <Input name="periodYear" defaultValue={currentYear} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Jatuh tempo</Label>
            <Input name="dueDate" type="date" className="h-10 bg-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Catatan</Label>
            <Input name="notes" placeholder="Opsional" className="h-10 bg-white" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setIndividualOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {isPending ? "Menyimpan..." : "Simpan Tagihan"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Tagihan Massal"
        description="Buat tagihan untuk satu kelas atau semua siswa aktif."
      >
        <form action={handleBulk} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="scope" value="CLASS" />
          <div className="space-y-2 md:col-span-2">
            <Label>Sasaran kelas</Label>
            <select name="classId" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="ALL">Semua siswa aktif</option>
              {classes.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tagihan</Label>
            <select name="tariffId" required className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Pilih tagihan</option>
              {tariffs.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {tariff.name} - {tariff.amountLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Bulan Periode</Label>
            <select name="periodMonth" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Tidak periodik</option>
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tahun</Label>
            <Input name="periodYear" defaultValue={currentYear} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Jatuh tempo</Label>
            <Input name="dueDate" type="date" className="h-10 bg-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Catatan</Label>
            <Input name="notes" placeholder="Opsional" className="h-10 bg-white" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setBulkOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {isPending ? "Menyimpan..." : "Buat Tagihan Massal"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function InvoiceFilterButton({
  q,
  status,
  tariffId,
  tariffs,
}: {
  q: string;
  status: string;
  tariffId: string;
  tariffs: TariffOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" className="h-10 bg-white" onClick={() => setOpen(true)}>
        <Filter className="size-4" />
        Filter
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Filter Tagihan">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={() => setOpen(false)}>
          <input type="hidden" name="q" value={q} />
          <div className="space-y-2">
            <Label>Status</Label>
            <select name="status" defaultValue={status} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Semua status</option>
              <option value="BELUM_DIBAYAR">Belum dibayar</option>
              <option value="MENUNGGU_VERIFIKASI">Menunggu verifikasi</option>
              <option value="LUNAS">Lunas</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tagihan</Label>
            <select name="tariffId" defaultValue={tariffId} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Semua tagihan</option>
              {tariffs.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {tariff.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button className="bg-[#10b447] text-white hover:bg-[#078435]">
              <SlidersHorizontal className="size-4" />
              Terapkan Filter
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditInvoiceDialog({ invoice }: { invoice: InvoiceRow }) {
  const [open, setOpen] = useState(false);
  const disabled = invoice.status === "LUNAS" || invoice.status === "DIBATALKAN";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={`Edit ${invoice.invoiceNumber}`}
      >
        <Edit className="size-4 text-sky-700" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${invoice.invoiceNumber}`}>
        <form action={updateInvoice} className="grid gap-4 md:grid-cols-2" onSubmit={() => setOpen(false)}>
          <input type="hidden" name="id" value={invoice.id} />
          <div className="space-y-2 md:col-span-2">
            <Label>Judul tagihan</Label>
            <Input name="title" required defaultValue={invoice.title} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Nominal</Label>
            <Input name="amount" required defaultValue={invoice.amount} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Jatuh tempo</Label>
            <Input name="dueDate" type="date" defaultValue={invoice.dueDate} className="h-10 bg-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Catatan</Label>
            <Input name="notes" defaultValue={invoice.notes} className="h-10 bg-white" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button className="bg-[#10b447] text-white hover:bg-[#078435]">Simpan</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CancelInvoiceButton({
  invoiceId,
  invoiceNumber,
  disabled,
  permanent = false,
}: {
  invoiceId: string;
  invoiceNumber: string;
  disabled: boolean;
  permanent?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    const formData = new FormData();
    formData.set("id", invoiceId);

    startTransition(async () => {
      try {
        const message = permanent
          ? (await deleteInvoiceAsSuperAdmin(formData)).message
          : `${invoiceNumber} berhasil dibatalkan.`;

        if (!permanent) {
          await cancelInvoice(formData);
        }
        setOpen(false);
        toast({
          type: "success",
          title: permanent ? "Tagihan dihapus permanen" : "Tagihan dibatalkan",
          description: message,
        });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: permanent ? "Gagal menghapus tagihan" : "Gagal membatalkan tagihan",
          description: error instanceof Error ? error.message : "Terjadi kesalahan.",
        });
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="text-rose-700 hover:bg-rose-50"
        aria-label={permanent ? "Hapus permanen tagihan" : "Batalkan tagihan"}
      >
        <Trash2 className="size-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-[min(460px,calc(100vw-2rem))] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex justify-end p-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => !isPending && setOpen(false)}
                aria-label="Tutup modal"
                disabled={isPending}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="px-6 pb-6 text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <AlertTriangle className="size-9" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {permanent ? "Hapus permanen tagihan?" : "Batalkan tagihan?"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {permanent
                  ? `Invoice ${invoiceNumber} akan dihapus permanen dari database beserta payment, bukti, dan receipt terkait.`
                  : `Invoice ${invoiceNumber} akan diubah statusnya menjadi DIBATALKAN.`}
              </p>
              <div
                className={`mt-5 rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                  permanent
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {permanent
                  ? "Gunakan hanya untuk salah input data demo. Aksi ini tidak bisa dikembalikan dan dicatat di audit log."
                  : "Data tagihan tetap tersimpan sebagai arsip, tetapi tidak ditagihkan lagi."}
              </div>
            </div>
            <div className="grid gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-white"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="h-11 bg-rose-600 text-white hover:bg-rose-700"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {isPending
                  ? permanent
                    ? "Menghapus..."
                    : "Membatalkan..."
                  : permanent
                    ? "Ya, Hapus Permanen"
                    : "Ya, Batalkan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
