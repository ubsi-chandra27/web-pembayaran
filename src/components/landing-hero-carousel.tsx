"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/school-logo";
import { cn } from "@/lib/utils";

export type LandingHeroSlide = {
  src: string;
  alt: string;
  position: string;
  title: string;
  caption: string;
};

const fallbackSlides: LandingHeroSlide[] = [
  {
    src: "/landing-azkia-wisuda.jpg",
    alt: "Siswa TK Islam Azkia mengenakan pakaian wisuda",
    position: "object-[62%_center]",
    title: "Pembayaran Sekolah dan Tabungan TK Islam Azkia",
    caption:
      "Portal lokal untuk orang tua dan staff sekolah: cek tagihan, unggah bukti pembayaran, verifikasi transaksi, dan pantau tabungan siswa dalam satu alur yang lembut dan jelas.",
  },
  {
    src: "/landing-azkia-guru.jpg",
    alt: "Guru TK Islam Azkia berfoto bersama di area sekolah",
    position: "object-center",
    title: "Administrasi sekolah lebih rapi dan hangat",
    caption:
      "Tata usaha, bendahara, dan orang tua memiliki alur yang sama jelasnya untuk pembayaran dan tabungan siswa.",
  },
];

export function LandingHeroCarousel({
  slides = fallbackSlides,
  schoolName = "TK Islam Azkia",
}: {
  slides?: LandingHeroSlide[];
  schoolName?: string;
}) {
  const [active, setActive] = useState(0);
  const safeSlides = slides.length > 0 ? slides : fallbackSlides;
  const activeSlide = safeSlides[active] ?? safeSlides[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % safeSlides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [safeSlides.length]);

  const goToPrevious = () => {
    setActive((current) => (current - 1 + safeSlides.length) % safeSlides.length);
  };

  const goToNext = () => {
    setActive((current) => (current + 1) % safeSlides.length);
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden text-white">
      {safeSlides.map((slide, index) => (
        <div
          key={slide.src}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            active === index ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className={cn("object-cover", slide.position)}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,36,22,0.88)_0%,rgba(7,132,53,0.72)_36%,rgba(36,18,168,0.42)_64%,rgba(17,17,17,0.22)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.1)_46%,rgba(0,0,0,0.48)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-3xl">
          <SchoolLogo className="mb-5 size-24" priority />
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal drop-shadow-lg sm:text-5xl lg:text-6xl">
            {activeSlide.title || `Pembayaran Sekolah dan Tabungan ${schoolName}`}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/90 drop-shadow sm:text-lg">
            {activeSlide.caption ||
              "Portal lokal untuk orang tua dan staff sekolah: cek tagihan, unggah bukti pembayaran, verifikasi transaksi, dan pantau tabungan siswa dalam satu alur yang lembut dan jelas."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 bg-[#ffc400] px-5 text-[#2412a8] hover:bg-[#ffd338]">
              <Link href="/login">
                Login Orang Tua
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-white/35 bg-white/8 px-5 text-white hover:bg-white/15"
            >
              <Link href="/admin/dashboard">Lihat Dashboard Admin</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-4 z-20 flex items-center gap-2 sm:right-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          className="border-white/35 bg-black/25 text-white hover:bg-black/45"
          aria-label="Slide sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goToNext}
          className="border-white/35 bg-black/25 text-white hover:bg-black/45"
          aria-label="Slide berikutnya"
        >
          <ChevronRight className="size-4" />
        </Button>
        <div className="ml-2 flex gap-2">
          {safeSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "h-2.5 rounded-full transition-all",
                active === index ? "w-8 bg-[#ffc400]" : "w-2.5 bg-white/65"
              )}
              aria-label={`Buka slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
