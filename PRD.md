# PRD - Web Pembayaran dan Tabungan TK Islam Azkia

## 1. Overview

Web Pembayaran dan Tabungan TK Islam Azkia adalah aplikasi sekolah modern untuk membantu orang tua, guru, tata usaha, bendahara, dan kepala sekolah mengelola pembayaran sekolah serta tabungan siswa dalam satu sistem terpadu.

Produk ini mengadaptasi logika utama dari aplikasi PayListrik yang sudah ada: data master, tagihan, pembayaran, upload bukti, verifikasi admin, status transaksi, riwayat, struk, dan dashboard. Perbedaannya, domain aplikasi diubah dari listrik pascabayar menjadi pembayaran pendidikan dan tabungan siswa TK.

Stack teknologi baru:

- Next.js dengan App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Database relasional melalui Prisma ORM.
- Auth modern berbasis role.
- UI/UX fresh, lembut, mudah dipahami orang tua, guru, dan tata usaha.

### Product Vision

Menjadi sistem pembayaran sekolah yang sederhana, ramah orang tua, rapi untuk tata usaha, dan cukup kuat untuk mencatat transaksi sekolah harian seperti SPP, daftar ulang, kegiatan, seragam, buku, katering, jemputan, dan tabungan siswa.

### Product Goals

- Orang tua dapat melihat tagihan anak, membayar, mengunggah bukti, melihat status verifikasi, dan mengunduh struk.
- Tata usaha dapat membuat tagihan massal, memverifikasi pembayaran, mencatat pembayaran tunai, dan mengelola data siswa.
- Guru dapat melihat ringkasan pembayaran/tabungan siswa di kelasnya tanpa akses berlebihan ke data keuangan sensitif.
- Kepala sekolah/bendahara dapat melihat dashboard pemasukan, tunggakan, tabungan, dan laporan.
- Sistem menyediakan pencatatan tabungan siswa: setoran, penarikan, saldo, mutasi, dan cetak buku tabungan digital.

### Target Users

- Orang Tua/Wali: pengguna utama di frontend.
- Guru/Wali Kelas: melihat data kelas dan status administrasi siswa.
- Tata Usaha: operator utama pembayaran dan data siswa.
- Bendahara: pengelola validasi keuangan dan laporan transaksi.
- Kepala Sekolah: pemantauan dashboard dan laporan.
- Super Admin: pengaturan sistem, role, user, master data, dan konfigurasi.

### Design Principles

- Ramah untuk orang tua: bahasa jelas, tombol besar, status transaksi mudah dipahami.
- Fresh untuk sekolah TK Islam: visual lembut, bersih, bernuansa edukatif, tidak terlalu korporat.
- Cepat untuk tata usaha: tabel padat, filter jelas, aksi massal, dan minim klik.
- Aman: role-based access, audit log, validasi upload, dan transaksi database konsisten.
- Mobile-first: orang tua kemungkinan besar membuka dari HP.

## 2. Requirements

### 2.1 Functional Requirements

#### Public / Guest

- Sistem harus menampilkan landing page TK Islam Azkia.
- Landing page harus berisi:
  - identitas sekolah,
  - ringkasan layanan pembayaran,
  - manfaat untuk orang tua,
  - CTA login,
  - kontak sekolah,
  - informasi rekening resmi sekolah.
- Guest tidak boleh melihat data siswa, tagihan, pembayaran, atau tabungan.
- Guest dapat membuka halaman login.

#### Authentication

- User harus login sebelum mengakses area aplikasi.
- Sistem harus mendukung role:
  - `SUPER_ADMIN`,
  - `KEPALA_SEKOLAH`,
  - `BENDAHARA`,
  - `TATA_USAHA`,
 
  - `ORANG_TUA`.
- User dapat logout.
- Sistem harus membatasi menu dan aksi berdasarkan role.
- Password harus disimpan sebagai hash.
- Sistem harus mendukung reset password oleh admin.
- Sistem idealnya mendukung verifikasi email/WhatsApp pada fase lanjutan.

#### Orang Tua / Wali

- Orang tua dapat melihat daftar anak yang terhubung dengan akunnya.
- Orang tua dapat memilih anak aktif.
- Orang tua dapat melihat ringkasan:
  - total tagihan belum dibayar,
  - tagihan menunggu verifikasi,
  - tagihan lunas,
  - saldo tabungan anak.
- Orang tua dapat melihat detail tagihan per anak.
- Orang tua dapat memfilter tagihan berdasarkan:
  - tahun ajaran,
  - bulan,
  - kategori pembayaran,
  - status.
- Orang tua dapat melihat rincian tagihan:
  - nama siswa,
  - kelas,
  - jenis pembayaran,
  - periode,
  - nominal,
  - denda/diskon jika ada,
  - total bayar,
  - status.
- Orang tua dapat memilih tagihan dan melakukan pembayaran.
- Orang tua dapat mengunggah bukti pembayaran.
- Setelah upload bukti, status berubah menjadi `MENUNGGU_VERIFIKASI`.
- Orang tua dapat melihat riwayat pembayaran.
- Orang tua dapat mengunduh atau mencetak struk pembayaran.
- Orang tua dapat melihat saldo dan mutasi tabungan anak.
- Orang tua dapat melihat informasi rekening resmi sekolah.



#### Tata Usaha

