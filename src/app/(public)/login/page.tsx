import { ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { SchoolLogo } from "@/components/school-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginLocal } from "@/app/(public)/login/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f7fbef] px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="hidden lg:block">
          <SchoolLogo className="mb-6 size-28" priority />
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2412a8]">
            Akses lokal sekolah
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-950">
            Satu pintu untuk orang tua, tata usaha, dan bendahara.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Masuk memakai akun lokal dari database seed. Orang tua, tata usaha,
            dan bendahara akan diarahkan ke area sesuai rolenya.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              "Orang tua melihat tagihan dan tabungan anak.",
              "Tata usaha memantau tagihan dan pembayaran manual.",
              "Bendahara memverifikasi bukti transfer.",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                <ShieldCheck className="size-5 text-[#10b447]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-[#b7d889] bg-white shadow-xl">
          <CardHeader className="text-center">
            <SchoolLogo className="mx-auto mb-3 size-20" priority />
            <CardTitle className="text-2xl font-semibold text-slate-950">
              Masuk Portal Azkia
            </CardTitle>
            <CardDescription>
              Gunakan nomor WhatsApp atau email yang terdaftar di sekolah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-sky-200 bg-sky-50 text-sky-900">
              <Smartphone className="size-4" />
              <AlertDescription>
                Akun lokal: budi@example.com atau tu@tkislamazkia.sch.id, sandi demo12345.
              </AlertDescription>
            </Alert>
            {error && (
              <Alert className="border-rose-200 bg-rose-50 text-rose-800">
                <AlertDescription>
                  {error === "role"
                    ? "Akun ditemukan, tetapi rolenya tidak sesuai tombol masuk yang dipilih."
                    : error === "required"
                      ? "Email/WhatsApp dan kata sandi wajib diisi."
                      : "Email/WhatsApp atau kata sandi tidak cocok dengan data lokal."}
                </AlertDescription>
              </Alert>
            )}
            <form id="local-login" action={loginLocal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact">No. WhatsApp / Email</Label>
                <Input
                  id="contact"
                  name="contact"
                  placeholder="tu@tkislamazkia.sch.id"
                  className="h-10 bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata sandi</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="demo12345"
                  className="h-10 bg-white"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="grid gap-3 border-t bg-[#f3f8ea]">
            <Button
              type="submit"
              form="local-login"
              name="intent"
              value="parent"
              className="h-11 bg-[#10b447] text-white hover:bg-[#078435]"
            >
              Masuk sebagai Orang Tua
              <ArrowRight className="size-4" />
            </Button>
            <Button
              type="submit"
              form="local-login"
              name="intent"
              value="staff"
              variant="outline"
              className="h-11 bg-white"
            >
              Masuk sebagai Staff / Admin
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
