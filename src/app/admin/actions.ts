"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { demoRoles, getCurrentUser, hashPassword, type DemoRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { allowDemoDefaults } from "@/lib/runtime-config";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key).replace(/[^\d]/g, "");
  return new Prisma.Decimal(value || 0);
}

async function requireRole(permission: string) {
  const user = await getCurrentUser();
  const role = user?.role as DemoRole | undefined;

  if (!user || !role || !demoRoles.includes(role) || !can(role, permission)) {
    throw new Error("Role pengguna tidak memiliki akses untuk aksi ini.");
  }

  return user;
}

async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Hanya Super Admin yang boleh menjalankan aksi ini.");
  }

  return user;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const count = await tx.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
  });

  return `INV-${year}-${String(count + 7001).padStart(5, "0")}`;
}

async function nextSavingsTransactionNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const count = await tx.savingsTransaction.count({
    where: { transactionNumber: { startsWith: `TAB-${year}-` } },
  });

  return `TAB-${year}-${String(count + 1).padStart(5, "0")}`;
}

function periodTitle(tariffName: string, periodMonth: number | null, periodYear: number | null) {
  if (!periodMonth || !periodYear) {
    return tariffName;
  }

  const period = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(periodYear, periodMonth - 1, 1)));

  return `${tariffName} ${period}`;
}

function academicYearPeriods(academicYear: { startsAt: Date }) {
  const periods: { month: number; year: number }[] = [];
  const start = new Date(
    Date.UTC(
      academicYear.startsAt.getUTCFullYear(),
      academicYear.startsAt.getUTCMonth(),
      1
    )
  );

  for (let index = 0; index < 12; index += 1) {
    const period = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1)
    );
    periods.push({
      month: period.getUTCMonth() + 1,
      year: period.getUTCFullYear(),
    });
  }

  return periods;
}

function effectiveTariffAmount(
  tariff: { name: string; amount: Prisma.Decimal },
  studentClass?: { sppAmount: Prisma.Decimal | null } | null
) {
  const classSppAmount = studentClass?.sppAmount;

  if (
    tariff.name.toUpperCase() === "SPP" &&
    classSppAmount &&
    classSppAmount.greaterThan(0)
  ) {
    return classSppAmount;
  }

  return tariff.amount;
}

export async function createStudentWithGuardian(formData: FormData) {
  await requireRole("student.manage");

  const nis = text(formData, "nis");
  const fullName = text(formData, "fullName");
  const classId = text(formData, "classId");
  const gender = text(formData, "gender");
  const guardianName = text(formData, "guardianName");
  const guardianRelation = text(formData, "guardianRelation") || "Wali";
  const guardianPhone = text(formData, "guardianPhone");
  const guardianEmail = text(formData, "guardianEmail");
  const requestedGuardianPassword = text(formData, "guardianPassword");
  const guardianPassword =
    requestedGuardianPassword || (allowDemoDefaults() ? "demo12345" : "");

  if (!nis || !fullName || !classId || !gender) {
    throw new Error("NIS, nama siswa, kelas, dan jenis kelamin wajib diisi.");
  }

  if (guardianName && (guardianEmail || guardianPhone) && !guardianPassword) {
    throw new Error("Password wali wajib diisi pada mode production.");
  }

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        nis,
        fullName,
        nickname: text(formData, "nickname") || null,
        classId,
        gender,
        birthDate: text(formData, "birthDate")
          ? new Date(`${text(formData, "birthDate")}T00:00:00.000Z`)
          : null,
        address: text(formData, "address") || null,
        status: "ACTIVE",
      },
    });

    await tx.savingsAccount.create({
      data: {
        studentId: student.id,
        accountNumber: `AZK-${new Date().getFullYear()}-${student.nis}`,
        balance: new Prisma.Decimal(0),
      },
    });

    if (guardianName && (guardianEmail || guardianPhone)) {
      const user = await tx.user.upsert({
        where: guardianEmail ? { email: guardianEmail } : { phone: guardianPhone },
        update: {
          name: guardianName,
          phone: guardianPhone || undefined,
          status: "ACTIVE",
        },
        create: {
          role: "ORANG_TUA",
          name: guardianName,
          email: guardianEmail || null,
          phone: guardianPhone || null,
          passwordHash: hashPassword(guardianPassword),
          status: "ACTIVE",
        },
      });
      const guardian = await tx.guardian.create({
        data: {
          userId: user.id,
          name: guardianName,
          relation: guardianRelation,
          phone: guardianPhone || null,
          email: guardianEmail || null,
          address: text(formData, "guardianAddress") || text(formData, "address") || null,
        },
      });

      await tx.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          isPrimary: true,
        },
      });
    }
  });

  revalidatePath("/admin/siswa");

  return {
    ok: true,
    message: `${fullName} berhasil ditambahkan.`,
  };
}

export async function updateStudent(formData: FormData) {
  await requireRole("student.manage");

  const id = text(formData, "id");
  const fullName = text(formData, "fullName");
  const classId = text(formData, "classId");
  const status = text(formData, "status");

  if (!id || !fullName || !classId || !status) {
    throw new Error("Data siswa belum lengkap.");
  }

  await prisma.student.update({
    where: { id },
    data: {
      fullName,
      nickname: text(formData, "nickname") || null,
      classId,
      gender: text(formData, "gender"),
      status,
      address: text(formData, "address") || null,
    },
  });

  revalidatePath("/admin/siswa");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `${fullName} berhasil diperbarui.`,
  };
}

