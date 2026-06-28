"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UserRoundPlus,
  UserX,
  X,
} from "lucide-react";

import {
  addGuardianAccountToStudent,
  createStudentWithGuardian,
  deactivateStudent,
  deleteStudent,
  updateStudent,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClassOption = {
  id: string;
  name: string;
};

type StudentRow = {
  id: string;
  nis: string;
  fullName: string;
  nickname: string;
  gender: string;
  address: string;
  status: string;
  classId: string;
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

function ClassSelect({
  classes,
  name = "classId",
  defaultValue,
}: {
  classes: ClassOption[];
  name?: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      required
      defaultValue={defaultValue ?? ""}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
    >
      <option value="">Pilih kelas</option>
      {classes.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}

function notify(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function CreateStudentDialog({
  classes,
  demoDefaultsAllowed,
}: {
  classes: ClassOption[];
  demoDefaultsAllowed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createStudentWithGuardian(formData);
        setOpen(false);
        notify({
          type: "success",
          title: "Siswa berhasil ditambahkan",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal menambahkan siswa",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <>
      <Button className="bg-[#10b447] text-white hover:bg-[#078435]" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Tambah Siswa
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Siswa dan Akun Orang Tua"
        description="Akun orang tua dibuat sekaligus bila email atau WhatsApp wali diisi."
      >
        <form action={handleCreate} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>NIS</Label>
            <Input name="nis" required placeholder="2026005" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Kelas</Label>
            <ClassSelect classes={classes} />
          </div>
          <div className="space-y-2">
            <Label>Nama lengkap siswa</Label>
            <Input name="fullName" required placeholder="Nama siswa" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Nama panggilan</Label>
            <Input name="nickname" placeholder="Panggilan" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Jenis kelamin</Label>
            <select name="gender" required className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal lahir</Label>
            <Input name="birthDate" type="date" className="h-10 bg-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Alamat</Label>
            <Input name="address" placeholder="Alamat siswa/wali" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Nama orang tua/wali</Label>
            <Input name="guardianName" placeholder="Nama wali" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Hubungan</Label>
            <Input name="guardianRelation" defaultValue="Ayah" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Email wali untuk login</Label>
            <Input name="guardianEmail" type="email" placeholder="wali@email.com" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp wali</Label>
            <Input name="guardianPhone" placeholder="0812..." className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Password orang tua</Label>
            <Input
              name="guardianPassword"
              defaultValue={demoDefaultsAllowed ? "demo12345" : ""}
              required={!demoDefaultsAllowed}
              placeholder={demoDefaultsAllowed ? "demo12345" : "Wajib diisi di production"}
              className="h-10 bg-white"
            />
            <p className="text-xs text-slate-400">
              {demoDefaultsAllowed
                ? "Mode lokal masih boleh memakai password demo."
                : "Mode production mewajibkan password wali saat akun dibuat."}
            </p>
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditStudentDialog({
  student,
  classes,
}: {
  student: StudentRow;
  classes: ClassOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await updateStudent(formData);
        setOpen(false);
        notify({
          type: "success",
          title: "Siswa berhasil diperbarui",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal memperbarui siswa",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Edit ${student.fullName}`}>
        <Edit className="size-4 text-sky-700" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${student.fullName}`} description={`NIS ${student.nis}`}>
        <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={student.id} />
          <div className="space-y-2">
            <Label>Nama lengkap</Label>
            <Input name="fullName" required defaultValue={student.fullName} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Nama panggilan</Label>
            <Input name="nickname" defaultValue={student.nickname} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Kelas</Label>
            <ClassSelect classes={classes} defaultValue={student.classId} />
          </div>
          <div className="space-y-2">
            <Label>Jenis kelamin</Label>
            <select name="gender" defaultValue={student.gender} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select name="status" defaultValue={student.status} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="ACTIVE">Aktif</option>
              <option value="GRADUATED">Lulus</option>
              <option value="MOVED">Pindah</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input name="address" defaultValue={student.address} className="h-10 bg-white" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SyncGuardianDialog({
  studentId,
  studentName,
  demoDefaultsAllowed,
}: {
  studentId: string;
  studentName: string;
  demoDefaultsAllowed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSync(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await addGuardianAccountToStudent(formData);
        setOpen(false);
        notify({
          type: "success",
          title: "Akun wali berhasil disinkronkan",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal sinkron akun wali",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Sinkron akun wali ${studentName}`}>
        <RefreshCw className="size-4 text-[#078435]" />
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Sinkron Akun Orang Tua"
        description={`Buat atau hubungkan akun wali untuk siswa ${studentName}.`}
      >
        <form action={handleSync} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="studentId" value={studentId} />
          <div className="space-y-2 md:col-span-2">
            <Label>Siswa</Label>
            <Input value={studentName} readOnly className="h-10 bg-slate-50 font-medium" />
          </div>
          <div className="space-y-2">
            <Label>Nama wali</Label>
            <Input name="guardianName" required placeholder="Nama wali" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Hubungan</Label>
            <Input name="guardianRelation" defaultValue="Ibu" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Email login</Label>
            <Input name="guardianEmail" type="email" placeholder="wali@email.com" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input name="guardianPhone" placeholder="0812..." className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Password awal</Label>
            <Input
              name="guardianPassword"
              defaultValue={demoDefaultsAllowed ? "demo12345" : ""}
              required={!demoDefaultsAllowed}
              placeholder={demoDefaultsAllowed ? "demo12345" : "Wajib diisi di production"}
              className="h-10 bg-white"
            />
            <p className="text-xs text-slate-400">
              {demoDefaultsAllowed
                ? "Mode lokal masih boleh memakai password demo."
                : "Mode production mewajibkan password wali saat sinkron akun."}
            </p>
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#10b447] text-white hover:bg-[#078435]" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {isPending ? "Menyimpan..." : "Sinkron Akun"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeactivateStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  return (
    <form action={deactivateStudent}>
      <input type="hidden" name="id" value={studentId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="text-amber-700"
        aria-label={`Nonaktifkan ${studentName}`}
        title="Nonaktifkan siswa"
      >
        <UserX className="size-4" />
      </Button>
    </form>
  );
}

export function DeleteStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", studentId);

      try {
        const result = await deleteStudent(formData);
        setConfirming(false);
        notify({
          type: "success",
          title: "Siswa berhasil dihapus",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal menghapus siswa",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-rose-700"
        onClick={() => setConfirming(true)}
        aria-label={`Hapus ${studentName}`}
        title="Hapus siswa"
      >
        <Trash2 className="size-4" />
      </Button>
      {confirming && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-1 ring-amber-200">
              <AlertTriangle className="size-10" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">
              Hapus {studentName}?
            </h2>
            <p className="mx-auto mt-2 max-w-sm whitespace-normal text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">
              Semua data pembayaran dan tabungan siswa ini akan ikut dihapus dari database demo.
            </p>
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm leading-6 text-rose-700">
              <p className="whitespace-normal [overflow-wrap:anywhere]">
                Gunakan hapus hanya untuk salah input. Untuk siswa lulus atau pindah, ubah status lewat edit.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-white"
                onClick={() => setConfirming(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="h-11 bg-rose-600 text-white hover:bg-rose-700"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
