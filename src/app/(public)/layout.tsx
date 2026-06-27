import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/school-logo";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fbfdf6]">
      <header className="sticky top-0 z-50 w-full border-b border-[#b7d889]/60 bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <SchoolLogo className="size-11" priority />
            <div>
              <span className="block text-base font-bold leading-tight text-slate-950">
                TK Islam Azkia
              </span>
              <span className="block text-xs font-medium text-[#2412a8]">
                Pembayaran & Tabungan
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-slate-600 sm:inline-flex">
              <Link href="#kontak">Kontak</Link>
            </Button>
            <Button asChild className="bg-[#10b447] text-white hover:bg-[#078435]">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-slate-950 py-6 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 text-sm text-slate-300 md:flex-row md:items-center sm:px-6">
          <p>© {new Date().getFullYear()} TK Islam Azkia. Semua hak dilindungi.</p>
          <p>Aplikasi lokal pembayaran dan tabungan sekolah.</p>
        </div>
      </footer>
    </div>
  );
}
