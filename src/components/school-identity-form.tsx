"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { updateSchoolIdentity } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SchoolIdentity = {
  foundationName: string;
  schoolName: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string;
  activeYearName: string;
  receiptCity: string;
  treasurerName: string;
  receiptNotes: string;
};

function toast(detail: { type: "success" | "error"; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent("azkia-toast", { detail }));
}

export function SchoolIdentityForm({ school }: { school: SchoolIdentity }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await updateSchoolIdentity(formData);
        toast({
          type: "success",
          title: "Identitas tersimpan",
          description: result.message,
        });
        router.refresh();
      } catch (error) {
        toast({
          type: "error",
          title: "Gagal menyimpan identitas",
          description: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
        });
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Data Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Pemerintah / Yayasan</Label>
            <Input
              name="foundationName"
              required
              defaultValue={school.foundationName}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Nama Sekolah</Label>
            <Input
              name="schoolName"
              required
              defaultValue={school.schoolName}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Alamat</Label>
            <Textarea
              name="address"
              required
              defaultValue={school.address}
              className="min-h-20 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              required
              defaultValue={school.email}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Telepon / WhatsApp</Label>
            <Input name="phone" required defaultValue={school.phone} className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Tahun Pelajaran Aktif</Label>
            <Input
              name="activeYearName"
              required
              defaultValue={school.activeYearName}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Kota Cetak Kwitansi</Label>
            <Input
              name="receiptCity"
              required
              defaultValue={school.receiptCity}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Nama Bendahara / Penerima</Label>
            <Input
              name="treasurerName"
              required
              defaultValue={school.treasurerName}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input name="logoUrl" defaultValue={school.logoUrl} className="h-10 bg-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Catatan Kwitansi</Label>
            <Textarea
              name="receiptNotes"
              required
              defaultValue={school.receiptNotes}
              className="min-h-24 bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              className="bg-[#10b447] text-white hover:bg-[#078435]"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isPending ? "Menyimpan..." : "Simpan Identitas Sekolah"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
