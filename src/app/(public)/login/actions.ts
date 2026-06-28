"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { setSession, verifyPassword } from "@/lib/auth";
import {
  assertLoginAllowed,
  clearLoginFailures,
  loginRateLimitKey,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function loginLocal(formData: FormData) {
  const intent = text(formData, "intent");
  const contact = text(formData, "contact");
  const password = text(formData, "password");
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "local";
  const rateLimitKey = loginRateLimitKey(ip, contact);

  if (!contact || !password) {
    redirect("/login?error=required");
  }

  try {
    assertLoginAllowed(rateLimitKey);
  } catch {
    redirect("/login?error=rate_limit");
  }

  const user = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ email: contact }, { phone: contact }],
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordLoginFailure(rateLimitKey);
    redirect("/login?error=invalid");
  }

  if (intent === "parent" && user.role !== "ORANG_TUA") {
    recordLoginFailure(rateLimitKey);
    redirect("/login?error=role");
  }

  if (intent === "staff" && user.role === "ORANG_TUA") {
    recordLoginFailure(rateLimitKey);
    redirect("/login?error=role");
  }

  clearLoginFailures(rateLimitKey);
  await setSession(user);
  redirect(user.role === "ORANG_TUA" ? "/dashboard" : "/admin/dashboard");
}