- Tata usaha dapat mengelola data siswa.
- Tata usaha dapat mengelola data orang tua/wali.
- Tata usaha dapat menghubungkan siswa dengan orang tua.
- Tata usaha dapat mengelola kelas.
- Tata usaha dapat mengelola tahun ajaran.
- Tata usaha dapat mengelola kategori pembayaran.
- Tata usaha dapat membuat tagihan:
  - per siswa,
  - per kelas,
  - massal semua siswa aktif,
  - berdasarkan kategori dan periode.
- Tata usaha dapat melihat daftar tagihan.
- Tata usauk vdsha dapat memfilter tagihan berdasarkan:
  - siswa,
  - kelas,
  - kategori,
  - periode,
  - status.
- Tata usaha dapat mencatat pembayaran tunai/konvensional melalui menu Transaksi.
- Tata usaha dapat mengunggah bukti pembayaran atas nama orang tua jika pembayaran diterima offline.
- Tata usaha dapat membuat transaksi tabungan:
  - setoran,
  - penarikan,
  - koreksi.
- Tata usaha dapat mencetak struk pembayaran.
- Tata usaha dapat mencetak laporan tabungan siswa.

#### Bendahara

- Bendahara dapat memverifikasi pembayaran transfer/upload bukti.
- Bendahara dapat menyetujui pembayaran.
- Bendahara dapat menolak pembayaran dengan alasan.
- Bendahara dapat melihat rekap pemasukan.
- Bendahara dapat melihat laporan tunggakan.
- Bendahara dapat melihat laporan tabungan.
- Bendahara dapat melakukan koreksi transaksi dengan audit log.
- Bendahara dapat mengekspor laporan ke CSV/XLSX/PDF pada fase lanjutan.

#### Kepala Sekolah

- Kepala sekolah dapat melihat dashboard ringkasan:
  - total pemasukan bulan ini,
  - total tunggakan,
  - pembayaran menunggu verifikasi,
  - saldo total tabungan siswa,
  - siswa dengan tunggakan terbanyak,
  - tren pembayaran bulanan.
- Kepala sekolah dapat melihat laporan tanpa mengubah data transaksi.

#### Super Admin

- Super admin dapat mengelola semua user.
- Super admin dapat mengatur role dan permission.
- Super admin dapat mengatur konfigurasi sekolah:
  - nama sekolah,
  - alamat,
  - logo,
  - nomor WhatsApp,
  - rekening pembayaran,
  - biaya admin jika digunakan,
  - aturan denda/diskon jika digunakan.
- Super admin dapat mengelola audit log.

### 2.2 Non-Functional Requirements

#### Usability

- Aplikasi harus mudah digunakan di layar HP.
- Alur orang tua membayar tagihan maksimal:
  - pilih anak,
  - pilih tagihan,
  - upload bukti,
  - kirim.
- Bahasa UI harus ramah dan jelas.
- Status transaksi harus menggunakan label warna yang mudah dipahami:
  - Belum Dibayar,
  - Menunggu Verifikasi,
  - Lunas,
  - Ditolak,
  - Dibatalkan.

#### Security

- Semua halaman dashboard harus dilindungi authentication.
- Semua aksi harus dicek authorization berdasarkan role.
- File upload harus divalidasi:
  - tipe file,
  - ukuran file,
  - MIME type,
  - nama file aman.
- User orang tua tidak boleh mengakses data anak yang tidak terhubung dengannya.
- Semua transaksi penting harus menghasilkan audit log.
- Session harus aman dan memiliki expiry.

#### Reliability

- Proses verifikasi pembayaran harus menggunakan transaksi database.
- Pencatatan tabungan harus berbasis ledger agar saldo dapat diaudit.
- Saldo tabungan tidak boleh dihitung dari input manual saja; saldo harus berasal dari mutasi atau disimpan dengan mekanisme transaction-safe.
- Tagihan massal harus idempotent: sistem tidak boleh membuat tagihan duplikat untuk siswa, kategori, dan periode yang sama.

#### Performance

- Tabel admin harus mendukung pagination, search, dan filter.
- Dashboard harus mengambil agregasi secara efisien.
- File bukti pembayaran harus disimpan di object storage pada fase produksi.

#### Maintainability

- Gunakan TypeScript strict.
- Gunakan Prisma schema sebagai sumber utama struktur database.
- Gunakan komponen UI reusable dari shadcn/ui.
- Pisahkan domain:
  - auth,
  - siswa,
  - tagihan,
  - pembayaran,
  - tabungan,
  - laporan,
  - settings.

## 3. Core Features

### 3.1 Landing Page Sekolah

Halaman awal publik dengan visual sekolah TK Islam Azkia.

Konten utama:

- Hero: "Pembayaran Sekolah dan Tabungan TK Islam Azkia"
- Hero menggunakan foto kegiatan/sekolah sebagai background utama.
- Foto hero dapat dikelola admin dari pengaturan landing dengan maksimal 5 foto aktif.
- CTA: Login Orang Tua, Login Staff
- Ringkasan manfaat:
  - cek tagihan anak,
  - upload bukti pembayaran,
  - pantau tabungan,
  - struk digital.
- Kontak sekolah.
- Rekening resmi.

### 3.2 Dashboard Orang Tua

Dashboard yang sederhana dan mobile-first.

Komponen:

