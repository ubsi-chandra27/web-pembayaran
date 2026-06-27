import { ClassAdminPanel } from "@/components/class-admin-actions";
import { prisma } from "@/lib/prisma";

export default async function AdminKelasPage() {
  const classes = await prisma.schoolClass.findMany({
    include: {
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <ClassAdminPanel
      classes={classes.map((kelas) => ({
        id: kelas.id,
        name: kelas.name,
        level: kelas.level ?? "",
        studentCount: kelas._count.students,
      }))}
    />
  );
}
