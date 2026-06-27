import { KeyRound, Search, UserCog } from "lucide-react";

import { updateUserAccount } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

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

export default async function AkunPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q = "", role = "" } = await searchParams;
  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: { guardians: { include: { students: { include: { student: true } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
          Manajemen akun
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Akun Pengguna
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola role, status, dan reset password akun lokal.
        </p>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Cari nama, email, atau WhatsApp..."
                className="h-10 bg-white pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select name="role" defaultValue={role} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <option value="">Semua role</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabel(item)}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="h-10 bg-white">Filter</Button>
            </div>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Anak terkait</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password Baru</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const children = user.guardians.flatMap((guardian) =>
                    guardian.students.map((item) => item.student.fullName)
                  );

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCog className="size-4 text-[#078435]" />
                          <span className="font-medium text-slate-950">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{user.email ?? "-"}</p>
                        <p className="text-xs text-slate-500">{user.phone ?? "-"}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {children.length > 0 ? children.join(", ") : "-"}
                      </TableCell>
                      <TableCell>
                        <form id={`account-${user.id}`} action={updateUserAccount}>
                          <input type="hidden" name="id" value={user.id} />
                          <select name="role" defaultValue={user.role} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">
                            {roles.map((item) => (
                              <option key={item} value={item}>
                                {roleLabel(item)}
                              </option>
                            ))}
                          </select>
                        </form>
                      </TableCell>
                      <TableCell>
                        <select form={`account-${user.id}`} name="status" defaultValue={user.status} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">
                          <option value="ACTIVE">Aktif</option>
                          <option value="INACTIVE">Nonaktif</option>
                        </select>
                        <Badge className={user.status === "ACTIVE" ? "ml-2 bg-[#e7f3d7] text-[#078435]" : "ml-2 bg-slate-100 text-slate-700"}>
                          {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          form={`account-${user.id}`}
                          name="password"
                          placeholder="Kosongkan jika tidak reset"
                          className="h-9 min-w-52 bg-white"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button form={`account-${user.id}`} size="sm" className="bg-[#10b447] text-white hover:bg-[#078435]">
                          <KeyRound className="size-4" />
                          Simpan
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