- Selector anak.
- Kartu total tagihan.
- Kartu saldo tabungan.
- Kartu status pembayaran terakhir.
- Daftar tagihan yang perlu dibayar.
- Shortcut:
  - Bayar Tagihan,
  - Riwayat Pembayaran,
  - Tabungan Anak,
  - Bantuan.

### 3.3 Manajemen Siswa

Fitur untuk TU/admin:

- CRUD siswa.
- Status siswa:
  - aktif,
  - lulus,
  - pindah,
  - nonaktif.
- Relasi siswa ke kelas.
- Relasi siswa ke orang tua/wali.
- Nomor induk siswa.
- Data dasar:
  - nama lengkap,
  - nama panggilan,
  - jenis kelamin,
  - tanggal lahir,
  - alamat,
  - foto opsional.

### 3.4 Manajemen Orang Tua/Wali

- CRUD data wali.
- Relasi satu wali dapat memiliki beberapa anak.
- Relasi satu anak dapat memiliki beberapa wali.
- Kontak:
  - nomor WhatsApp,
  - email,
  - alamat.

### 3.5 Kategori Pembayaran

Contoh kategori:

- SPP Bulanan.
- Daftar Ulang.
- Seragam.
- Buku.
- Kegiatan.
- Katering.
- Antar Jemput.
- Infaq.
- Lain-lain.

Tipe kategori:

- `RECURRING`: tagihan berulang, contoh SPP bulanan.
- `ONE_TIME`: tagihan sekali, contoh seragam.
- `OPTIONAL`: opsional, contoh kegiatan tertentu.

### 3.6 Tagihan

Tagihan adalah kewajiban pembayaran untuk siswa.

Fitur:

- Buat tagihan individual.
- Buat tagihan massal per kelas.
- Buat tagihan massal semua siswa aktif.
- Edit nominal sebelum dibayar.
- Void/batalkan tagihan jika salah input.
- Status tagihan:
  - `BELUM_DIBAYAR`,
  - `MENUNGGU_VERIFIKASI`,
  - `LUNAS`,
  - `DITOLAK`,
  - `DIBATALKAN`.

### 3.7 Pembayaran

Pembayaran mengadaptasi logika PayListrik:

- Orang tua memilih tagihan.
- Sistem menghitung total bayar.
- Orang tua melihat rekening resmi sekolah.
- Orang tua upload bukti.
- Status pembayaran masuk `MENUNGGU_VERIFIKASI`.
- Bendahara/TU memverifikasi.
- Jika diterima, tagihan menjadi `LUNAS`.
- Jika ditolak, tagihan kembali perlu dibayar dan alasan penolakan disimpan.
- Nomor referensi utama yang tampil di transaksi, laporan, kwitansi, dan kartu pembayaran adalah `invoiceNumber`, contoh `INV-2026-07001`.

Metode pembayaran:

- Transfer bank.
- E-wallet.
- Tunai.
- QRIS pada fase lanjutan.

#### Transaksi Tunai / Konvensional TU

Menu Transaksi dipakai saat orang tua datang ke sekolah untuk membayar langsung.

Fitur:

- TU memasukkan NIS/no induk.
- Sistem menampilkan nama murid dan kelas.
- Tombol Edit Siswa mengarah ke data siswa terkait.
- TU mengisi tanggal bayar.
- Tombol Simpan Transaksi tidak aktif jika tanggal bayar belum terisi.
- SPP wajib selalu tersedia sebagai tarif pokok dan tidak dapat dihapus; admin hanya mengatur nominalnya.
- Tarif pokok tambahan dapat dibuat admin tanpa kategori.
- Sistem menampilkan informasi pembayaran SPP per bulan dengan warna:
  - hijau untuk sudah bayar,
  - merah untuk belum bayar,
  - kuning untuk perlu dicek/menunggu.
- TU dapat membuka preview/cetak kwitansi dan kartu pembayaran.

### 3.8 Tabungan Siswa

Tabungan siswa adalah ledger transaksi keuangan milik siswa.

Fitur:

- Setoran tabungan.
- Penarikan tabungan.
- Koreksi transaksi.
- Mutasi tabungan.
- Saldo tabungan.
- Cetak buku tabungan digital.

Jenis transaksi:

- `SETORAN`
- `PENARIKAN`
- `KOREKSI_MASUK`
- `KOREKSI_KELUAR`

Aturan:

- Penarikan tidak boleh membuat saldo negatif.
- Semua transaksi tabungan harus memiliki pembuat transaksi.
- Koreksi harus memiliki catatan/alasan.
- Transaksi yang sudah dibuat tidak dihapus langsung; gunakan reversal/koreksi.

### 3.9 Verifikasi Pembayaran

Fitur untuk bendahara/TU:

- Lihat antrian pembayaran menunggu verifikasi.
- Preview bukti pembayaran.
- Setujui pembayaran.
- Tolak pembayaran dengan alasan.
- Simpan audit log.
- Buat receipt/struk otomatis.

### 3.10 Struk dan Riwayat

Orang tua dan staff dapat membuka struk digital.

Isi struk:

- nomor struk,
- nama sekolah,
- nama siswa,
- kelas,
- jenis pembayaran,
- periode,
- nominal,
- metode pembayaran,
- tanggal pembayaran,
- petugas/verifikator,
- status,
- QR/code verifikasi pada fase lanjutan.

### 3.11 Dashboard Admin

