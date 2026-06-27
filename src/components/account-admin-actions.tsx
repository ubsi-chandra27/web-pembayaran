"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createUserAccount } from "@/app/admin/actions";
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

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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
        notify({
          type: "success",
          title: "Akun dibuat",
          description: result.message,
        });
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
                <p className="mt-1 text-sm text-slate-500">
                  Buat akun login staff atau orang tua.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Tutup modal"
              >
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
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
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
                <Input
                  name="password"
                  defaultValue="demo12345"
                  className="bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#10b447] text-white hover:bg-[#078435]"
                >
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
