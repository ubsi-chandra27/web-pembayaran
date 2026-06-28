"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  CreditCard,
  FileCheck,
  FileText,
  GraduationCap,
  HardDriveDownload,
  Images,
  LayoutDashboard,
  ScrollText,
  ReceiptText,
  Settings,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/siswa", label: "Siswa", icon: Users },
  { href: "/admin/kelas", label: "Kelas", icon: GraduationCap },
  { href: "/admin/akun", label: "Akun", icon: UserCog },
  { href: "/admin/tagihan", label: "Tagihan", icon: FileText },
  { href: "/admin/transaksi", label: "Transaksi", icon: CreditCard },
  { href: "/admin/pembayaran", label: "Laporan Pembayaran", icon: WalletCards },
  { href: "/admin/tunggakan", label: "Tunggakan", icon: FileText },
  { href: "/admin/verifikasi", label: "Verifikasi", icon: FileCheck },
  { href: "/admin/tabungan", label: "Tabungan", icon: BookOpenCheck },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/database", label: "Backup Data", icon: HardDriveDownload },
];

const settingsNav = [
  { href: "/admin/pengaturan/identitas-sekolah", label: "Identitas Sekolah", icon: ReceiptText },
  { href: "/admin/pengaturan/tarif-pokok", label: "Tarif Pokok", icon: WalletCards },
  { href: "/admin/pengaturan/hero", label: "Hero Landing", icon: Images },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const settingsOpen = pathname.startsWith("/admin/pengaturan");

  return (
    <nav className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
      <ul className="space-y-0.5">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  active
                    ? "bg-[#f3f8ea] text-[#078435]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {/* Active left-bar indicator */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#10b447]" />
                )}
                <item.icon
                  className={cn("shrink-0", collapsed ? "size-5" : "size-4")}
                />
                {!collapsed && item.label}
              </Link>
            </li>
          );
        })}

        {/* Settings section */}
        {collapsed ? (
          /* Collapsed: single icon linking to first settings page */
          <li>
            <Link
              href="/admin/pengaturan/identitas-sekolah"
              onClick={onNavigate}
              title="Pengaturan"
              className={cn(
                "relative flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                settingsOpen
                  ? "bg-[#f3f8ea] text-[#078435]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {settingsOpen && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#10b447]" />
              )}
              <Settings className="size-5 shrink-0" />
            </Link>
          </li>
        ) : (
          /* Expanded: accordion */
          <li>
            <details className="group" open={settingsOpen}>
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  settingsOpen
                    ? "bg-[#f3f8ea] text-[#078435]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Settings className="size-4 shrink-0" />
                <span className="flex-1">Pengaturan</span>
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-0.5 space-y-0.5 pl-4">
                {settingsNav.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          active
                            ? "bg-white text-[#078435] ring-1 ring-[#b7d889]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <item.icon className="size-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        )}
      </ul>
    </nav>
  );
}