export async function addGuardianAccountToStudent(formData: FormData) {
  await requireRole("student.manage");

  const studentId = text(formData, "studentId");
  const guardianName = text(formData, "guardianName");
  const guardianRelation = text(formData, "guardianRelation") || "Wali";
  const guardianEmail = text(formData, "guardianEmail");
  const guardianPhone = text(formData, "guardianPhone");
  const requestedGuardianPassword = text(formData, "guardianPassword");
  const guardianPassword =
    requestedGuardianPassword || (allowDemoDefaults() ? "demo12345" : "");

  if (!studentId || !guardianName || (!guardianEmail && !guardianPhone)) {
    throw new Error("Siswa, nama wali, dan email/WhatsApp wali wajib diisi.");
  }

  if (!guardianPassword) {
    throw new Error("Password wali wajib diisi pada mode production.");
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: guardianEmail ? { email: guardianEmail } : { phone: guardianPhone },
      update: {
        name: guardianName,
        phone: guardianPhone || undefined,
        status: "ACTIVE",
      },
      create: {
        role: "ORANG_TUA",
        name: guardianName,
        email: guardianEmail || null,
        phone: guardianPhone || null,
        passwordHash: hashPassword(guardianPassword),
        status: "ACTIVE",
      },
    });
    const guardian = await tx.guardian.create({
      data: {
        userId: user.id,
        name: guardianName,
        relation: guardianRelation,
        phone: guardianPhone || null,
        email: guardianEmail || null,
      },
    });

    await tx.studentGuardian.create({
      data: {
        studentId,
        guardianId: guardian.id,
        isPrimary: false,
      },
    });
  });

  revalidatePath("/admin/siswa");

  return {
    ok: true,
    message: `Akun wali ${guardianName} berhasil disinkronkan.`,
  };
}

export async function deactivateStudent(formData: FormData) {
  await requireRole("student.manage");

  const id = text(formData, "id");

  if (!id) {
    throw new Error("Siswa tidak ditemukan.");
  }

  await prisma.student.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  revalidatePath("/admin/siswa");
}

export async function deleteStudent(formData: FormData) {
  const user = await requireRole("student.manage");
  const id = text(formData, "id");
  let deletedStudentName = "";

  if (!id) {
    throw new Error("Siswa tidak ditemukan.");
  }

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id },
      include: {
        guardians: { include: { guardian: true } },
        savingsAccount: true,
      },
    });

    if (!student) {
      throw new Error("Siswa tidak ditemukan.");
    }

    deletedStudentName = student.fullName;

    const invoiceIds = (
      await tx.invoice.findMany({
        where: { studentId: id },
        select: { id: true },
      })
    ).map((invoice) => invoice.id);
    const paymentIds =
      invoiceIds.length > 0
        ? (
            await tx.payment.findMany({
              where: { invoiceId: { in: invoiceIds } },
              select: { id: true },
            })
          ).map((payment) => payment.id)
        : [];

    if (paymentIds.length > 0) {
      await tx.paymentProof.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await tx.receipt.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }

    if (invoiceIds.length > 0) {
      await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }

    if (student.savingsAccount) {
      await tx.savingsTransaction.deleteMany({
        where: { accountId: student.savingsAccount.id },
      });
      await tx.savingsAccount.delete({ where: { id: student.savingsAccount.id } });
    }

    const guardianIds = student.guardians.map((item) => item.guardianId);
    const guardianUserIds = student.guardians
      .map((item) => item.guardian.userId)
      .filter((value): value is string => Boolean(value));

    await tx.studentGuardian.deleteMany({ where: { studentId: id } });
    await tx.student.delete({ where: { id } });

    for (const guardianId of guardianIds) {
      const relationCount = await tx.studentGuardian.count({ where: { guardianId } });

      if (relationCount === 0) {
        await tx.guardian.delete({ where: { id: guardianId } });
      }
    }

    for (const userId of guardianUserIds) {
      const guardianCount = await tx.guardian.count({ where: { userId } });

      if (guardianCount === 0) {
        await tx.user.update({ where: { id: userId }, data: { status: "INACTIVE" } });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "STUDENT_DELETED",
        entity: "students",
        entityId: id,
        before: {
          nis: student.nis,
          fullName: student.fullName,
        },
      },
    });
  });

  revalidatePath("/admin/siswa");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/tagihan");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `${deletedStudentName || "Siswa"} berhasil dihapus dari database.`,
  };
}

export async function createClass(formData: FormData) {
  await requireRole("class.manage");

  const requestedAcademicYearId = text(formData, "academicYearId");
  const name = text(formData, "name");
  const level = text(formData, "level");
  const teacherId = text(formData, "teacherId");
  const sppAmount = numberValue(formData, "sppAmount");

  if (!name) {
    throw new Error("Nama kelas wajib diisi.");
  }

  const activeYear = requestedAcademicYearId
    ? null
    : await prisma.academicYear.findFirst({ where: { isActive: true } });
  const academicYearId = requestedAcademicYearId || activeYear?.id;

  if (!academicYearId) {
    throw new Error("Tahun ajaran aktif belum tersedia.");
  }

  await prisma.schoolClass.create({
    data: {
      academicYearId,
      name,
      level: level || null,
      sppAmount: sppAmount.greaterThan(0) ? sppAmount : null,
      teacherId: teacherId || null,
    },
  });

  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/tagihan");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `Kelas ${name} berhasil ditambahkan.`,
  };
}

