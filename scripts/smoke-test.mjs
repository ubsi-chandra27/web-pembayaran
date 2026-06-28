import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const [users, students, spp, activeYear, classes] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.baseTariff.findFirst({ where: { name: "SPP", isActive: true } }),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
    prisma.schoolClass.findMany({ select: { id: true, name: true, sppAmount: true } }),
  ]);

  assert(users > 0, "Smoke test gagal: belum ada user.");
  assert(students > 0, "Smoke test gagal: belum ada siswa.");
  assert(Boolean(spp), "Smoke test gagal: tarif SPP aktif belum tersedia.");
  assert(Boolean(activeYear), "Smoke test gagal: tahun ajaran aktif belum tersedia.");
  assert(classes.length > 0, "Smoke test gagal: belum ada kelas.");

  console.log("Smoke test OK");
  console.log(`- users: ${users}`);
  console.log(`- students: ${students}`);
  console.log(`- classes: ${classes.length}`);
  console.log(`- SPP default: ${spp.amount.toString()}`);
  console.log(`- active year: ${activeYear.name}`);
} finally {
  await prisma.$disconnect();
}
