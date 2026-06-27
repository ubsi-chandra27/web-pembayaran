"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createUserAccount, updateUserAccount } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roles = [
  "SUPER_ADMIN",
  "TATA_USAHA",
  "BENDAHARA",
  "ORANG_TUA",
  "KEPALA_SEKOLAH",
  "GURU",
];

export function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function roleBadgeClass(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-indigo-100 text-indigo-700",
    TATA_USAHA: "bg-sky-100 text-sky-700",
    BENDAHARA: "bg-amber-100 text-amber-700",
    ORANG_TUA: "bg-teal-100 text-teal-700",
    KEPALA_SEKOLAH: "bg-purple-100 text-purple-700",
    GURU: "bg-rose-100 text-rose-700",
  };
  return map[role] ?? "bg-slate-100 text-slate-700";
}

export function avatarClass(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-indigo-600",
    TATA_USAHA: "bg-sky-600",
    BENDAHARA: "bg-amber-500",
    ORANG_TUA: "bg-teal-600",
    KEPALA_SEKOLAH: "bg-purple-600",
    GURU: "bg-rose-500",
  };
  return map[role] ?? "bg-slate-500";
}

function notify(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createUserAccount(formData);
        setOpen(false);
        notify({ type: "success", title: "Akun dibuat", description: result.message });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal membuat akun",
          description: error instanceof Error ? error.message : "Cek data akun.",
        });
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[#10b447] text-white hover:bg-[#078435]"
      >
        <Plus className="size-4" />
        Tambah Akun
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Tambah Akun</h2>
                <p className="mt-1 text-sm text-slate-500">Buat akun login staff atau orang tua.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup">
                <X className="size-4" />
              </Button>
            </div>
            <form action={handleSubmit} className="grid gap-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama</Label>
                  <Input name="name" required className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    name="role"
                    defaultValue="ORANG_TUA"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{roleLabel(role)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input name="phone" className="bg-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" defaultValue="demo12345" className="bg-white" />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)} disabled={isPending}>
                  Batal
                </Button>
                <Button type="submit" disabled={isPending} className="bg-[#10b447] text-white hover:bg-[#078435]">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Simpan Akun
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function EditAccountDialog({
  user,
}: {
  user: { id: string; name: string; role: string; status: string };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateUserAccount(formData);
        setOpen(false);
        notify({
          type: "success",
          title: "Akun diperbarui",
          description: `Perubahan akun ${user.name} berhasil disimpan.`,
        });
        router.refresh();
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal memperbarui akun",
          description: error instanceof Error ? error.message : "Terjadi kesalahan.",
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
        onClick={() => setOpen(true)}
        aria-label={`Edit akun ${user.name}`}
        className="text-slate-600 hover:bg-slate-100"
      >
        <Pencil className="size-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white ${avatarClass(user.role)}`}
                >
                  {user.name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("")}
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">{user.name}</h2>
                  <Badge className={`mt-0.5 text-xs ${roleBadgeClass(user.role)}`}>
                    {roleLabel(user.role)}
                  </Badge>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup">
                <X className="size-4" />
              </Button>
            </div>

            <form action={handleSubmit} className="grid gap-4 p-5">
              <input type="hidden" name="id" value={user.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{roleLabel(r)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    name="status"
                    defaultValue={user.status}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Password reset (opsional) */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
                >
                  <KeyRound className="size-4" />
                  {showPassword ? "Sembunyikan reset password" : "Reset password akun"}
                </button>
                {showPassword && (
                  <div className="mt-3 space-y-2">
                    <Label>Password baru</Label>
                    <Input
                      name="password"
                      placeholder="Minimal 6 karakter"
                      className="h-10 bg-white"
                    />
                    <p className="text-xs text-slate-400">Kosongkan jika tidak ingin mengubah password.</p>
                  </div>
                )}
                {!showPassword && <input type="hidden" name="password" value="" />}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                <Button type="button" variant="outline" className="bg-white" onClick={() => setOpen(false)} disabled={isPending}>
                  Batal
                </Button>
                <Button type="submit" disabled={isPending} className="bg-[#10b447] text-white hover:bg-[#078435]">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
