import Image from "next/image";
import { ImagePlus, Save, ToggleRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addHeroSlide, updateHeroSlide } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export default async function HeroLandingSettingsPage() {
  const heroSlides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const activeCount = heroSlides.filter((slide) => slide.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
            Pengaturan
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Hero Landing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola foto, judul, dan deskripsi hero halaman utama. Maksimal 5 foto aktif.
          </p>
        </div>
        <Badge className="w-fit bg-[#ffc400] text-[#2412a8]">
          {activeCount} / 5 foto aktif
        </Badge>
      </div>

      <section className="grid gap-5">
        {heroSlides.map((slide, index) => (
          <Card key={slide.id} className="border-slate-200 bg-white">
            <CardContent className="grid gap-5 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-center">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
                <Image src={slide.imageUrl} alt={slide.alt} fill className="object-cover" />
              </div>
              <form id={`hero-${slide.id}`} action={updateHeroSlide} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={slide.id} />
                <div className="space-y-2">
                  <Label>Judul slide</Label>
                  <Input name="title" defaultValue={slide.title} className="h-10 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-[#f3f8ea] px-3 text-sm font-medium text-[#078435]">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={slide.isActive}
                      className="size-4 accent-[#10b447]"
                    />
                    <ToggleRight className="size-5" />
                    {slide.isActive ? "Aktif" : "Nonaktif"}
                  </label>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Deskripsi pendek</Label>
                  <Textarea name="caption" defaultValue={slide.caption} className="min-h-20 bg-white" />
                </div>
                <input type="hidden" name="alt" value={slide.alt} />
              </form>
              <div className="flex items-center justify-between gap-3 lg:flex-col">
                <Badge className="bg-slate-100 text-slate-700">Urutan {index + 1}</Badge>
                <Button type="submit" form={`hero-${slide.id}`} variant="outline" size="icon" className="bg-white" aria-label="Simpan slide">
                  <Save className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <form action={addHeroSlide}>
        <Card className="border-dashed border-[#b7d889] bg-[#f3f8ea]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="size-5 text-[#078435]" />
              Tambah Foto Hero
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-2">
            <Label>URL gambar</Label>
            <Input
              name="imageUrl"
              placeholder="/landing-azkia-wisuda.jpg"
              className="h-10 border-[#b7d889] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Judul slide</Label>
            <Input name="title" placeholder="Contoh: Kegiatan belajar yang ceria" className="h-10 bg-white" />
          </div>
          <Button type="submit" disabled={activeCount >= 5} className="h-10 bg-[#10b447] text-white disabled:opacity-45">
            Tambah Foto
          </Button>
          <div className="space-y-2 lg:col-span-3">
            <Label>Deskripsi pendek</Label>
            <Textarea name="caption" placeholder="Teks pendek yang tampil di hero landing saat foto ini aktif." className="min-h-20 bg-white" />
          </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