export async function updateClass(formData: FormData) {
  await requireRole("class.manage");

  const id = text(formData, "id");
  const academicYearId = text(formData, "academicYearId");
  const name = text(formData, "name");
  const level = text(formData, "level");
  const teacherId = text(formData, "teacherId");
  const sppAmount = numberValue(formData, "sppAmount");

  if (!id || !name) {
    throw new Error("Kelas dan nama kelas wajib diisi.");
  }

  await prisma.schoolClass.update({
    where: { id },
    data: {
      ...(academicYearId ? { academicYearId } : {}),
      name,
      level: level || null,
      sppAmount: sppAmount.greaterThan(0) ? sppAmount : null,
      ...(teacherId ? { teacherId } : {}),
    },
  });

  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/tagihan");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `Kelas ${name} berhasil diperbarui.`,
  };
}

export async function deleteClass(formData: FormData) {
  await requireRole("class.manage");

  const id = text(formData, "id");

  if (!id) {
    throw new Error("Kelas tidak ditemukan.");
  }

  const studentCount = await prisma.student.count({ where: { classId: id } });

  if (studentCount > 0) {
    throw new Error("Kelas yang masih memiliki siswa tidak bisa dihapus.");
  }

  await prisma.schoolClass.delete({ where: { id } });

  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/tagihan");
}

export async function deleteClasses(formData: FormData) {
  await requireRole("class.manage");

  const ids = formData.getAll("ids").map((id) => String(id));

  if (ids.length === 0) {
    throw new Error("Pilih kelas yang ingin dihapus.");
  }

  const classes = await prisma.schoolClass.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { students: true } } },
  });
  const deletableIds = classes
    .filter((kelas) => kelas._count.students === 0)
    .map((kelas) => kelas.id);
  const skipped = classes.length - deletableIds.length;

  if (deletableIds.length > 0) {
    await prisma.schoolClass.deleteMany({ where: { id: { in: deletableIds } } });
  }

  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/tagihan");

  return {
    ok: deletableIds.length > 0,
    deleted: deletableIds.length,
    skipped,
    message:
      skipped > 0
        ? `${deletableIds.length} kelas dihapus. ${skipped} kelas dilewati karena masih memiliki siswa.`
        : `${deletableIds.length} kelas berhasil dihapus.`,
  };
}

export async function createIndividualInvoice(formData: FormData) {
  const user = await requireRole("invoice.create");
  const studentId = text(formData, "studentId");
  const tariffId = text(formData, "tariffId");
  const manualTitle = text(formData, "title");
  const manualAmount = numberValue(formData, "amount");
  const periodMonthRaw = text(formData, "periodMonth");
  const periodYearRaw = text(formData, "periodYear");
  let createdInvoiceNumber = "";
  let createdTitle = "";

  if (!studentId || !tariffId) {
    throw new Error("Siswa dan tagihan wajib diisi.");
  }

  await prisma.$transaction(async (tx) => {
    const [activeYear, tariff, student] = await Promise.all([
      tx.academicYear.findFirst({ where: { isActive: true } }),
      tx.baseTariff.findUnique({ where: { id: tariffId } }),
      tx.student.findUnique({
        where: { id: studentId },
        include: { class: true },
      }),
    ]);

    if (!activeYear) {
      throw new Error("Tahun ajaran aktif belum tersedia.");
    }
    if (!tariff || !tariff.isActive) {
      throw new Error("Tarif pokok tidak ditemukan atau tidak aktif.");
    }
    if (!student) {
      throw new Error("Siswa tidak ditemukan.");
    }

    const periodMonth = periodMonthRaw ? Number(periodMonthRaw) : null;
    const periodYear = periodYearRaw ? Number(periodYearRaw) : new Date().getFullYear();
    const invoiceNumber = await nextInvoiceNumber(tx);
    const amount = manualAmount.greaterThan(0)
      ? manualAmount
      : effectiveTariffAmount(tariff, student.class);
    const title = manualTitle || periodTitle(tariff.name, periodMonth, periodYear);

    const invoice = await tx.invoice.create({
      data: {
        studentId,
        tariffId,
        academicYearId: activeYear.id,
        invoiceNumber,
        title,
        periodMonth,
        periodYear,
        amount,
        discountAmount: new Prisma.Decimal(0),
        fineAmount: new Prisma.Decimal(0),
        totalAmount: amount,
        dueDate: text(formData, "dueDate")
          ? new Date(`${text(formData, "dueDate")}T00:00:00.000Z`)
          : null,
        status: "BELUM_DIBAYAR",
        notes: text(formData, "notes") || null,
        createdById: user.id,
      },
    });
    createdInvoiceNumber = invoice.invoiceNumber;
    createdTitle = invoice.title;
  });

  revalidatePath("/admin/tagihan");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `${createdTitle} berhasil dibuat dengan No Invoice ${createdInvoiceNumber}.`,
  };
}

