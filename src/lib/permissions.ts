import type { DemoRole } from "@/lib/auth";

const permissionsByRole: Record<DemoRole, string[]> = {
  SUPER_ADMIN: ["*"],
  KEPALA_SEKOLAH: ["report.read", "invoice.read"],
  TATA_USAHA: [
    "settings.update",
    "tariff.manage",
    "hero.manage",
    "payment.cash.create",
    "payment.verify",
    "report.read",
    "student.manage",
    "class.manage",
    "invoice.create",
    "account.manage",
    "saving.transaction",
  ],
  BENDAHARA: [
    "payment.verify",
    "report.read",
    "payment.cash.create",
    "invoice.create",
    "saving.transaction",
  ],
  GURU: ["class.read"],
  ORANG_TUA: ["invoice.read.own", "saving.read.own"],
};

export function can(role: DemoRole, permission: string) {
  const permissions = permissionsByRole[role] ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}