Dashboard untuk TU/bendahara/kepala sekolah.

Widget:

- Total siswa.
- Total pemasukan hari ini.
- Total pemasukan bulan ini.
- Tagihan belum dibayar.
- Pembayaran menunggu verifikasi.
- Total saldo tabungan.
- Tunggakan per kelas.
- Grafik kategori pembayaran.
- Daftar transaksi terbaru.

### 3.12 Laporan

Laporan awal:

- Laporan pembayaran per periode.
- Laporan pembayaran bersifat read-only; input pembayaran tunai dilakukan dari menu Transaksi.
- Laporan tunggakan per kelas.
- Laporan pembayaran per kategori.
- Laporan tabungan per siswa.
- Mutasi tabungan per periode.

Export fase lanjutan:

- CSV.
- XLSX.
- PDF.

## 4. User Flow

### 4.1 Orang Tua Membayar Tagihan

```text
Orang tua login
-> pilih anak
-> buka Tagihan
-> pilih tagihan Belum Dibayar
-> lihat rincian dan rekening sekolah
-> transfer/manual payment
-> upload bukti
-> sistem validasi file
-> status menjadi Menunggu Verifikasi
-> bendahara/TU verifikasi
-> jika diterima, status menjadi Lunas dan struk tersedia
-> jika ditolak, orang tua melihat alasan dan dapat upload ulang
```

### 4.2 TU Membuat Tagihan Massal SPP

```text
TU login
-> buka Tagihan
-> klik Buat Tagihan Massal
-> pilih tahun ajaran
-> pilih bulan
-> pilih kategori SPP Bulanan
-> pilih kelas atau semua siswa aktif
-> isi nominal
-> preview daftar siswa
-> konfirmasi
-> sistem membuat tagihan tanpa duplikasi
```

### 4.3 Bendahara Memverifikasi Pembayaran

```text
Bendahara login
-> buka Verifikasi
-> pilih pembayaran Menunggu Verifikasi
-> cek bukti pembayaran
-> setujui atau tolak
-> jika setujui:
   payment.status = TERVERIFIKASI
   invoice.status = LUNAS
   receipt dibuat
-> jika tolak:
   payment.status = DITOLAK
   invoice.status = DITOLAK atau BELUM_DIBAYAR
   alasan penolakan disimpan
```

### 4.4 TU Mencatat Setoran Tabungan

```text
TU login
-> buka Tabungan
-> cari siswa
-> klik Setoran
-> isi nominal dan catatan
-> simpan
-> sistem membuat ledger SETORAN
-> saldo siswa bertambah
-> struk setoran tersedia
```

### 4.5 TU Mencatat Penarikan Tabungan

```text
TU login
-> buka Tabungan
-> cari siswa
-> klik Penarikan
-> isi nominal dan catatan
-> sistem cek saldo
-> jika saldo cukup, ledger PENARIKAN dibuat
-> saldo siswa berkurang
-> jika saldo tidak cukup, tampilkan error
```

### 4.6 Guru Melihat Status Kelas

```text
Guru login
-> buka Kelas Saya
-> lihat daftar siswa
-> lihat ringkasan status administrasi
-> bantu mengingatkan orang tua bila ada tunggakan
```

## 5. Architecture

### 5.1 High-Level Architecture

```text
Browser / Mobile Browser
  |
  v
Next.js App Router
  |
  |-- Server Components
  |-- Client Components
  |-- Server Actions / Route Handlers
  |
  v
Domain Services
  |
  |-- Auth Service
  |-- Billing Service
  |-- Payment Service
  |-- Savings Service
  |-- Reporting Service
  |
  v
Prisma ORM
  |
  v
PostgreSQL / MySQL
```

### 5.2 Recommended Project Structure

```text
web-pembayaran/
  app/
    (public)/
      page.tsx
      login/
    (parent)/
      dashboard/
      tagihan/
      pembayaran/
      tabungan/
      riwayat/
    (admin)/
      dashboard/
      siswa/
      wali/
      kelas/
      tagihan/
      pembayaran/
      verifikasi/
      tabungan/
      laporan/
      settings/
    api/
      upload/
      webhooks/
  components/
    ui/
    layout/
    dashboard/
    forms/
    tables/
    receipts/
  lib/
    auth.ts
    prisma.ts
    permissions.ts
    format.ts
    upload.ts
    validations.ts
  modules/
    students/
    guardians/
    billing/
    payments/
    savings/
    reports/
    settings/
  prisma/
    schema.prisma
    seed.ts
  public/
    logo/
    images/
  docs/
    prompts/
    wireframes/
```

### 5.3 Frontend Architecture

- Public pages untuk landing dan login.
- Parent area untuk orang tua.
- Admin area untuk TU, bendahara, guru, kepala sekolah, dan super admin.
- shadcn/ui sebagai dasar komponen:
  - Button,
  - Card,
  - Dialog,
  - Sheet,
  - Table,
  - Form,
  - Select,
  - Tabs,
  - Badge,
  - Dropdown Menu,
  - Alert,
  - Calendar/Date Picker.
- TanStack Table direkomendasikan untuk tabel admin.
- Zod untuk validasi form.
- React Hook Form untuk form kompleks.

### 5.4 Backend Architecture

Next.js dapat memakai:

- Server Actions untuk mutasi internal.
- Route Handlers untuk upload, webhook, dan API yang perlu endpoint eksplisit.
- Prisma transaction untuk proses pembayaran/verifikasi/tabungan.
- Middleware untuk route protection.

