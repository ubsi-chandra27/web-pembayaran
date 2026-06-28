"use server";

import { randomUUID } from "node:crypto";
import path from "node:path";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePaymentProofFile } from "@/lib/storage";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key).replace(/[^\d]/g, "");
  return new Prisma.Decimal(value || 0);
}

function normalizeMethod(value: string) {
  if (value === "EWALLET" || value === "QRIS") return value;
  return "TRANSFER";
}

async function assertParentOwnsInvoice(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      student: {
        guardians: {
          some: {
            guardian: { userId },
          },
        },
      },
    },
    include: {
      student: true,
    },
  });

  if (!invoice) {
    throw new Error("Tagihan tidak ditemukan untuk akun orang tua ini.");
  }

  return invoice;
}

export async function submitPaymentProof(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ORANG_TUA") {
    throw new Error("Silakan login sebagai orang tua untuk mengirim bukti pembayaran.");
  }

  const invoiceId = text(formData, "invoiceId");
  const paidDate = text(formData, "paidDate");
  const method = normalizeMethod(text(formData, "method"));
  const amount = numberValue(formData, "amount");
  const proof = formData.get("proof");

  if (!invoiceId || !paidDate || amount.lessThanOrEqualTo(0)) {
    throw new Error("Tagihan, tanggal bayar, dan nominal wajib diisi.");
  }

  if (!(proof instanceof File) || proof.size === 0) {
    throw new Error("Bukti pembayaran wajib diunggah.");
  }

  const allowedMime = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedMime.includes(proof.type)) {
    throw new Error("Bukti hanya boleh JPG, PNG, atau PDF.");
  }

  if (proof.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran bukti maksimal 2 MB.");
  }

  const allowedExtensionsByMime: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/pdf": [".pdf"],
  };
  const ext = path.extname(proof.name).toLowerCase();

  if (!allowedExtensionsByMime[proof.type]?.includes(ext)) {
    throw new Error("Ekstensi file tidak sesuai dengan tipe bukti pembayaran.");
  }

  const fileBuffer = Buffer.from(await proof.arrayBuffer());
  const isJpeg = fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff;
  const isPng =
    fileBuffer[0] === 0x89 &&
    fileBuffer[1] === 0x50 &&
    fileBuffer[2] === 0x4e &&
    fileBuffer[3] === 0x47;
  const isPdf = fileBuffer.subarray(0, 4).toString("utf8") === "%PDF";

  if (
    (proof.type === "image/jpeg" && !isJpeg) ||
    (proof.type === "image/png" && !isPng) ||
    (proof.type === "application/pdf" && !isPdf)
  ) {
    throw new Error("Isi file bukti tidak sesuai dengan format JPG, PNG, atau PDF.");
  }

  const invoice = await assertParentOwnsInvoice(user.id, invoiceId);

  if (invoice.status === "LUNAS" || invoice.status === "DIBATALKAN") {
    throw new Error("Tagihan ini tidak bisa dikirim bukti pembayaran lagi.");
  }

  const safeFileName = `${invoice.invoiceNumber}-${randomUUID()}${ext}`.replace(
    /[^a-zA-Z0-9_.-]/g,
    "-",
  );
  const paidAt = new Date(`${paidDate}T08:00:00.000Z`);
  const storedProof = await savePaymentProofFile({
    fileName: safeFileName,
    buffer: fileBuffer,
    mime: proof.type,
  });

  await prisma.$transaction(async (tx) => {
    const attemptCount = await tx.payment.count({ where: { invoiceId } });
    const payment = await tx.payment.create({
      data: {
        invoiceId,
        paymentNumber: `${invoice.invoiceNumber.replace("INV", "PAY")}-${attemptCount + 1}`,
        amount,
        method,
        status: "MENUNGGU_VERIFIKASI",
        paidAt,
        createdById: user.id,
        rejectionReason: text(formData, "notes") || null,
      },
    });

    await tx.paymentProof.create({
      data: {
        paymentId: payment.id,
        fileUrl: storedProof.fileUrl,
        fileName: proof.name,
        fileMime: proof.type,
        fileSize: proof.size,
        uploadedById: user.id,
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "MENUNGGU_VERIFIKASI" },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_PROOF_SUBMITTED",
        entity: "payments",
        entityId: payment.id,
        after: {
          invoiceNumber: invoice.invoiceNumber,
          amount: amount.toNumber(),
          method,
          fileUrl: storedProof.fileUrl,
          storageKey: storedProof.storageKey,
        },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/tagihan");
  revalidatePath("/riwayat");
  revalidatePath("/admin/verifikasi");

  return {
    ok: true,
    message: "Bukti pembayaran berhasil dikirim dan menunggu verifikasi.",
  };
}
