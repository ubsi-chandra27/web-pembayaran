"use client";

import { useRef, useTransition } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";

import { changeOwnPassword } from "@/app/account-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function notify(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await changeOwnPassword(formData);
        formRef.current?.reset();
        notify({ type: "success", title: "Password diganti", description: result.message });
      } catch (error) {
        notify({
          type: "error",
          title: "Gagal mengganti password",
          description: error instanceof Error ? error.message : "Cek kembali password.",
        });
      }
    });
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-[#078435]" />
          Ubah Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label>Password lama</Label>
            <Input name="currentPassword" type="password" required className="h-10 bg-white" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Password baru</Label>
              <Input name="newPassword" type="password" required minLength={8} className="h-10 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi password baru</Label>
              <Input name="confirmPassword" type="password" required minLength={8} className="h-10 bg-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Gunakan minimal 8 karakter. Setelah diganti, gunakan password baru pada login berikutnya.
          </p>
          <div>
            <Button type="submit" disabled={isPending} className="bg-[#10b447] text-white hover:bg-[#078435]">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isPending ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