### 5.5 Auth and Authorization

Rekomendasi:

- Auth.js / NextAuth untuk session.
- Credentials provider untuk login awal.
- Role-based access control.
- Permission helper:

```text
can(user, "payment.verify")
can(user, "invoice.create")
can(user, "saving.withdraw")
```

### 5.6 Payment State Machine

```text
BELUM_DIBAYAR
  -> MENUNGGU_VERIFIKASI
  -> LUNAS

MENUNGGU_VERIFIKASI
  -> DITOLAK
  -> LUNAS

DITOLAK
  -> MENUNGGU_VERIFIKASI

BELUM_DIBAYAR
  -> DIBATALKAN
```

### 5.7 Savings Ledger State

```text
SETORAN        menambah saldo
PENARIKAN      mengurangi saldo
KOREKSI_MASUK  menambah saldo dengan alasan
KOREKSI_KELUAR mengurangi saldo dengan alasan
REVERSAL        membalik transaksi tertentu pada fase lanjutan
```

## 6. Database Schema

Database dapat menggunakan PostgreSQL untuk proyek baru. Jika ingin tetap dekat dengan XAMPP, MySQL juga bisa. Rekomendasi modern: PostgreSQL + Prisma.

### 6.1 Entity Relationship Summary

```text
User n--1 Role
Student n--n Guardian melalui StudentGuardian
Student n--1 Class
Class n--1 AcademicYear
PaymentCategory 1--n Invoice
Student 1--n Invoice
Invoice 1--n Payment
Payment 1--n PaymentProof
Student 1--1 SavingsAccount
SavingsAccount 1--n SavingsTransaction
User 1--n AuditLog
SchoolSetting 1--n BankAccount
```

### 6.2 Core Tables

#### `roles`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | string | SUPER_ADMIN, KEPALA_SEKOLAH, BENDAHARA, TATA_USAHA, GURU, ORANG_TUA |
| label | string | Label tampilan |
| createdAt | datetime |  |
| updatedAt | datetime |  |

#### `users`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| roleId | uuid | FK roles |
| name | string | Nama user |
| email | string | unique nullable |
| phone | string | unique nullable |
| passwordHash | string |  |
| avatarUrl | string | nullable |
| status | enum | ACTIVE, INACTIVE |
| createdAt | datetime |  |
| updatedAt | datetime |  |

#### `academic_years`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | string | contoh 2026/2027 |
| startsAt | date |  |
| endsAt | date |  |
| isActive | boolean |  |

#### `classes`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| academicYearId | uuid | FK academic_years |
| teacherId | uuid | FK users nullable |
| name | string | contoh TK A, TK B |
| level | string | nullable |
| createdAt | datetime |  |
| updatedAt | datetime |  |

#### `students`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| classId | uuid | FK classes |
| nis | string | unique |
| fullName | string |  |
| nickname | string | nullable |
| gender | enum | MALE, FEMALE |
| birthDate | date | nullable |
| address | text | nullable |
| photoUrl | string | nullable |
| status | enum | ACTIVE, GRADUATED, MOVED, INACTIVE |
| createdAt | datetime |  |
| updatedAt | datetime |  |

#### `guardians`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| userId | uuid | FK users nullable |
| name | string |  |
| relation | string | Ayah, Ibu, Wali |
| phone | string | nullable |
| email | string | nullable |
| address | text | nullable |

#### `student_guardians`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| studentId | uuid | FK students |
| guardianId | uuid | FK guardians |
| isPrimary | boolean |  |

Unique:

- `studentId + guardianId`

#### `payment_categories`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | string | SPP, Seragam, Kegiatan |
| type | enum | RECURRING, ONE_TIME, OPTIONAL |
| defaultAmount | decimal | nullable |
| description | text | nullable |
| isActive | boolean |  |

#### `invoices`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| studentId | uuid | FK students |
| categoryId | uuid | FK payment_categories |
| academicYearId | uuid | FK academic_years |
| invoiceNumber | string | unique |
| title | string | contoh SPP Juli 2026 |
| periodMonth | int | nullable 1-12 |
| periodYear | int | nullable |
| amount | decimal | nominal utama |
| discountAmount | decimal | default 0 |
| fineAmount | decimal | default 0 |
| totalAmount | decimal | amount - discount + fine |
| dueDate | date | nullable |
| status | enum | BELUM_DIBAYAR, MENUNGGU_VERIFIKASI, LUNAS, DITOLAK, DIBATALKAN |
| notes | text | nullable |
| createdById | uuid | FK users |
| createdAt | datetime |  |
| updatedAt | datetime |  |

Unique recommendation:

- `studentId + categoryId + periodMonth + periodYear + academicYearId`

#### `payments`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| invoiceId | uuid | FK invoices |
| paymentNumber | string | unique |
| amount | decimal |  |
| method | enum | TRANSFER, EWALLET, TUNAI, QRIS |
| status | enum | MENUNGGU_VERIFIKASI, TERVERIFIKASI, DITOLAK, DIBATALKAN |
| paidAt | datetime | waktu orang tua bayar/upload |
| verifiedAt | datetime | nullable |
| verifiedById | uuid | FK users nullable |
| rejectionReason | text | nullable |
| createdById | uuid | FK users |
| createdAt | datetime |  |
| updatedAt | datetime |  |

