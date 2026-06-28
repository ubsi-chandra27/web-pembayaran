import { Search } from "lucide-react";

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
import {
  CreateStudentDialog,
  DeactivateStudentButton,
  DeleteStudentButton,
  EditStudentDialog,
  SyncGuardianDialog,
} from "@/components/student-admin-actions";
import { prisma } from "@/lib/prisma";
import { allowDemoDefaults } from "@/lib/runtime-config";

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Aktif";
  if (status === "GRADUATED") return "Lulus";
  if (status === "MOVED") return "Pindah";
  return "Nonaktif";
}

function genderLabel(gender: string) {
  return gender === "FEMALE" ? "P" : "L";
}

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string; status?: string }>;
}) {
  const { q = "", classId = "", status = "" } = await searchParams;
  const demoDefaultsAllowed = allowDemoDefaults();
  const [classes, students] = await Promise.all([
    prisma.schoolClass.findMany({
      include: { academicYear: true },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { nis: { contains: q } },
                { fullName: { contains: q } },
                { nickname: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        class: true,
        guardians: { include: { guardian: { include: { user: true } } } },
      },
      orderBy: { fullName: "asc" },
    }),
  ]);
  const classOptions = classes.map((item) => ({ id: item.id, name: item.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Master siswa
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Data Siswa
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola siswa, kelas, status, dan sinkron akun orang tua.
          </p>
        </div>
        <CreateStudentDialog
          classes={classOptions}
          demoDefaultsAllowed={demoDefaultsAllowed}
        />
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Cari nama, panggilan, atau NIS..."
                className="h-10 bg-white pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select name="classId" defaultValue={classId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <option value="">Semua kelas</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select name="status" defaultValue={status} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <option value="">Semua status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="GRADUATED">Lulus</option>
                <option value="MOVED">Pindah</option>
                <option value="INACTIVE">Nonaktif</option>
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
                  <TableHead className="w-28">NIS</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>JK</TableHead>
                  <TableHead>Akun Orang Tua</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const primaryGuardian = student.guardians.find((item) => item.isPrimary)?.guardian;
                  const accounts = student.guardians
                    .map((item) => item.guardian.user?.email ?? item.guardian.user?.phone)
                    .filter(Boolean);

                  return (
                    <TableRow key={student.id} className={student.status !== "ACTIVE" ? "opacity-60" : undefined}>
                      <TableCell className="font-mono text-xs text-slate-600">{student.nis}</TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-950">{student.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {student.nickname || "-"}{student.address ? ` - ${student.address}` : ""}
                        </p>
                      </TableCell>
                      <TableCell>{student.class.name}</TableCell>
                      <TableCell>{genderLabel(student.gender)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-950">{primaryGuardian?.name ?? "-"}</p>
                        <p className="text-xs text-slate-500">
                          {accounts.length > 0 ? accounts.join(", ") : "Belum ada akun"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#b7d889] bg-[#f3f8ea] text-[#078435]">
                          {statusLabel(student.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <EditStudentDialog
                            classes={classOptions}
                            student={{
                              id: student.id,
                              nis: student.nis,
                              fullName: student.fullName,
                              nickname: student.nickname ?? "",
                              gender: student.gender,
                              address: student.address ?? "",
                              status: student.status,
                              classId: student.classId,
                            }}
                          />
                          <SyncGuardianDialog
                            studentId={student.id}
                            studentName={student.fullName}
                            demoDefaultsAllowed={demoDefaultsAllowed}
                          />
                          <DeactivateStudentButton studentId={student.id} studentName={student.fullName} />
                          <DeleteStudentButton studentId={student.id} studentName={student.fullName} />
                        </div>
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
