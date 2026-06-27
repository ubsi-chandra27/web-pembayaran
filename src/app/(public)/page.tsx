import Link from "next/link";
import {
  Banknote,
  Landmark,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingHeroCarousel } from "@/components/landing-hero-carousel";
import { prisma } from "@/lib/prisma";

const benefits = [
  {
    icon: ReceiptText,
    title: "Cek tagihan anak",
    body: "SPP, kegiatan, seragam, buku, katering, dan tagihan lain tampil dengan status yang mudah dipahami.",
  },
  {
    icon: ShieldCheck,
    title: "Upload bukti transfer",
    body: "Orang tua cukup unggah bukti dari HP, lalu bendahara memverifikasi dari antrean admin.",
  },
  {
    icon: WalletCards,
    title: "Pantau tabungan",
    body: "Saldo dan mutasi tabungan siswa tercatat seperti buku tabungan digital yang rapi.",
  },
];

export default async function LandingPage() {
  const [setting, bankAccount, heroSlides] = await Promise.all([
    prisma.schoolSetting.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.bankAccount.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
    }),
  ]);
  const schoolName = setting?.schoolName ?? "TK Islam Azkia";
  const foundationName = setting?.foundationName ?? "Yayasan Pendidikan Islam Azkia";

  return (
    <div className="bg-white text-slate-950">
      <section className="relative isolate overflow-hidden text-white">
        <LandingHeroCarousel
          schoolName={schoolName}
          slides={heroSlides.map((slide) => ({
            src: slide.imageUrl,
            alt: slide.alt,
            position: slide.position,
            title: slide.title,
            caption: slide.caption,
          }))}
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
        {benefits.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <item.icon className="mb-5 size-8 text-[#10b447]" />
            <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </article>
        ))}
      </section>

      <section id="kontak" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2412a8]">
              Informasi resmi
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Kanal pembayaran dan bantuan sekolah
            </h2>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <Landmark className="mb-4 size-6 text-[#10b447]" />
            <p className="text-sm text-slate-500">Rekening pembayaran</p>
            <p className="mt-1 font-semibold text-slate-950">
              {bankAccount?.bankName ?? "Bank Syariah Indonesia"}
            </p>
            <p className="mt-2 font-mono text-xl font-bold text-[#2412a8]">
              {bankAccount?.accountNumber ?? "7123 456 789"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              a.n. {bankAccount?.accountHolder ?? foundationName}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <MessageCircle className="mb-4 size-6 text-sky-600" />
            <p className="text-sm text-slate-500">Kontak sekolah</p>
            <p className="mt-1 font-semibold text-slate-950">Tata Usaha {schoolName}</p>
            <p className="mt-2 text-sm text-slate-600">
              WhatsApp: {setting?.phone ?? "0812-3456-7890"}
            </p>
            <p className="text-sm text-slate-600">
              {setting?.address ?? "Jl. Pendidikan No. 12, Bekasi"}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Banknote className="mb-3 size-7 text-[#10b447]" />
          <h2 className="text-2xl font-semibold text-slate-950">
            Siap memakai portal lokal sekolah?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Masuk sebagai orang tua untuk melihat pengalaman mobile-first, atau
            masuk sebagai staff untuk melihat dashboard operasional.
          </p>
        </div>
        <Button asChild className="h-11 bg-[#10b447] px-5 text-white hover:bg-[#078435]">
          <Link href="/login">Buka Halaman Login</Link>
        </Button>
      </section>
    </div>
  );
}