export async function createBulkInvoices(formData: FormData) {
  const user = await requireRole("invoice.create");
  const scope = text(formData, "scope");
  const classId = text(formData, "classId");
  const tariffId = text(formData, "tariffId");
  const manualTitle = text(formData, "title");
  const manualAmount = numberValue(formData, "amount");
  const periodMonthRaw = text(formData, "periodMonth");
  const periodYearRaw = text(formData, "periodYear");
  let createdCount = 0;
  let skippedCount = 0;
  let createdTitle = "";

  if (!tariffId) {
    throw new Error("Tagihan wajib diisi.");
  }

  if (scope === "CLASS" && !classId) {
    throw new Error("Pilih kelas untuk tagihan massal per kelas.");
  }

  await prisma.$transaction(async (tx) => {
    const [activeYear, tariff] = await Promise.all([
      tx.academicYear.findFirst({ where: { isActive: true } }),
      tx.baseTariff.findUnique({ where: { id: tariffId } }),
    ]);

    if (!activeYear) {
      throw new Error("Tahun ajaran aktif belum tersedia.");
    }
    if (!tariff || !tariff.isActive) {
      throw new Error("Tarif pokok tidak ditemukan atau tidak aktif.");
    }

    const students = await tx.student.findMany({
      where: {
        status: "ACTIVE",
        ...(classId && classId !== "ALL" ? { classId } : {}),
      },
      include: { class: true },
    });
    const periodMonth = periodMonthRaw ? Number(periodMonthRaw) : null;
    const periodYear = periodYearRaw ? Number(periodYearRaw) : new Date().getFullYear();
    const title = manualTitle || periodTitle(tariff.name, periodMonth, periodYear);

    for (const student of students) {
      const amount = manualAmount.greaterThan(0)
        ? manualAmount
        : effectiveTariffAmount(tariff, student.class);

      const existing = await tx.invoice.findFirst({
        where: {
          studentId: student.id,
          tariffId,
          periodMonth,
          periodYear,
          academicYearId: activeYear.id,
        },
      });

      if (existing) {
        skippedCount += 1;
        continue;
      }

      await tx.invoice.create({
        data: {
          studentId: student.id,
          tariffId,
          academicYearId: activeYear.id,
          invoiceNumber: await nextInvoiceNumber(tx),
          title,
          periodMonth,
          periodYear,
          amount,
          discountAmount: new Prisma.Decimal(0),
          fineAmount: new Prisma.Decimal(0),
          totalAmount: amount,
          dueDate: text(formData, "dueDate")
            ? new Date(`${text(formData, "dueDate")}T00:00:00.000Z`)
            : null,
          status: "BELUM_DIBAYAR",
          notes: text(formData, "notes") || null,
          createdById: user.id,
        },
      });
      createdCount += 1;
    }
    createdTitle = title;

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "BULK_INVOICES_CREATED",
        entity: "invoices",
          entityId: tariffId,
        after: {
          scope,
          classId: classId || null,
          count: students.length,
          amount: manualAmount.greaterThan(0) ? manualAmount.toNumber() : null,
          amountSource:
            tariff.name.toUpperCase() === "SPP" && !manualAmount.greaterThan(0)
              ? "CLASS_SPP_OR_DEFAULT"
              : "TARIFF_OR_MANUAL",
          periodMonth,
          periodYear,
        },
      },
    });
  });

  revalidatePath("/admin/tagihan");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message:
      skippedCount > 0
        ? `${createdCount} tagihan ${createdTitle} dibuat. ${skippedCount} data dilewati karena sudah ada.`
        : `${createdCount} tagihan ${createdTitle} berhasil dibuat.`,
  };
}

export async function updateInvoice(formData: FormData) {
  await requireRole("invoice.create");

  const id = text(formData, "id");
  const title = text(formData, "title");
  const amount = numberValue(formData, "amount");

  if (!id || !title || amount.lessThanOrEqualTo(0)) {
    throw new Error("Invoice, judul, dan nominal wajib diisi.");
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice || invoice.status === "LUNAS" || invoice.status === "DIBATALKAN") {
    throw new Error("Tagihan lunas atau dibatalkan tidak dapat diedit.");
  }

  await prisma.invoice.update({
    where: { id },
    data: {
      title,
      amount,
      totalAmount: amount.plus(invoice.fineAmount).minus(invoice.discountAmount),
      dueDate: text(formData, "dueDate")
        ? new Date(`${text(formData, "dueDate")}T00:00:00.000Z`)
        : null,
      notes: text(formData, "notes") || null,
    },
  });

  revalidatePath("/admin/tagihan");
  revalidatePath("/dashboard");
}

export async function cancelInvoice(formData: FormData) {
  await requireRole("invoice.create");

  const id = text(formData, "id");

  if (!id) {
    throw new Error("Invoice tidak ditemukan.");
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice || invoice.status === "LUNAS") {
    throw new Error("Tagihan lunas tidak dapat dibatalkan.");
  }

  await prisma.invoice.update({
    where: { id },
    data: {
      status: "DIBATALKAN",
      notes: text(formData, "notes") || invoice.notes,
    },
  });

  revalidatePath("/admin/tagihan");
  revalidatePath("/dashboard");
}

export async function deleteInvoiceAsSuperAdmin(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Invoice tidak ditemukan.");
  }

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id },
      include: {
        student: true,
        tariff: true,
        payments: {
          include: {
            proofs: true,
            receipt: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan.");
    }

    const paymentIds = invoice.payments.map((payment) => payment.id);

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "INVOICE_PERMANENTLY_DELETED_BY_SUPER_ADMIN",
        entity: "invoices",
        entityId: invoice.id,
        before: {
          invoiceNumber: invoice.invoiceNumber,
          studentId: invoice.studentId,
          studentName: invoice.student.fullName,
          tariffName: invoice.tariff.name,
          title: invoice.title,
          status: invoice.status,
          amount: invoice.amount.toNumber(),
          totalAmount: invoice.totalAmount.toNumber(),
          paymentCount: invoice.payments.length,
          proofCount: invoice.payments.reduce(
            (count, payment) => count + payment.proofs.length,
            0
          ),
        },
      },
    });

    if (paymentIds.length > 0) {
      await tx.paymentProof.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await tx.receipt.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }

    await tx.invoice.delete({ where: { id: invoice.id } });
  });

  revalidatePath("/admin/tagihan");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/tagihan");
  revalidatePath("/riwayat");

  return {
    ok: true,
    message: "Tagihan berhasil dihapus permanen dari database.",
  };
}

