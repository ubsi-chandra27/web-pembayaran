# Deployment dan Operasional

Panduan ini adalah checklist awal agar aplikasi Web Pembayaran dan Tabungan TK Islam Azkia lebih siap dipindahkan dari lokal ke server.

## Environment

- Salin `.env.example` menjadi `.env`.
- Untuk lokal demo, `DATABASE_URL="file:./dev.db"` masih cukup.
- Untuk produksi, set `APP_MODE="production"` dan `ALLOW_DEMO_DEFAULTS="false"` agar akun baru tidak memakai password demo otomatis dan reset demo dimatikan.
- Untuk produksi, pindahkan ke PostgreSQL/MySQL dan gunakan URL database produksi.
- Isi `NEXT_PUBLIC_APP_URL` agar link WhatsApp mengarah ke domain portal yang benar.
- Isi `STORAGE_DRIVER` sesuai storage bukti pembayaran.
- Jalankan readiness checker sebelum deploy:

```powershell
npm.cmd run prod:check
```

Checker ini tidak menampilkan nilai secret. Jika masih ada `[FAIL]`, perbaiki `.env` hosting sebelum menjalankan build/start production.

Contoh `.env` production PostgreSQL:

```env
APP_MODE="production"
ALLOW_DEMO_DEFAULTS="false"
NEXT_PUBLIC_APP_URL="https://domain-sekolah.sch.id"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/web_pembayaran?schema=public"
STORAGE_DRIVER="cloud-http"
STORAGE_UPLOAD_ENDPOINT="https://storage.example.com/private/proofs"
STORAGE_PUBLIC_BASE_URL="https://storage.example.com/private/proofs"
STORAGE_UPLOAD_TOKEN="TOKEN_UPLOAD"
SUPER_ADMIN_EMAIL="admin@domain-sekolah.sch.id"
SUPER_ADMIN_PASSWORD="password-kuat-minimal-12-karakter"
SUPER_ADMIN_NAME="Super Admin"
SPP_AMOUNT="150000"
```

Contoh `.env` production MySQL/MariaDB:

```env
APP_MODE="production"
ALLOW_DEMO_DEFAULTS="false"
NEXT_PUBLIC_APP_URL="https://domain-sekolah.sch.id"
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/web_pembayaran"
STORAGE_DRIVER="local-private"
SUPER_ADMIN_EMAIL="admin@domain-sekolah.sch.id"
SUPER_ADMIN_PASSWORD="password-kuat-minimal-12-karakter"
SUPER_ADMIN_NAME="Super Admin"
SPP_AMOUNT="150000"
```

## Database

- Jalankan `npm.cmd run prisma:generate` setelah perubahan schema.
- Untuk demo SQLite, backup tersedia dari menu `Admin > Backup Data`.
- Untuk restore SQLite lokal, matikan dev server, ganti `prisma/dev.db` dengan file backup, lalu jalankan server kembali.
- Untuk produksi PostgreSQL:

```powershell
copy .env.example .env
# Ubah DATABASE_URL menjadi postgresql://...
# Isi SUPER_ADMIN_EMAIL dan SUPER_ADMIN_PASSWORD
npm.cmd run prisma:generate:postgres
npm.cmd run prisma:push:postgres
npm.cmd run db:seed:postgres
npm.cmd run prod:check
```

- Untuk produksi MySQL/MariaDB:

```powershell
copy .env.example .env
# Ubah DATABASE_URL menjadi mysql://...
# Isi SUPER_ADMIN_EMAIL dan SUPER_ADMIN_PASSWORD
npm.cmd run prisma:generate:mysql
npm.cmd run prisma:push:mysql
npm.cmd run db:seed:mysql
npm.cmd run prod:check
```

- Pada `APP_MODE=production`, seed tidak mengisi dummy siswa/tagihan. Seed hanya membuat bootstrap minimal: Super Admin, identitas awal, tahun ajaran aktif, dan SPP. Dummy penuh hanya berjalan bila sengaja mengatur `SEED_DEMO_DATA="true"`.
- Setelah go-live, gunakan backup database terjadwal dari provider/server. Jangan mengandalkan file SQLite untuk produksi.

## Build

```powershell
npm.cmd run prod:check
npm.cmd run lint
npm.cmd run test:smoke
npm.cmd run build
```

CI GitHub Actions dapat ditambahkan setelah token GitHub memiliki scope `workflow`.

## Upload Bukti

- Development menyimpan file baru di `storage/uploads/proofs`.
- Bukti pembayaran dibuka melalui route terproteksi `/api/proofs/[fileName]`, bukan direct public folder.
- `STORAGE_DRIVER="local-private"` cocok untuk VPS/server tunggal.
- `STORAGE_DRIVER="cloud-http"` memakai `PUT` ke `STORAGE_UPLOAD_ENDPOINT` dan menyimpan URL dari `STORAGE_PUBLIC_BASE_URL`. Gunakan token via `STORAGE_UPLOAD_TOKEN` bila endpoint membutuhkannya.
- Produksi ideal memakai private object storage seperti S3, Cloudflare R2, Supabase Storage, atau storage internal dengan proteksi akses. Adapter `cloud-http` adalah lapisan awal agar upload tidak terkunci ke filesystem lokal.

## Keamanan

- Auth saat ini sudah memakai hash PBKDF2 untuk password baru dan masih kompatibel dengan hash demo lama.
- Login memiliki rate limit in-memory per IP dan kontak login. Untuk multi-server production, pindahkan rate limit ke Redis/KV agar konsisten antar instance.
- Endpoint `/api/health` tersedia untuk monitoring uptime dan cek koneksi database.
- `/api/health` juga menampilkan ringkasan readiness konfigurasi tanpa membocorkan nilai secret.
- Produksi tetap direkomendasikan memakai Auth.js/NextAuth atau auth service lain dengan session management lebih lengkap.
- Super Admin wajib rutin mengecek `Audit Log`.

## Go-Live Checklist

- `APP_MODE=production`.
- `ALLOW_DEMO_DEFAULTS=false`.
- `DATABASE_URL` memakai PostgreSQL atau MySQL/MariaDB, bukan `file:./dev.db`.
- `NEXT_PUBLIC_APP_URL` memakai domain sekolah.
- `SUPER_ADMIN_EMAIL` dan `SUPER_ADMIN_PASSWORD` sudah diisi sebelum seed pertama.
- `SEED_DEMO_DATA` tidak diset `true`.
- `npm.cmd run prod:check` tidak punya `[FAIL]`.
- `npm.cmd run build` berhasil.
- Buka `https://domain-sekolah.sch.id/api/health` dan pastikan `database.status` bernilai `ok`.
- Login Super Admin berhasil, lalu ganti password jika password bootstrap masih sementara.

## PWA / Android

- Aplikasi sudah memiliki manifest PWA dasar.
- Untuk APK Android, opsi berikutnya adalah membungkus PWA memakai TWA atau Capacitor.
