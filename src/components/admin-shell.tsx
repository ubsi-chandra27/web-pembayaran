"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react";

import { logoutLocal } from "@/app/logout/actions";
import { AdminNav } from "@/components/admin-nav";
import { AdminToaster } from "@/components/admin-toaster";
import { SchoolLogo } from "@/components/school-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UserProps = {
  name: string;
  roleLabel: string;
  initials: string;
};

export function AdminShell({
  user,
  children,
}: {
  user: UserProps;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop grid layout ── */}
      <div
        className={cn(
          "min-h-screen bg-[#f7fbef] md:grid",
          collapsed ? "md:grid-cols-[64px_1fr]" : "md:grid-cols-[260px_1fr]",
        )}
      >
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden border-r border-slate-200 bg-white md:flex md:min-h-screen md:flex-col">
          {/* Logo — h-16 matches header height for alignment */}
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-slate-200",
              collapsed ? "justify-center px-3" : "px-5",
            )}
          >
            <Link
              href="/admin/dashboard"
              className="flex min-w-0 items-center gap-3"
            >
              <SchoolLogo className="size-8 shrink-0" priority />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    Admin Azkia
                  </p>
                  <p className="text-xs text-slate-500">
                    Tata usaha & bendahara
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Nav */}
          <AdminNav collapsed={collapsed} />

          {/* Bottom: logout + collapse toggle */}
          <div className="shrink-0 border-t border-slate-200 p-2 space-y-1">
            <form action={logoutLocal}>
              <button
                type="submit"
                className={cn(
                  "flex h-9 w-full items-center gap-3 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50",
                  collapsed ? "justify-center px-0" : "px-3",
                )}
                title={collapsed ? "Keluar" : undefined}
              >
                <LogOut className="size-4 shrink-0" />
                {!collapsed && "Keluar"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                collapsed ? "justify-center px-0" : "px-3",
              )}
              title={collapsed ? "Perbesar sidebar" : "Ciutkan sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4 shrink-0" />
              ) : (
                <PanelLeftClose className="size-4 shrink-0" />
              )}
              {!collapsed && (
                <span className="text-xs">Ciutkan sidebar</span>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div className="flex min-w-0 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            {/* Mobile: burger + brand */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka menu"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Menu className="size-5" />
              </button>
              <span className="font-semibold text-[#10b447]">Admin Azkia</span>
            </div>

            {/* Desktop: empty left (breadcrumb placeholder) */}
            <div className="hidden md:block" />

            {/* Right: notifications + profile */}
            <div className="flex items-center gap-1">
              {/* Bell notification */}
              <button
                type="button"
                aria-label="Notifikasi"
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Bell className="size-4" />
              </button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 focus:outline-none">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium leading-tight text-slate-950">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500">{user.roleLabel}</p>
                  </div>
                  <Avatar initials={user.initials} />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
                  {/* Profile header */}
                  <div className="flex items-center gap-3 px-2 py-2.5">
                    <Avatar initials={user.initials} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.roleLabel}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-slate-600">
                    <User className="size-4" />
                    Profil saya
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Logout via form action */}
                  <div className="p-1">
                    <form action={logoutLocal}>
                      <button
                        type="submit"
                        className="flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-rose-700 hover:bg-rose-50 focus:outline-none"
                      >
                        <LogOut className="size-4" />
                        Keluar
                      </button>
                    </form>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="shrink-0 border-t border-slate-100 bg-white px-6 py-3">
            <p className="text-center text-xs text-slate-400">
              © 2026 TK Azkia · Sistem Pembayaran Digital
            </p>
          </footer>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                <SchoolLogo className="size-8" />
                <p className="font-semibold text-slate-950">Admin Azkia</p>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <AdminNav onNavigate={() => setMobileOpen(false)} />

            <div className="shrink-0 border-t border-slate-200 p-3">
              <form action={logoutLocal}>
                <button
                  type="submit"
                  className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  Keluar
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <AdminToaster />
    </>
  );
}

function Avatar({
  initials,
  size = "sm",
}: {
  initials: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-[#ffc400] font-bold text-slate-800 ring-1 ring-[#e0ab00]",
        size === "sm" ? "size-9 text-sm" : "size-10 text-base",
      )}
    >
      {initials}
    </span>
  );
}
