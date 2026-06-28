import { ChangePasswordForm } from "@/components/change-password-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ParentAccountPage() {
  const user = await requireCurrentUser();
  const guardian = await prisma.guardian.findFirst({
    where: { userId: user.id },
    include: { students: { include: { student: { include: { class: true } } } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
          Akun
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Akun Wali Murid</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lihat data akun dan ganti password login.
        </p>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Nama</p>
            <p className="font-semibold text-slate-950">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Kontak login</p>
            <p className="font-semibold text-slate-950">{user.email ?? user.phone ?? "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500">Anak terhubung</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(guardian?.students ?? []).map((item) => (
                <Badge key={item.id} className="bg-[#e7f3d7] text-[#078435]">
                  {item.student.fullName} - {item.student.class.name}
                </Badge>
              ))}
              {!guardian?.students.length && (
                <span className="text-sm text-slate-500">Belum ada siswa terhubung.</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