export async function updateUserAccount(formData: FormData) {
  await requireRole("account.manage");

  const id = text(formData, "id");
  const status = text(formData, "status");
  const role = text(formData, "role");
  const password = text(formData, "password");

  if (!id || !status || !role) {
    throw new Error("Akun, role, dan status wajib diisi.");
  }

  await prisma.user.update({
    where: { id },
    data: {
      role,
      status,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });

  revalidatePath("/admin/akun");
  revalidatePath("/admin/siswa");
}

export async function resetUserPassword(formData: FormData) {
  const actor = await requireRole("account.manage");
  const id = text(formData, "id");
  const requestedPassword = text(formData, "password");
  const password = requestedPassword || (allowDemoDefaults() ? "demo12345" : "");

  if (!id) {
    throw new Error("Akun tidak ditemukan.");
  }

  if (!password) {
    throw new Error("Reset ke password demo dimatikan pada mode production.");
  }

  const target = await prisma.user.update({
    where: { id },
    data: { passwordHash: hashPassword(password) },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: "ACCOUNT_PASSWORD_RESET",
      entity: "users",
      entityId: target.id,
      after: {
        targetName: target.name,
        targetEmail: target.email,
        targetPhone: target.phone,
        targetRole: target.role,
        resetToDefault: password === "demo12345",
      },
    },
  });

  revalidatePath("/admin/akun");
  revalidatePath("/admin/audit-log");

  return {
    ok: true,
    message: `Password ${target.name} direset ke ${password}.`,
  };
}

export async function createUserAccount(formData: FormData) {
  await requireRole("account.manage");

  const name = text(formData, "name");
  const email = text(formData, "email");
  const phone = text(formData, "phone");
  const role = text(formData, "role");
  const password = text(formData, "password") || (allowDemoDefaults() ? "demo12345" : "");

  if (!name || !role || (!email && !phone)) {
    throw new Error("Nama, role, dan minimal email/WhatsApp wajib diisi.");
  }

  if (!password) {
    throw new Error("Password wajib diisi pada mode production.");
  }

  await prisma.user.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      role,
      passwordHash: hashPassword(password),
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin/akun");

  return {
    ok: true,
    message: `Akun ${name} berhasil dibuat.`,
  };
}

export async function approvePayment(formData: FormData) {
  const user = await requireRole("payment.verify");
  const paymentId = text(formData, "paymentId");

  if (!paymentId) {
    throw new Error("Pembayaran tidak ditemukan.");
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new Error("Pembayaran tidak ditemukan.");
    }

    if (payment.status !== "MENUNGGU_VERIFIKASI") {
      throw new Error("Pembayaran ini sudah diproses.");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "TERVERIFIKASI",
        verifiedAt: new Date(),
        verifiedById: user.id,
        rejectionReason: null,
      },
    });

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: "LUNAS",
        paidAt: payment.paidAt,
      },
    });

    await tx.receipt.upsert({
      where: { paymentId: payment.id },
      update: {
        issuedAt: new Date(),
        issuedById: user.id,
      },
      create: {
        paymentId: payment.id,
        receiptNumber: payment.invoice.invoiceNumber,
        issuedById: user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_APPROVED",
        entity: "payments",
        entityId: payment.id,
        after: {
          invoiceNumber: payment.invoice.invoiceNumber,
          amount: payment.amount.toNumber(),
        },
      },
    });
  });

  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/riwayat");
}

export async function rejectPayment(formData: FormData) {
  const user = await requireRole("payment.verify");
  const paymentId = text(formData, "paymentId");
  const rejectionReason = text(formData, "rejectionReason");

  if (!paymentId || !rejectionReason) {
    throw new Error("Pembayaran dan alasan penolakan wajib diisi.");
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new Error("Pembayaran tidak ditemukan.");
    }

    if (payment.status !== "MENUNGGU_VERIFIKASI") {
      throw new Error("Pembayaran ini sudah diproses.");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "DITOLAK",
        verifiedAt: new Date(),
        verifiedById: user.id,
        rejectionReason,
      },
    });

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: "DITOLAK" },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_REJECTED",
        entity: "payments",
        entityId: payment.id,
        after: {
          invoiceNumber: payment.invoice.invoiceNumber,
          rejectionReason,
        },
      },
    });
  });

  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/dashboard");
  revalidatePath("/tagihan");
  revalidatePath("/riwayat");
}

