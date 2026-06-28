import { ClassAdminPanel } from "@/components/class-admin-actions";
import { prisma } from "@/lib/prisma";

export default async function AdminKelasPage() {
  const [classes, sppTariff] = await Promise.all([
    prisma.schoolClass.findMany({
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.baseTariff.findFirst({ where: { name: "SPP", isActive: true } }),
  ]);

  return (
    <ClassAdminPanel
      defaultSppAmount={sppTariff?.amount.toNumber() ?? 0}
      classes={classes.map((kelas) => ({
        id: kelas.id,
        name: kelas.name,
        level: kelas.level ?? "",
        sppAmount: kelas.sppAmount?.toNumber() ?? null,
        studentCount: kelas._count.students,
      }))}
    />
  );
}
