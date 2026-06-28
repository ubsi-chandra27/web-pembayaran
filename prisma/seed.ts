import { PrismaClient, Prisma } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const amount = (value: number) => new Prisma.Decimal(value);

function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");

  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function isSqliteDatabase() {
  return (process.env.DATABASE_URL || "").startsWith("file:");
}

function isProductionSeed() {
  return process.env.NODE_ENV === "production" || process.env.APP_MODE === "production";
}

function env(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

async function ensureSqliteSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "role" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "passwordHash" TEXT NOT NULL,
      "avatarUrl" TEXT,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "AcademicYear" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "startsAt" DATETIME NOT NULL,
      "endsAt" DATETIME NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "classes" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "academicYearId" TEXT NOT NULL,
      "teacherId" TEXT,
      "name" TEXT NOT NULL,
      "level" TEXT,
      "sppAmount" DECIMAL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Student" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "classId" TEXT NOT NULL,
      "nis" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "nickname" TEXT,
      "gender" TEXT NOT NULL,
      "birthDate" DATETIME,
      "address" TEXT,
      "photoUrl" TEXT,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Guardian" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT,
      "name" TEXT NOT NULL,
      "relation" TEXT NOT NULL,
      "phone" TEXT,
      "email" TEXT,
      "address" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "student_guardians" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "guardianId" TEXT NOT NULL,
      "isPrimary" BOOLEAN NOT NULL DEFAULT false
    )`,
    `CREATE TABLE IF NOT EXISTS "BaseTariff" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "amount" DECIMAL NOT NULL,
      "description" TEXT,
      "isMandatory" BOOLEAN NOT NULL DEFAULT false,
      "isLocked" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Invoice" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "tariffId" TEXT NOT NULL,
      "academicYearId" TEXT NOT NULL,
      "invoiceNumber" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "periodMonth" INTEGER,
      "periodYear" INTEGER,
      "amount" DECIMAL NOT NULL,
      "discountAmount" DECIMAL NOT NULL DEFAULT 0,
      "fineAmount" DECIMAL NOT NULL DEFAULT 0,
      "totalAmount" DECIMAL NOT NULL,
      "dueDate" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'BELUM_DIBAYAR',
      "notes" TEXT,
      "createdById" TEXT NOT NULL,
      "paidAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "invoiceId" TEXT NOT NULL,
      "paymentNumber" TEXT NOT NULL,
      "amount" DECIMAL NOT NULL,
      "method" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
      "paidAt" DATETIME NOT NULL,
      "verifiedAt" DATETIME,
      "verifiedById" TEXT,
      "rejectionReason" TEXT,
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "PaymentProof" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "paymentId" TEXT NOT NULL,
      "fileUrl" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "fileMime" TEXT NOT NULL,
      "fileSize" INTEGER NOT NULL,
      "uploadedById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Receipt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "paymentId" TEXT NOT NULL,
      "receiptNumber" TEXT NOT NULL,
      "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "issuedById" TEXT NOT NULL,
      "pdfUrl" TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS "SavingsAccount" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "accountNumber" TEXT NOT NULL,
      "balance" DECIMAL NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "SavingsTransaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "transactionNumber" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" DECIMAL NOT NULL,
      "balanceBefore" DECIMAL NOT NULL,
      "balanceAfter" DECIMAL NOT NULL,
      "notes" TEXT,
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "SchoolSetting" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "foundationName" TEXT NOT NULL,
      "schoolName" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "logoUrl" TEXT NOT NULL,
      "activeYearName" TEXT NOT NULL,
      "receiptCity" TEXT NOT NULL,
      "treasurerName" TEXT NOT NULL,
      "receiptNotes" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "BankAccount" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "bankName" TEXT NOT NULL,
      "accountNumber" TEXT NOT NULL,
      "accountHolder" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "HeroSlide" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "imageUrl" TEXT NOT NULL,
      "alt" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "caption" TEXT NOT NULL,
      "position" TEXT NOT NULL DEFAULT 'object-center',
      "sortOrder" INTEGER NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "entity" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "before" TEXT,
      "after" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AcademicYear_name_key" ON "AcademicYear"("name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "classes_academicYearId_name_key" ON "classes"("academicYearId", "name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Student_nis_key" ON "Student"("nis")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "student_guardians_studentId_guardianId_key" ON "student_guardians"("studentId", "guardianId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "BaseTariff_name_key" ON "BaseTariff"("name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_studentId_tariffId_periodMonth_periodYear_academicYearId_key" ON "Invoice"("studentId", "tariffId", "periodMonth", "periodYear", "academicYearId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Payment_paymentNumber_key" ON "Payment"("paymentNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_paymentId_key" ON "Receipt"("paymentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SavingsAccount_studentId_key" ON "SavingsAccount"("studentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SavingsAccount_accountNumber_key" ON "SavingsAccount"("accountNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SavingsTransaction_transactionNumber_key" ON "SavingsTransaction"("transactionNumber")`,
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "classes" ADD COLUMN "sppAmount" DECIMAL`);
  } catch {
    // Column already exists on databases created before this seed update.
  }
}

async function seedProductionBootstrap() {
  const email = env("SUPER_ADMIN_EMAIL");
  const password = env("SUPER_ADMIN_PASSWORD");
  const name = env("SUPER_ADMIN_NAME", "Super Admin");
  const phone = env("SUPER_ADMIN_PHONE");
  const schoolName = env("SCHOOL_NAME", "TK Islam Azkia");
  const foundationName = env("FOUNDATION_NAME", "Yayasan Azkia");
  const activeYearName = env("ACTIVE_YEAR_NAME", "2026/2027");
  const sppAmount = Number(env("SPP_AMOUNT", "150000").replace(/[^\d]/g, ""));

  if (!email || !password) {
    throw new Error(
      "Production seed membutuhkan SUPER_ADMIN_EMAIL dan SUPER_ADMIN_PASSWORD."
    );
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "SUPER_ADMIN",
      name,
      phone: phone || null,
      passwordHash: passwordHash(password),
      status: "ACTIVE",
    },
    create: {
      role: "SUPER_ADMIN",
      name,
      email,
      phone: phone || null,
      passwordHash: passwordHash(password),
      status: "ACTIVE",
    },
  });

  const setting = await prisma.schoolSetting.findFirst();

  if (!setting) {
    await prisma.schoolSetting.create({
      data: {
        foundationName,
        schoolName,
        address: env("SCHOOL_ADDRESS", "Alamat sekolah belum diisi"),
        email: env("SCHOOL_EMAIL", email),
        phone: env("SCHOOL_PHONE", phone || "-"),
        logoUrl: env("SCHOOL_LOGO_URL", "/logo-tk-azkia-transparent.png"),
        activeYearName,
        receiptCity: env("RECEIPT_CITY", "Bekasi"),
        treasurerName: env("TREASURER_NAME", "Bendahara"),
        receiptNotes: env("RECEIPT_NOTES", "Terima kasih atas pembayaran Bapak/Ibu."),
      },
    });
  }

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });

  if (!activeYear) {
    await prisma.academicYear.create({
      data: {
        name: activeYearName,
        startsAt: new Date("2026-07-01T00:00:00.000Z"),
        endsAt: new Date("2027-06-30T00:00:00.000Z"),
        isActive: true,
      },
    });
  }

  await prisma.baseTariff.upsert({
    where: { name: "SPP" },
    update: {
      amount: amount(sppAmount || 150000),
      isMandatory: true,
      isLocked: true,
      isActive: true,
    },
    create: {
      name: "SPP",
      amount: amount(sppAmount || 150000),
      description: "Tarif pokok wajib bulanan siswa.",
      isMandatory: true,
      isLocked: true,
      isActive: true,
    },
  });

  console.log("Production bootstrap selesai.");
  console.log(`Super Admin: ${email}`);
}

async function main() {
  if (isProductionSeed() && process.env.SEED_DEMO_DATA !== "true") {
    await seedProductionBootstrap();
    return;
  }

  if (isSqliteDatabase()) {
    await ensureSqliteSchema();
  }

  await prisma.auditLog.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.savingsTransaction.deleteMany();
  await prisma.savingsAccount.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.baseTariff.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.heroSlide.deleteMany();
  await prisma.schoolSetting.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        role: "SUPER_ADMIN",
        name: "Super Admin Azkia",
        email: "superadmin@tkislamazkia.sch.id",
        phone: "081200000001",
        passwordHash: passwordHash("demo12345"),
      },
    }),
    prisma.user.create({
      data: {
        role: "TATA_USAHA",
        name: "Tata Usaha Azkia",
        email: "tu@tkislamazkia.sch.id",
        phone: "081200000002",
        passwordHash: passwordHash("demo12345"),
      },
    }),
    prisma.user.create({
      data: {
        role: "BENDAHARA",
        name: "Bendahara Azkia",
        email: "bendahara@tkislamazkia.sch.id",
        phone: "081200000003",
        passwordHash: passwordHash("demo12345"),
      },
    }),
    prisma.user.create({
      data: {
        role: "ORANG_TUA",
        name: "Budi Santoso",
        email: "budi@example.com",
        phone: "081234567890",
        passwordHash: passwordHash("demo12345"),
      },
    }),
  ]);

  const [, tataUsaha, bendahara, parentUser] = users;

  const activeYear = await prisma.academicYear.create({
    data: {
      name: "2026/2027",
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: new Date("2027-06-30T00:00:00.000Z"),
      isActive: true,
    },
  });

  const classes = await Promise.all(
    [
      { name: "TK A Ceria", level: "TK A", sppAmount: 150000 },
      { name: "TK A Mandiri", level: "TK A", sppAmount: 150000 },
      { name: "TK B Ceria", level: "TK B", sppAmount: 150000 },
      { name: "TK B Mandiri", level: "TK B", sppAmount: 150000 },
      { name: "PAUD Bintang", level: "PAUD", sppAmount: 75000 },
    ].map((kelas) =>
      prisma.schoolClass.create({
        data: {
          academicYearId: activeYear.id,
          name: kelas.name,
          level: kelas.level,
          sppAmount: amount(kelas.sppAmount),
        },
      })
    )
  );

  const tariffs = await Promise.all([
    prisma.baseTariff.create({
      data: {
        name: "SPP",
        amount: amount(150000),
        description: "Tarif pokok wajib bulanan siswa.",
        isMandatory: true,
        isLocked: true,
      },
    }),
    prisma.baseTariff.create({
      data: { name: "Katering", amount: amount(180000), description: "Tarif makan/katering bulanan." },
    }),
    prisma.baseTariff.create({
      data: { name: "Seragam", amount: amount(200000), description: "Tarif perlengkapan seragam." },
    }),
    prisma.baseTariff.create({
      data: { name: "Kegiatan", amount: amount(150000), description: "Tarif kegiatan siswa." },
    }),
  ]);

  const [sppTariff, cateringTariff, uniformTariff, activityTariff] = tariffs;

  const guardian = await prisma.guardian.create({
    data: {
      userId: parentUser.id,
      name: "Budi Santoso",
      relation: "Ayah",
      phone: "081234567890",
      email: "budi@example.com",
      address: "Jl. Melati No. 8, Bekasi",
    },
  });

  const students = await Promise.all([
    prisma.student.create({
      data: {
        classId: classes[2].id,
        nis: "A123",
        fullName: "Ahmad Rizki",
        nickname: "Ahmad",
        gender: "MALE",
        birthDate: new Date("2021-05-12T00:00:00.000Z"),
        address: "Jl. Melati No. 8, Bekasi",
        guardians: { create: { guardianId: guardian.id, isPrimary: true } },
      },
    }),
    prisma.student.create({
      data: {
        classId: classes[0].id,
        nis: "A124",
        fullName: "Aisyah Putri",
        nickname: "Aisyah",
        gender: "FEMALE",
      },
    }),
    prisma.student.create({
      data: {
        classId: classes[1].id,
        nis: "A125",
        fullName: "Bima Arkan",
        nickname: "Bima",
        gender: "MALE",
      },
    }),
    prisma.student.create({
      data: {
        classId: classes[4].id,
        nis: "A126",
        fullName: "Naila Zahra",
        nickname: "Naila",
        gender: "FEMALE",
      },
    }),
  ]);

  await Promise.all(
    students.map((student, index) =>
      prisma.savingsAccount.create({
        data: {
          studentId: student.id,
          accountNumber: `AZK-2026-${String(index + 1).padStart(3, "0")}`,
          balance: amount(index === 0 ? 1250000 : 750000 + index * 250000),
        },
      })
    )
  );

  await prisma.schoolSetting.create({
    data: {
      foundationName: "Yayasan Pendidikan Islam Azkia",
      schoolName: "TK Islam Azkia",
      address: "Jl. Pendidikan No. 12, Bekasi",
      email: "tu@tkislamazkia.sch.id",
      phone: "0812-3456-7890",
      logoUrl: "/logo-tk-azkia-transparent.png",
      activeYearName: "2026/2027",
      receiptCity: "Bekasi",
      treasurerName: "Nama Admin",
      receiptNotes: "- Disimpan sebagai bukti pembayaran yang sah\n- Uang yang sudah dibayarkan tidak dapat diminta kembali",
    },
  });

  await prisma.bankAccount.create({
    data: {
      bankName: "Bank Syariah Indonesia",
      accountNumber: "7123 456 789",
      accountHolder: "Yayasan Pendidikan Islam Azkia",
      isActive: true,
    },
  });

  await prisma.heroSlide.createMany({
    data: [
      {
        imageUrl: "/landing-azkia-wisuda.jpg",
        alt: "Siswa TK Islam Azkia mengenakan pakaian wisuda",
        title: "Tumbuh percaya diri",
        caption: "Dokumentasi kegiatan dan pencapaian siswa TK Islam Azkia.",
        position: "object-[62%_center]",
        sortOrder: 1,
        isActive: true,
      },
      {
        imageUrl: "/landing-azkia-guru.jpg",
        alt: "Guru TK Islam Azkia berfoto bersama di area sekolah",
        title: "Guru yang mendampingi",
        caption: "Lingkungan sekolah yang hangat untuk anak dan orang tua.",
        position: "object-center",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  const invoiceData = [
    {
      studentId: students[0].id,
      tariffId: sppTariff.id,
      invoiceNumber: "INV-2026-07001",
      title: "SPP Juli 2026",
      periodMonth: 7,
      periodYear: 2026,
      amount: amount(250000),
      totalAmount: amount(250000),
      status: "BELUM_DIBAYAR",
      dueDate: new Date("2026-07-10T00:00:00.000Z"),
    },
    {
      studentId: students[1].id,
      tariffId: uniformTariff.id,
      invoiceNumber: "INV-2026-07002",
      title: "Seragam",
      amount: amount(350000),
      totalAmount: amount(350000),
      status: "LUNAS",
      paidAt: new Date("2026-07-04T03:20:00.000Z"),
    },
    {
      studentId: students[2].id,
      tariffId: sppTariff.id,
      invoiceNumber: "INV-2026-07003",
      title: "SPP Juni 2026",
      periodMonth: 6,
      periodYear: 2026,
      amount: amount(250000),
      totalAmount: amount(250000),
      status: "DITOLAK",
    },
    {
      studentId: students[3].id,
      tariffId: activityTariff.id,
      invoiceNumber: "INV-2026-07004",
      title: "Kegiatan",
      amount: amount(150000),
      totalAmount: amount(150000),
      status: "LUNAS",
      paidAt: new Date("2026-07-05T07:40:00.000Z"),
    },
    {
      studentId: students[0].id,
      tariffId: uniformTariff.id,
      invoiceNumber: "INV-2026-07005",
      title: "Seragam olahraga",
      amount: amount(200000),
      totalAmount: amount(200000),
      status: "BELUM_DIBAYAR",
    },
    {
      studentId: students[0].id,
      tariffId: cateringTariff.id,
      invoiceNumber: "INV-2026-07006",
      title: "Katering Juli 2026",
      periodMonth: 7,
      periodYear: 2026,
      amount: amount(180000),
      totalAmount: amount(180000),
      status: "MENUNGGU_VERIFIKASI",
    },
  ];

  for (const item of invoiceData) {
    await prisma.invoice.create({
      data: {
        ...item,
        academicYearId: activeYear.id,
        createdById: tataUsaha.id,
      },
    });
  }

  const paidInvoices = await prisma.invoice.findMany({
    where: { invoiceNumber: { in: ["INV-2026-07002", "INV-2026-07004"] } },
  });

  for (const invoice of paidInvoices) {
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        paymentNumber: invoice.invoiceNumber.replace("INV", "PAY"),
        amount: invoice.totalAmount,
        method: invoice.invoiceNumber === "INV-2026-07002" ? "TUNAI" : "TRANSFER",
        status: "TERVERIFIKASI",
        paidAt: invoice.paidAt ?? new Date("2026-07-04T03:20:00.000Z"),
        verifiedAt: invoice.paidAt ?? new Date("2026-07-04T03:20:00.000Z"),
        verifiedById: bendahara.id,
        createdById: tataUsaha.id,
      },
    });

    await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        receiptNumber: invoice.invoiceNumber,
        issuedById: bendahara.id,
      },
    });
  }

  console.log("Seed TK Islam Azkia selesai.");
  console.log("Demo login: superadmin@tkislamazkia.sch.id / demo12345");
  console.log("Role demo tersedia: SUPER_ADMIN, TATA_USAHA, BENDAHARA, ORANG_TUA");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