export async function deletePaymentAsSuperAdmin(formData: FormData) {
  const user = await requireSuperAdmin();
  const paymentId = text(formData, "paymentId");

  if (!paymentId) {
    throw new Error("Payment tidak valid.");
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
        receipt: true,
        proofs: true,
      },
    });

    if (!payment) {
      throw new Error("Payment tidak ditemukan.");
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_DELETED_BY_SUPER_ADMIN",
        entity: "payments",
        entityId: payment.id,
        before: {
          paymentNumber: payment.paymentNumber,
          invoiceNumber: payment.invoice.invoiceNumber,
          invoiceId: payment.invoiceId,
          amount: payment.amount.toNumber(),
          method: payment.method,
          status: payment.status,
          proofCount: payment.proofs.length,
          receiptNumber: payment.receipt?.receiptNumber ?? null,
        },
      },
    });

    await tx.paymentProof.deleteMany({ where: { paymentId } });
    await tx.receipt.deleteMany({ where: { paymentId } });
    await tx.payment.delete({ where: { id: paymentId } });

    const remainingPayments = await tx.payment.findMany({
      where: { invoiceId: payment.invoiceId },
      select: { status: true, paidAt: true },
      orderBy: { createdAt: "desc" },
    });
    const verifiedPayment = remainingPayments.find(
      (item) => item.status === "TERVERIFIKASI"
    );
    const hasWaiting = remainingPayments.some(
      (item) => item.status === "MENUNGGU_VERIFIKASI"
    );

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: verifiedPayment
          ? "LUNAS"
          : hasWaiting
            ? "MENUNGGU_VERIFIKASI"
            : "BELUM_DIBAYAR",
        paidAt: verifiedPayment?.paidAt ?? null,
      },
    });
  });

  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin/tagihan");
  revalidatePath("/dashboard");
  revalidatePath("/tagihan");
  revalidatePath("/riwayat");

  return {
    ok: true,
    message: "Pembayaran berhasil dihapus oleh Super Admin.",
  };
}

export async function createSavingsTransaction(formData: FormData) {
  const user = await requireRole("saving.transaction");
  const studentId = text(formData, "studentId");
  const type = text(formData, "type");
  const amount = numberValue(formData, "amount");
  const notes = text(formData, "notes");

  const validTypes = ["SETORAN", "PENARIKAN", "KOREKSI_MASUK", "KOREKSI_KELUAR"];

  if (!studentId || !validTypes.includes(type) || amount.lessThanOrEqualTo(0)) {
    throw new Error("Siswa, jenis transaksi, dan nominal wajib diisi.");
  }

  if (["PENARIKAN", "KOREKSI_MASUK", "KOREKSI_KELUAR"].includes(type) && !notes) {
    throw new Error("Catatan wajib diisi untuk penarikan dan koreksi.");
  }

  await prisma.$transaction(async (tx) => {
    const account = await tx.savingsAccount.findUnique({
      where: { studentId },
    });

    if (!account || account.status !== "ACTIVE") {
      throw new Error("Akun tabungan siswa tidak aktif atau belum tersedia.");
    }

    const isOut = type === "PENARIKAN" || type === "KOREKSI_KELUAR";
    const balanceBefore = account.balance;
    const balanceAfter = isOut ? balanceBefore.minus(amount) : balanceBefore.plus(amount);

    if (balanceAfter.lessThan(0)) {
      throw new Error("Saldo tabungan tidak boleh negatif.");
    }

    const transaction = await tx.savingsTransaction.create({
      data: {
        accountId: account.id,
        transactionNumber: await nextSavingsTransactionNumber(tx),
        type,
        amount,
        balanceBefore,
        balanceAfter,
        notes: notes || null,
        createdById: user.id,
      },
    });

    await tx.savingsAccount.update({
      where: { id: account.id },
      data: { balance: balanceAfter },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "SAVINGS_TRANSACTION_CREATED",
        entity: "savings_transactions",
        entityId: transaction.id,
        after: {
          transactionNumber: transaction.transactionNumber,
          type,
          amount: amount.toNumber(),
          balanceAfter: balanceAfter.toNumber(),
        },
      },
    });
  });

  revalidatePath("/admin/tabungan");
  revalidatePath("/dashboard");
  revalidatePath("/tabungan");
}

