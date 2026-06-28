"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function changeOwnPassword(formData: FormData) {
  const user = await getCurrentUser();
  const currentPassword = text(formData, "currentPassword");
  const newPassword = text(formData, "newPassword");
  const confirmPassword = text(formData, "confirmPassword");

  if (!user) {
    throw new Error("Silakan login ulang untuk mengganti password.");
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("Password lama, password baru, dan konfirmasi wajib diisi.");
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error("Password lama tidak sesuai.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password baru minimal 8 karakter.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Konfirmasi password baru tidak sama.");
  }

  if (verifyPassword(newPassword, user.passwordHash)) {
    throw new Error("Password baru tidak boleh sama dengan password lama.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "OWN_PASSWORD_CHANGED",
        entity: "users",
        entityId: user.id,
        after: {
          name: user.name,
          role: user.role,
        },
      },
    });
  });

  revalidatePath("/admin/profil");
  revalidatePath("/akun");

  return { ok: true, message: "Password berhasil diganti." };
}