#### `payment_proofs`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| paymentId | uuid | FK payments |
| fileUrl | string |  |
| fileName | string |  |
| fileMime | string |  |
| fileSize | int | bytes |
| uploadedById | uuid | FK users |
| createdAt | datetime |  |

#### `receipts`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| paymentId | uuid | FK payments unique |
| receiptNumber | string | unique |
| issuedAt | datetime |  |
| issuedById | uuid | FK users |
| pdfUrl | string | nullable |

#### `savings_accounts`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| studentId | uuid | FK students unique |
| accountNumber | string | unique |
| balance | decimal | default 0 |
| status | enum | ACTIVE, CLOSED |
| createdAt | datetime |  |
| updatedAt | datetime |  |

#### `savings_transactions`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| accountId | uuid | FK savings_accounts |
| transactionNumber | string | unique |
| type | enum | SETORAN, PENARIKAN, KOREKSI_MASUK, KOREKSI_KELUAR |
| amount | decimal |  |
| balanceBefore | decimal |  |
| balanceAfter | decimal |  |
| notes | text | nullable |
| createdById | uuid | FK users |
| createdAt | datetime |  |

#### `bank_accounts`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| bankName | string | contoh BSI, BCA |
| accountNumber | string |  |
| accountHolder | string |  |
| isActive | boolean |  |

#### `audit_logs`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| userId | uuid | FK users nullable |
| action | string | contoh PAYMENT_VERIFIED |
| entity | string | contoh payments |
| entityId | string |  |
| before | json | nullable |
| after | json | nullable |
| ipAddress | string | nullable |
| userAgent | string | nullable |
| createdAt | datetime |  |

### 6.3 Important Enums

```text
RoleName:
SUPER_ADMIN
KEPALA_SEKOLAH
BENDAHARA
TATA_USAHA
GURU
ORANG_TUA

InvoiceStatus:
BELUM_DIBAYAR
MENUNGGU_VERIFIKASI
LUNAS
DITOLAK
DIBATALKAN

PaymentStatus:
MENUNGGU_VERIFIKASI
TERVERIFIKASI
DITOLAK
DIBATALKAN

PaymentMethod:
TRANSFER
EWALLET
TUNAI
QRIS

SavingTransactionType:
SETORAN
PENARIKAN
KOREKSI_MASUK
KOREKSI_KELUAR
```

## 7. Tech Stack

### Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide React icons.
- React Hook Form.
- Zod.
- TanStack Table.
- Recharts untuk chart dashboard.

### Backend

- Next.js Server Actions.
- Next.js Route Handlers.
- Prisma ORM.
- Auth.js / NextAuth.
- Zod untuk server-side validation.

### Database

Rekomendasi:

- PostgreSQL untuk pengembangan modern.

Alternatif:

- MySQL/MariaDB jika ingin dekat dengan XAMPP.

### Storage

Development:

- Local filesystem di folder private upload.

Production:

- S3-compatible storage,
- Cloudflare R2,
- Supabase Storage,
- atau object storage lain.

### UI Design System

- shadcn/ui sebagai komponen dasar.
- Tailwind tokens untuk warna.
- Palet rekomendasi:
  - emerald/teal sebagai aksen keislaman yang segar,
  - sky/cyan sebagai warna informatif,
  - amber untuk peringatan,
  - rose untuk error,
  - slate/zinc untuk teks dan struktur.
- Hindari UI yang terlalu gelap atau terlalu ramai.

## 8. Business Rules

- Satu siswa dapat memiliki banyak tagihan.
- Satu tagihan dapat memiliki beberapa attempt pembayaran, tetapi hanya satu pembayaran terverifikasi aktif.
- Tagihan dianggap lunas jika ada pembayaran terverifikasi dengan nominal memenuhi total tagihan.
- Tagihan massal tidak boleh membuat duplikat untuk siswa, kategori, periode, dan tahun ajaran yang sama.
- Pembayaran transfer/upload bukti harus diverifikasi oleh bendahara/TU sebelum dianggap lunas.
- Pembayaran tunai dapat langsung diverifikasi oleh petugas yang berwenang.
- Transaksi tunai/konvensional menggunakan `invoiceNumber` sebagai nomor transaksi yang tampil di kwitansi dan laporan.
- Laporan pembayaran tidak dipakai untuk input transaksi baru.
- Penolakan pembayaran wajib memiliki alasan.
- Tabungan siswa tidak boleh negatif.
- Transaksi tabungan tidak dihapus; koreksi dilakukan dengan transaksi koreksi.
- Semua aksi penting harus masuk audit log.

## 9. Permissions

| Feature | Orang Tua | Guru | Tata Usaha | Bendahara | Kepala Sekolah | Super Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Lihat tagihan anak sendiri | Yes | No | Yes | Yes | Yes | Yes |
| Upload bukti pembayaran | Yes | No | Yes | Yes | No | Yes |
| Verifikasi pembayaran | No | No | Optional | Yes | No | Yes |
| Buat tagihan | No | No | Yes | Yes | No | Yes |
| Hapus/batalkan tagihan | No | No | Optional | Yes | No | Yes |
| Lihat tabungan anak sendiri | Yes | No | Yes | Yes | Yes | Yes |
| Setoran tabungan | No | No | Yes | Yes | No | Yes |
| Penarikan tabungan | No | No | Optional | Yes | No | Yes |
| Lihat laporan | No | Limited | Yes | Yes | Yes | Yes |
| Kelola user | No | No | No | No | No | Yes |

