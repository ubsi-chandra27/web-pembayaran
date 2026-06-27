import { ImageUp, ReceiptText } from "lucide-react";

import { BankAccountForm } from "@/components/bank-account-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolLogo } from "@/components/school-logo";
import { SchoolIdentityForm } from "@/components/school-identity-form";
import { prisma } from "@/lib/prisma";

export default async function IdentitasSekolahPage() {
  const [setting, bankAccount] = await Promise.all([
    prisma.schoolSetting.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.bankAccount.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const school = {
    foundationName: setting?.foundationName ?? "Yayasan Pendidikan Islam Azkia",
    schoolName: setting?.schoolName ?? "TK Islam Azkia",
    address: setting?.address ?? "Jl. Pendidikan No. 12, Bekasi",
    email: setting?.email ?? "tu@tkislamazkia.sch.id",
    phone: setting?.phone ?? "0812-3456-7890",
    logoUrl: setting?.logoUrl ?? "/logo-tk-azkia-transparent.png",
    activeYearName: setting?.activeYearName ?? "2026/2027",
    receiptCity: setting?.receiptCity ?? "Bekasi",
    treasurerName: setting?.treasurerName ?? "Nama Admin",
    receiptNotes:
      setting?.receiptNotes ??
      "- Disimpan sebagai bukti pembayaran yang sah\n- Uang yang sudah dibayarkan tidak dapat diminta kembali",
  };
  const activeBankAccount = bankAccount
    ? {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#078435]">
          Pengaturan
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Identitas Sekolah
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Data ini dipakai untuk landing, kwitansi, kartu pembayaran, dan tampilan portal.
        </p>
      </div>

      <section className="grid items-start gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Card className="border-[#b7d889] bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageUp className="size-5 text-[#078435]" />
                Logo Sekolah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col items-center rounded-lg border border-dashed border-[#b7d889] bg-[#f3f8ea] p-6 text-center">
                <SchoolLogo className="size-28" />
                <p className="mt-4 text-sm font-medium text-slate-950">Logo aktif TK Islam Azkia</p>
                <p className="mt-1 text-xs text-slate-500">
                  Nantinya admin dapat mengunggah PNG transparan untuk semua dokumen.
                </p>
              </div>
              <Button variant="outline" className="w-full bg-white">
                Pilih Logo Baru
              </Button>
            </CardContent>
          </Card>

          <BankAccountForm account={activeBankAccount} />
        </div>

        <SchoolIdentityForm school={school} />
      </section>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-[#078435]" />
            Preview Pemakaian Identitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <SchoolLogo className="size-16" />
            <div>
              <p className="text-xs uppercase text-slate-500">{school.foundationName}</p>
              <p className="text-xl font-semibold text-slate-950">{school.schoolName}</p>
              <p className="text-sm text-slate-600">{school.address}</p>
              <p className="text-sm text-slate-600">
                Telepon: {school.phone} | Email: {school.email}
              </p>
            </div>
          </div>
          {bankAccount && (
            <div className="flex items-center gap-3 rounded-lg border border-[#b7d889] bg-[#f3f8ea] px-4 py-3">
              <p className="text-sm text-slate-500">Pembayaran via transfer ke</p>
              <p className="font-semibold text-slate-950">
                {bankAccount.bankName} - {bankAccount.accountNumber}
              </p>
              <p className="text-sm text-slate-600">a.n. {bankAccount.accountHolder}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
