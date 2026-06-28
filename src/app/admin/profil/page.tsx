import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/change-password-form";
import { requireCurrentUser } from "@/lib/auth";

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function AdminProfilPage() {
  const user = await requireCurrentUser();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
          Profil
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Profil Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola keamanan akun login aplikasi.
        </p>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-lg font-semibold text-slate-950">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email ?? user.phone ?? "-"}</p>
          </div>
          <Badge className="bg-[#e7f3d7] text-[#078435]">{roleLabel(user.role)}</Badge>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