## 10. UI/UX Requirements

### Parent UI

- Mobile-first.
- Bottom navigation pada layar kecil:
  - Beranda,
  - Tagihan,
  - Tabungan,
  - Riwayat,
  - Akun.
- Kartu ringkasan jelas.
- CTA pembayaran menonjol.
- Status tagihan memakai badge.
- Upload bukti dibuat seperti step-by-step.

### Admin UI

- Sidebar desktop.
- Menu admin utama mencakup Dashboard, Siswa, Tagihan, Transaksi, Laporan Pembayaran, Verifikasi, Tabungan, dan Pengaturan.
- Pengaturan memiliki submenu:
  - Identitas Sekolah,
  - Tarif Pokok Pembayaran,
  - Hero Landing.
- Topbar dengan search dan user menu.
- Data table dengan:
  - filter kelas,
  - filter periode,
  - filter status,
  - search siswa,
  - bulk actions.
- Dialog untuk create/edit cepat.
- Sheet kanan untuk detail transaksi.

### Visual Direction

- Fresh, ramah sekolah TK, bersih, tidak terlalu formal.
- Gunakan ilustrasi/foto sekolah pada landing jika tersedia.
- Banyak whitespace, radius sedang, shadow tipis.
- Hindari kartu bertumpuk terlalu banyak.
- Ikon dari Lucide React.

## 11. Validation Rules

### Student

- `nis`: required, unique.
- `fullName`: required.
- `classId`: required.
- `gender`: required.
- `status`: required.

### Guardian

- `name`: required.
- `phone`: optional tetapi disarankan unique.
- `email`: optional dan harus valid.

### Invoice

- `studentId`: required.
- `categoryId`: required.
- `amount`: required, numeric, greater than or equal 0.
- `totalAmount`: tidak boleh negatif.
- `periodMonth`: 1-12 untuk tagihan bulanan.
- `periodYear`: wajib untuk tagihan periodik.

### Payment

- `invoiceId`: required.
- `amount`: required, numeric, greater than 0.
- `method`: required.
- `proof`: required untuk metode transfer/e-wallet/QRIS.
- `rejectionReason`: required jika status ditolak.

### Savings Transaction

- `accountId`: required.
- `amount`: required, numeric, greater than 0.
- `type`: required.
- `notes`: required untuk koreksi.
- Penarikan/koreksi keluar tidak boleh melebihi saldo tersedia.

## 12. Milestones

### Milestone 0 - Design Preview / Vibecoding Prep

- Buat folder `web-pembayaran`.
- Buat `PRD.md`.
- Buat prompt desain awal.
- Generate tampilan statis dengan data dummy.
- Review UI landing, parent dashboard, admin dashboard, tagihan, dan tabungan.

### Milestone 1 - Project Setup

- Init Next.js.
- Install Tailwind CSS.
- Install shadcn/ui.
- Setup ESLint/Prettier.
- Setup Prisma.
- Setup database lokal.
- Buat seed data dummy TK Islam Azkia.

### Milestone 2 - UI Prototype

- Landing page.
- Login page.
- Parent dashboard.
- Admin dashboard.
- Halaman tagihan.
- Halaman pembayaran.
- Halaman tabungan.
- Halaman verifikasi.

### Milestone 3 - Auth and Roles

- Login credentials.
- Session.
- Middleware route protection.
- Role menu visibility.
- Permission helper.

### Milestone 4 - Core Billing

- CRUD siswa, wali, kelas.
- CRUD kategori pembayaran.
- Buat tagihan individual/massal.
- Daftar tagihan dan filter.
- Detail tagihan.

### Milestone 5 - Payments

- Upload bukti.
- Status menunggu verifikasi.
- Verifikasi/penolakan.
- Receipt digital.
- Riwayat pembayaran.

### Milestone 6 - Savings

- Akun tabungan otomatis per siswa.
- Setoran.
- Penarikan.
- Mutasi.
- Cetak buku tabungan.

### Milestone 7 - Reports

- Rekap pembayaran.
- Tunggakan.
- Mutasi tabungan.
- Export awal CSV.

## 13. Acceptance Criteria

- Orang tua dapat login dan melihat anaknya.
- Orang tua hanya dapat melihat tagihan dan tabungan anak yang terhubung.
- TU dapat membuat tagihan massal tanpa duplikasi.
- Orang tua dapat upload bukti pembayaran.
- Bendahara dapat menyetujui atau menolak pembayaran.
- Jika pembayaran disetujui, invoice menjadi lunas dan receipt tersedia.
- Jika pembayaran ditolak, alasan tampil ke orang tua.
- TU/bendahara dapat mencatat setoran tabungan.
- TU/bendahara dapat mencatat penarikan jika saldo cukup.
- Saldo tabungan selalu konsisten dengan mutasi.
- Kepala sekolah dapat melihat dashboard tanpa mengubah data transaksi.
- Semua aksi penting tercatat di audit log.

## 14. Status Implementasi Prototype Web Lokal

Tanggal pembaruan: 27 Juni 2026.

Bagian ini mencatat kondisi implementasi aplikasi lokal saat ini agar PRD tetap sinkron dengan kode.