export async function updateSchoolIdentity(formData: FormData) {
  await requireRole("settings.update");

  const existing = await prisma.schoolSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const data = {
    foundationName: text(formData, "foundationName"),
    schoolName: text(formData, "schoolName"),
    address: text(formData, "address"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    logoUrl: text(formData, "logoUrl") || "/logo-tk-azkia-transparent.png",
    activeYearName: text(formData, "activeYearName"),
    receiptCity: text(formData, "receiptCity"),
    treasurerName: text(formData, "treasurerName"),
    receiptNotes: text(formData, "receiptNotes"),
  };

  if (existing) {
    await prisma.schoolSetting.update({ where: { id: existing.id }, data });
  } else {
    await prisma.schoolSetting.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin/pengaturan/identitas-sekolah");

  return {
    ok: true,
    message: "Identitas sekolah berhasil disimpan.",
  };
}

export async function saveBankAccount(formData: FormData) {
  await requireRole("settings.update");

  const bankName = text(formData, "bankName");
  const accountNumber = text(formData, "accountNumber");
  const accountHolder = text(formData, "accountHolder");

  if (!bankName || !accountNumber || !accountHolder) {
    throw new Error("Nama bank, nomor rekening, dan atas nama wajib diisi.");
  }

  const existing = await prisma.bankAccount.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const data = { bankName, accountNumber, accountHolder, isActive: true };

  if (existing) {
    await prisma.bankAccount.update({ where: { id: existing.id }, data });
  } else {
    await prisma.bankAccount.create({ data });
  }

  revalidatePath("/admin/pengaturan/identitas-sekolah");

  return { ok: true, message: "Rekening bank berhasil disimpan." };
}

export async function updateSppTariff(formData: FormData) {
  await requireRole("tariff.manage");
  const amount = numberValue(formData, "amount");

  if (amount.lessThanOrEqualTo(0)) {
    throw new Error("Nominal SPP wajib lebih dari 0.");
  }

  await prisma.baseTariff.upsert({
    where: { name: "SPP" },
    update: {
      amount,
      isMandatory: true,
      isLocked: true,
      isActive: true,
    },
    create: {
      name: "SPP",
      amount,
      isMandatory: true,
      isLocked: true,
      isActive: true,
      description: "Tarif pokok wajib bulanan siswa.",
    },
  });

  revalidatePath("/admin/pengaturan/tarif-pokok");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: "Nominal SPP berhasil disimpan.",
  };
}

export async function addBaseTariff(formData: FormData) {
  await requireRole("tariff.manage");

  const name = text(formData, "name");
  const amount = numberValue(formData, "amount");

  if (!name || amount.lessThanOrEqualTo(0)) {
    throw new Error("Nama tarif dan nominal wajib diisi.");
  }

  if (name.toUpperCase() === "SPP") {
    throw new Error("SPP sudah tersedia sebagai tarif wajib yang terkunci.");
  }

  const existing = await prisma.baseTariff.findUnique({ where: { name } });

  if (existing) {
    if (existing.isLocked) {
      throw new Error("Tarif terkunci tidak dapat diubah dari form tambah.");
    }

    await prisma.baseTariff.update({
      where: { id: existing.id },
      data: {
        amount,
        description: text(formData, "description") || existing.description,
        isActive: true,
      },
    });
  } else {
    await prisma.baseTariff.create({
      data: {
      name,
      amount,
      description: text(formData, "description") || null,
      isMandatory: false,
      isLocked: false,
      isActive: true,
      },
    });
  }

  revalidatePath("/admin/pengaturan/tarif-pokok");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `Tarif ${name} berhasil disimpan.`,
  };
}

export async function updateBaseTariff(formData: FormData) {
  await requireRole("tariff.manage");

  const id = text(formData, "id");
  const name = text(formData, "name");
  const amount = numberValue(formData, "amount");

  if (!id || !name || amount.lessThanOrEqualTo(0)) {
    throw new Error("Tarif, nama, dan nominal wajib diisi.");
  }

  const tariff = await prisma.baseTariff.findUnique({ where: { id } });

  if (!tariff) {
    throw new Error("Tarif tidak ditemukan.");
  }

  if (tariff.isLocked || tariff.name.toUpperCase() === "SPP") {
    throw new Error("SPP wajib hanya bisa diubah dari form nominal SPP.");
  }

  await prisma.baseTariff.update({
    where: { id },
    data: {
      name,
      amount,
      description: text(formData, "description") || null,
      isActive: true,
    },
  });

  revalidatePath("/admin/pengaturan/tarif-pokok");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `Tarif ${name} berhasil diperbarui.`,
  };
}

export async function deleteBaseTariff(formData: FormData) {
  await requireRole("tariff.manage");

  const id = text(formData, "id");
  const tariff = await prisma.baseTariff.findUnique({ where: { id } });

  if (!tariff || tariff.isLocked || tariff.name.toUpperCase() === "SPP") {
    throw new Error("Tarif SPP wajib tidak dapat dihapus.");
  }

  await prisma.baseTariff.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/admin/pengaturan/tarif-pokok");
  revalidatePath("/admin/transaksi");

  return {
    ok: true,
    message: `Tarif ${tariff.name} berhasil dihapus.`,
  };
}

