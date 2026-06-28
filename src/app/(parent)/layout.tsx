import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText, Home, LogOut, User, Wallet } from "lucide-react";
import { SchoolLogo } from "@/components/school-logo";
import { logoutLocal } from "@/app/logout/actions";
import { Button } from "@/components/ui/button";
import { AdminToaster } from "@/components/admin-toaster";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/tagihan", label: "Tagihan", icon: FileText },
  { href: "/tabungan", label: "Tabungan", icon: Wallet },
  { href: "/riwayat", label: "Riwayat", icon: Clock },
  { href: "/akun", label: "Akun", icon: User },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  if (user.role !== "ORANG_TUA") {
    redirect("/admin/dashboard");
  }

  const guardian = await prisma.guardian.findFirst({
    where: { userId: user.id },
    include: { students: { include: { student: true } } },
  });
  const firstChild = guardian?.students[0]?.student;

  return (
    <div className="min-h-screen bg-[#f7fbef] pb-16 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#b7d889]/70 bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <SchoolLogo className="size-11" priority />
            <div>
              <span className="block text-sm font-semibold text-slate-950">
                Portal Wali Murid
              </span>
              <span className="block text-xs text-slate-500">TK Islam Azkia</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user?.name ?? "Wali Murid"}
              </p>
              <p className="text-xs text-slate-500">
                Orang tua {firstChild?.nickname ?? firstChild?.fullName ?? "siswa"}
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f3f8ea] text-[#2412a8] ring-1 ring-[#b7d889]">
              <User className="size-5" />
            </span>
            <form action={logoutLocal} className="hidden sm:block">
              <Button type="submit" variant="ghost" size="icon" aria-label="Keluar">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 md:py-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white md:hidden">
        <div className="grid h-16 grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#2412a8]"
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <AdminToaster />
    </div>
  );
}