### 14.1 Stack dan Database Saat Ini

- Aplikasi memakai Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, dan Prisma ORM.
- Database lokal pengembangan memakai SQLite melalui Prisma.
- File konfigurasi database memakai `DATABASE_URL="file:./dev.db"`.
- PostgreSQL/MySQL tetap menjadi target yang direkomendasikan untuk fase produksi.
- Seed dummy TK Islam Azkia tersedia di `prisma/seed.ts`.

### 14.2 Auth Demo dan Role

- Login sudah memakai akun demo berbasis database dan cookie session lokal.
- Password demo disimpan sebagai hash sederhana untuk kebutuhan lokal.
- Role yang tersedia:
  - `SUPER_ADMIN`,
  - `TATA_USAHA`,
  - `BENDAHARA`,
  - `ORANG_TUA`.
- Role lain seperti `KEPALA_SEKOLAH` dan `GURU` masih disiapkan di PRD untuk fase lanjutan.

### 14.3 Fitur Admin yang Sudah Berfungsi

- Dashboard admin membaca agregasi dari database.
- CRUD siswa sudah tersedia, termasuk:
  - tambah siswa,
  - ubah siswa,
  - hapus siswa,
  - sinkron akun orang tua.
- CRUD kelas sudah tersedia, termasuk:
  - tambah kelas lewat modal,
  - edit kelas,
  - hapus kelas terpilih oleh checkbox.
- Pengaturan Identitas Sekolah sudah tersimpan ke database dan dipakai di kwitansi/kartu.
- Pengaturan Tarif Pokok sudah tersimpan ke database.
- SPP adalah tarif wajib dan tidak dapat dihapus.
- Tarif pokok tambahan tidak memakai kategori.
- Pengaturan Hero Landing maksimal 5 foto aktif.
- Menu Tagihan sudah mendukung:
  - buat tagihan individual,
  - buat tagihan massal,
  - nomor utama invoice memakai `invoiceNumber`.

### 14.4 Transaksi Tunai

- Transaksi tunai dilakukan dari menu Transaksi.
- Search NIS otomatis mengisi data siswa dan kelas.
- Tanggal bayar memakai format tampilan `dd/mm/yyyy`.
- Nominal uang diterima diinput manual.
- Kembalian dihitung otomatis dari uang diterima dikurangi grand total bayar.
- Informasi pembayaran SPP menggunakan warna:
  - hijau untuk lunas,
  - merah untuk belum bayar,
  - kuning untuk menunggu verifikasi.
- Kekurangan SPP dihitung sebagai tarif SPP aktif dikali 12 bulan dikurangi SPP lunas pada tahun ajaran aktif.
- Satu proses simpan transaksi tunai dapat berisi beberapa item pembayaran.
- Jika nominal SPP lebih dari satu bulan, sistem membagi pembayaran ke bulan SPP yang belum lunas dalam tahun ajaran aktif.
- Kwitansi menampilkan satu nomor utama transaksi/invoice untuk satu kali simpan transaksi, sementara detail baris tetap menampilkan item pembayaran yang dibayar.
- Kwitansi dan kartu pembayaran membaca identitas sekolah dari pengaturan.

### 14.5 Orang Tua dan Upload Bukti

- Orang tua dapat login dan melihat anak yang terhubung.
- Orang tua dapat melihat tagihan anak sendiri.
- Orang tua dapat membuka halaman pembayaran dari tagihan.
- Upload bukti pembayaran sudah menyimpan file ke `public/uploads/proofs`.
- Setelah bukti dikirim:
  - payment dibuat dengan status `MENUNGGU_VERIFIKASI`,
  - invoice berubah menjadi `MENUNGGU_VERIFIKASI`,
  - data bukti masuk ke `payment_proofs`,
  - audit log dibuat,
  - orang tua diarahkan ke riwayat.

### 14.6 Verifikasi dan Laporan

- Bendahara/TU dapat melihat antrean verifikasi pembayaran.
- Pembayaran dapat disetujui atau ditolak.
- Jika disetujui, invoice menjadi `LUNAS` dan receipt dibuat.
- Jika ditolak, alasan penolakan tersimpan.
- Laporan Pembayaran bersifat read-only untuk role operasional.
- SUPER_ADMIN memiliki aksi hapus pembayaran administratif di Laporan Pembayaran.
- Hapus pembayaran oleh SUPER_ADMIN menghapus payment, bukti, dan receipt terkait, lalu mengembalikan status invoice sesuai payment yang tersisa.
- Aksi hapus pembayaran oleh SUPER_ADMIN dicatat di audit log.

### 14.7 Tabungan

- Akun tabungan siswa dibuat saat seed/tambah siswa.
- Menu tabungan admin sudah mendukung setoran dan penarikan dasar.
- Saldo tabungan dihitung dan disimpan dari mutasi ledger.
- Cetak buku tabungan digital dan export tabungan masih menjadi fase lanjutan.

### 14.8 Batasan Fase Saat Ini

- Auth masih demo lokal, belum Auth.js/NextAuth produksi.
- Upload file masih local filesystem, belum object storage.
- Export PDF/XLSX penuh masih fase lanjutan.
- Permission detail untuk `GURU` dan `KEPALA_SEKOLAH` belum lengkap.
- Reset password admin, verifikasi email/WhatsApp, dan audit viewer khusus masih fase lanjutan.
