import { redirect } from "next/navigation";
import { AlertTriangle, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function jsonSummary(value: unknown) {
  if (!value) return "-";

  try {
    const text = JSON.stringify(value);
    return text.length > 120 ? `${text.slice(0, 120)}...` : text;
  } catch {
    return "-";
  }
}

function actionTone(action: string) {
  if (action.includes("DELETE") || action.includes("RESET")) {
    return "bg-rose-100 text-rose-700";
  }
  if (action.includes("VERIFIED") || action.includes("CREATED")) {
    return "bg-[#e7f3d7] text-[#078435]";
  }
  return "bg-slate-100 text-slate-700";
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-0.5 size-5 text-amber-700" />
            <div>
              <h1 className="font-semibold text-amber-950">Akses khusus Super Admin</h1>
              <p className="mt-1 text-sm text-amber-800">
                Audit log menyimpan jejak aksi sensitif, jadi hanya Super Admin yang dapat melihat halaman ini.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { q = "", entity = "" } = await searchParams;
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity ? { entity } : {}),
      ...(q
        ? {
            OR: [
              { action: { contains: q } },
              { entity: { contains: q } },
              { entityId: { contains: q } },
              { user: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const entities = await prisma.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    orderBy: { entity: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Super Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Jejak aksi penting seperti reset password, verifikasi, hapus data, dan transaksi.
          </p>
        </div>
        <Badge className="w-fit bg-[#e7f3d7] text-[#078435]">
          <ShieldCheck className="size-3.5" />
          {logs.length} log terakhir
        </Badge>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100">
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Cari aksi, entity, user..."
                className="h-10 bg-white pl-9"
              />
            </div>
            <select
              name="entity"
              defaultValue={entity}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Semua entity</option>
              {entities.map((item) => (
                <option key={item.entity} value={item.entity}>
                  {item.entity}
                </option>
              ))}
            </select>
            <button className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Filter
            </button>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Ringkasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-950">
                      {log.user?.name ?? "Sistem"}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionTone(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs text-slate-600">{log.entity}</p>
                      <p className="font-mono text-[11px] text-slate-400">{log.entityId}</p>
                    </TableCell>
                    <TableCell className="max-w-xl font-mono text-xs text-slate-500">
                      {jsonSummary(log.after ?? log.before)}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                      Belum ada audit log sesuai filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
