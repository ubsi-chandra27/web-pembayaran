import { Search, Users } from "lucide-react";

import { CreateAccountDialog, EditAccountDialog } from "@/components/account-admin-actions";
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
import { avatarClass, roleBadgeClass, roleLabel } from "@/lib/account-format";
import { prisma } from "@/lib/prisma";

const roles = [
  "SUPER_ADMIN",
  "TATA_USAHA",
  "BENDAHARA",
  "ORANG_TUA",
  "KEPALA_SEKOLAH",
  "GURU",
];

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

  const totalActive = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Manajemen akun
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Akun Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola role, status, dan reset password — {totalActive} akun aktif.
          </p>
        </div>
        <CreateAccountDialog />
      </div>

      {/* Table card */}
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
              <select
                name="role"
                defaultValue={role}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Semua role</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabel(item)}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="h-10 bg-white">
                Filter
              </Button>
            </div>
          </form>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <TableHead className="pl-6">Pengguna</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Siswa terkait</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users className="size-8 opacity-40" />
                      <p className="text-sm">Tidak ada akun ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => {
                const children = user.guardians.flatMap((g) =>
                  g.students.map((s) => s.student.fullName),
                );
                const initials = user.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join("");

                return (
                  <TableRow key={user.id} className="group">
                    {/* Pengguna */}
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${avatarClass(user.role)}`}
                        >
                          {initials}
                        </span>
                        <div>
                          <p className="font-medium text-slate-950">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email ?? "-"}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Kontak */}
                    <TableCell className="text-sm text-slate-600">
                      {user.phone ?? (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>

                    {/* Siswa terkait */}
                    <TableCell>
                      {children.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {children.map((name) => (
                            <Badge
                              key={name}
                              className="bg-slate-100 text-xs font-normal text-slate-600"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge className={`text-xs ${roleBadgeClass(user.role)}`}>
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        className={
                          user.status === "ACTIVE"
                            ? "bg-[#e7f3d7] text-[#078435]"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="pr-6 text-right">
                      <EditAccountDialog
                        user={{
                          id: user.id,
                          name: user.name,
                          role: user.role,
                          status: user.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
