import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const demoRoles = [
  "SUPER_ADMIN",
  "KEPALA_SEKOLAH",
  "TATA_USAHA",
  "BENDAHARA",
  "GURU",
  "ORANG_TUA",
] as const;

export type DemoRole = (typeof demoRoles)[number];

export const sessionUserCookie = "azkia_user_id";
export const sessionRoleCookie = "azkia_role";

export function hashPassword(password: string) {
  return createHash("sha256").update(`azkia-demo:${password}`).digest("hex");
}

export async function getDemoUser(role: DemoRole = "TATA_USAHA") {
  return prisma.user.findFirst({
    where: { role, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionUserCookie)?.value;

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: userId, status: "ACTIVE" },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function setSession(user: { id: string; role: string }) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  cookieStore.set(sessionUserCookie, user.id, options);
  cookieStore.set(sessionRoleCookie, user.role, options);
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete(sessionUserCookie);
  cookieStore.delete(sessionRoleCookie);
}
