import React from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { requireCurrentUser } from "@/lib/auth";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function getRoleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  if (user.role === "ORANG_TUA") {
    redirect("/dashboard");
  }

  const userProps = {
    name: user?.name ?? "Pengguna",
    roleLabel: user?.role ? getRoleLabel(user.role) : "Staff",
    initials: getInitials(user?.name ?? "A"),
  };

  return <AdminShell user={userProps}>{children}</AdminShell>;
}