export async function updateHeroSlide(formData: FormData) {
  await requireRole("hero.manage");

  const id = text(formData, "id");
  const isActive = formData.get("isActive") === "on";

  if (isActive) {
    const activeCount = await prisma.heroSlide.count({
      where: { isActive: true, NOT: { id } },
    });

    if (activeCount >= 5) {
      throw new Error("Maksimal 5 foto hero aktif.");
    }
  }

  await prisma.heroSlide.update({
    where: { id },
    data: {
      title: text(formData, "title"),
      caption: text(formData, "caption"),
      alt: text(formData, "alt") || text(formData, "title"),
      isActive,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/pengaturan/hero");
}

export async function addHeroSlide(formData: FormData) {
  await requireRole("hero.manage");

  const activeCount = await prisma.heroSlide.count({ where: { isActive: true } });

  if (activeCount >= 5) {
    throw new Error("Maksimal 5 foto hero aktif.");
  }

  const imageUrl = text(formData, "imageUrl");
  const title = text(formData, "title");

  if (!imageUrl || !title) {
    throw new Error("URL gambar dan judul slide wajib diisi.");
  }

  const maxOrder = await prisma.heroSlide.aggregate({
    _max: { sortOrder: true },
  });

  await prisma.heroSlide.create({
    data: {
      imageUrl,
      title,
      alt: text(formData, "alt") || title,
      caption: text(formData, "caption"),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      isActive: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/pengaturan/hero");
}

export async function createCashTransaction(formData: FormData) {
  const user = await requireRole("payment.cash.create");
  const studentId = text(formData, "studentId");
  const paidDate = text(formData, "paidDate");
  const cashReceivedAmount = numberValue(formData, "cashReceivedAmount");

  if (!studentId || !paidDate) {
    throw new Error("Siswa dan tanggal bayar wajib diisi.");
  }

  const paidAt = new Date(`${paidDate}T08:00:00.000Z`);
  const createdInvoiceNumbers: string[] = [];
  let cashInvoiceNumber = "";
  let totalPaid = new Prisma.Decimal(0);

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id: studentId },
      include: { class: { include: { academicYear: true } } },
    });

    if (!student) {
      throw new Error("Siswa tidak ditemukan.");
    }
    const currentStudent = student;

    const activeYear =
      currentStudent.class.academicYear ??
      (await tx.academicYear.findFirst({ where: { isActive: true } }));

    if (!activeYear) {
      throw new Error("Tahun ajaran aktif belum tersedia.");
    }

    const tariffs = await tx.baseTariff.findMany({
      where: { isActive: true },
      orderBy: [{ isLocked: "desc" }, { name: "asc" }],
    });

    let paymentIndex = 1;

    async function recordCashPayment(invoice: { id: string; invoiceNumber: string }, amount: Prisma.Decimal) {
      if (!cashInvoiceNumber) {
        cashInvoiceNumber = invoice.invoiceNumber;
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          paymentNumber: `${cashInvoiceNumber.replace("INV", "PAY")}-${String(paymentIndex).padStart(2, "0")}`,
          amount,
          method: "TUNAI",
          status: "TERVERIFIKASI",
          paidAt,
          verifiedAt: paidAt,
          verifiedById: user.id,
          createdById: user.id,
        },
      });
      paymentIndex += 1;
      createdInvoiceNumbers.push(invoice.invoiceNumber);
      totalPaid = totalPaid.plus(amount);

      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNumber: `${cashInvoiceNumber}-${String(paymentIndex - 1).padStart(2, "0")}`,
          issuedAt: paidAt,
          issuedById: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CASH_PAYMENT_CREATED",
          entity: "invoices",
          entityId: invoice.id,
          after: {
            cashInvoiceNumber,
            invoiceNumber: invoice.invoiceNumber,
            studentId: currentStudent.id,
            amount: amount.toNumber(),
            cashReceivedAmount: cashReceivedAmount.toNumber(),
            changeAmount: cashReceivedAmount.greaterThan(0)
              ? cashReceivedAmount.minus(totalPaid).toNumber()
              : 0,
            method: "TUNAI",
          },
        },
      });
    }

    for (const tariff of tariffs) {
      const value = numberValue(formData, `amount-${tariff.id}`);

      if (value.lessThanOrEqualTo(0)) {
        continue;
      }

      const isSpp = tariff.name.toUpperCase() === "SPP";
      if (isSpp) {
        const monthlySppAmount = effectiveTariffAmount(tariff, currentStudent.class);
        const periods = academicYearPeriods(activeYear);
        const paidMonth = paidAt.getUTCMonth() + 1;
        const paidMonthIndex = periods.findIndex((period) => period.month === paidMonth);
        const orderedPeriods =
          paidMonthIndex >= 0
            ? [...periods.slice(paidMonthIndex), ...periods.slice(0, paidMonthIndex)]
            : periods;
        let remaining = value;

        for (const period of orderedPeriods) {
          if (remaining.lessThanOrEqualTo(0)) {
            break;
          }

          const existingInvoice = await tx.invoice.findUnique({
            where: {
              studentId_tariffId_periodMonth_periodYear_academicYearId: {
                studentId: currentStudent.id,
                tariffId: tariff.id,
                periodMonth: period.month,
                periodYear: period.year,
                academicYearId: activeYear.id,
              },
            },
          });

          if (existingInvoice?.status === "LUNAS") {
            continue;
          }

          const amount = remaining.greaterThan(monthlySppAmount) ? monthlySppAmount : remaining;
          const invoice = existingInvoice
            ? await tx.invoice.update({
                where: { id: existingInvoice.id },
                data: {
                  amount,
                  totalAmount: amount,
                  status: "LUNAS",
                  paidAt,
                },
              })
            : await tx.invoice.create({
                data: {
                  studentId: currentStudent.id,
                  tariffId: tariff.id,
                  academicYearId: activeYear.id,
                  invoiceNumber: await nextInvoiceNumber(tx),
                  title: periodTitle(tariff.name, period.month, period.year),
                  periodMonth: period.month,
                  periodYear: period.year,
                  amount,
                  totalAmount: amount,
                  status: "LUNAS",
                  paidAt,
                  createdById: user.id,
                },
              });

          await recordCashPayment(invoice, amount);
          remaining = remaining.minus(amount);
        }

        continue;
      }

      const invoice = await tx.invoice.create({
        data: {
          studentId: currentStudent.id,
          tariffId: tariff.id,
          academicYearId: activeYear.id,
          invoiceNumber: await nextInvoiceNumber(tx),
          title: tariff.name,
          amount: value,
          totalAmount: value,
          status: "LUNAS",
          paidAt,
          createdById: user.id,
        },
      });
      await recordCashPayment(invoice, value);
    }

    if (createdInvoiceNumbers.length === 0) {
      throw new Error("Tidak ada pembayaran yang bisa disimpan. Cek nominal atau status tagihan siswa.");
    }
  });

  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/dashboard");

  return {
    ok: true,
    message: `${createdInvoiceNumbers.length} pembayaran tunai berhasil disimpan.`,
    invoiceNumber: cashInvoiceNumber || createdInvoiceNumbers[0],
    totalPaid: totalPaid.toNumber(),
  };
}
