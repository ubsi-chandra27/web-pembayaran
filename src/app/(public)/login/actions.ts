"use server";

import { redirect } from "next/navigation";

import { hashPassword, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function loginLocal(formData: FormData) {
  const intent = text(formData, "intent");
  const contact = text(formData, "contact");
  const password = text(formData, "password");

  if (!contact || !password) {
    redirect("/login?error=required");
  }

  const user = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      passwordHash: hashPassword(password),
      OR: [{ email: contact }, { phone: contact }],
    },
  });

  if (!user) {
    redirect("/login?error=invalid");
  }

  if (intent === "parent" && user.role !== "ORANG_TUA") {
    redirect("/login?error=role");
  }

  if (intent === "staff" && user.role === "ORANG_TUA") {
    redirect("/login?error=role");
  }

  await setSession(user);
  redirect(user.role === "ORANG_TUA" ? "/dashboard" : "/admin/dashboard");
}
