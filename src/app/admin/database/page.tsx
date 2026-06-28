import Link from "next/link";
import { redirect } from "next/navigation";
import { DatabaseBackup, Download, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function DatabasePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-6">
          <ShieldAlert className="mt-0.5 size-5 text-amber-700" />
          <div>
            <h1 className="font-semibold text-amber-950">Akses khusus Super Admin</h1>
            <p className="mt-1 text-sm text-amber-800">
              Backup database hanya tersedia untuk Super Admin.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Backup Data</h1>
        <p className="mt-1 text-sm text-slate-500">
          Unduh salinan database lokal SQLite sebelum perubahan besar atau sebelum deploy.
        </p>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseBackup className="size-5 text-[#078435]" />
            Backup Database Lokal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-[#b7d889] bg-[#f3f8ea] p-4 text-sm text-slate-700">
            File backup berisi seluruh data demo/lokal saat ini: siswa, wali, akun, tagihan,
            pembayaran, tabungan, pengaturan, dan audit log.
          </div>
          <Button asChild className="bg-[#10b447] text-white hover:bg-[#078435]">
            <Link href="/admin/database/backup">
              <Download className="size-4" />
              Unduh Backup .db
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="space-y-2 p-5 text-sm text-amber-900">
          <p className="font-semibold">Catatan restore</p>
          <p>
            Untuk SQLite lokal, proses restore paling aman dilakukan saat dev server mati:
            ganti file `prisma/dev.db` dengan file backup, lalu jalankan kembali server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
