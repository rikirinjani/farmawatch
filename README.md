# FarmaWatch - Platform Pengawasan Farmasi Indonesia

Platform pelaporan penyalahgunaan obat OTC dan pelanggaran penjualan obat keras oleh pengecer non-apotek di Indonesia.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **AI Tagging**: Claude API + keyword fallback
- **Email**: Resend

## Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [Anthropic](https://console.anthropic.com) untuk Claude API key
- Akun [Resend](https://resend.com) untuk email (opsional, aplikasi tetap berjalan tanpa Resend)

## Setup Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd farmawatch
npm install
```

### 2. Konfigurasi Environment

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi nilai-nilai berikut di `.env.local`:

| Variabel | Deskripsi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (untuk operasi admin) |
| `CLAUDE_API_KEY` | API key Anthropic Claude |
| `RESEND_API_KEY` | API key Resend (opsional) |
| `NEXT_PUBLIC_SITE_URL` | URL situs (default: `http://localhost:3000`) |

### 3. Setup Database Supabase

1. Buka **SQL Editor** di dashboard Supabase
2. Jalankan `supabase/schema.sql` untuk membuat semua tabel, indeks, dan RLS
3. Jalankan `supabase/seed.sql` untuk mengisi data awal (kategori, alasan penolakan)

### 4. Setup Storage Bucket

1. Buka **Storage** di dashboard Supabase
2. Buat bucket baru bernama `ticket-images`
3. Set bucket menjadi **public**
4. Tambahkan policy berikut di tab Policies:
   - **SELECT**: `bucket_id = 'ticket-images'` (untuk role `authenticated` dan `anon`)
   - **INSERT**: `bucket_id = 'ticket-images'` (untuk semua role)

### 5. Buat Akun Superadmin

1. Buka **Authentication → Users** di Supabase
2. Klik **Add User**, isi email dan password
3. Setelah user dibuat, buka SQL Editor dan jalankan:

```sql
UPDATE profiles
SET role = 'superadmin', status = 'approved'
WHERE id = '<UUID-USER>';
```

Ganti `<UUID-USER>` dengan UUID pengguna yang baru dibuat.

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di Vercel
3. Tambahkan semua environment variables di dashboard Vercel
4. Deploy

## Struktur Proyek

```
farmawatch/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (AI tagging)
│   │   ├── admin/              # Admin panel pages
│   │   ├── dasbor/             # Dashboard page
│   │   ├── daftar/             # Registration page
│   │   ├── laporkan/           # Ticket submission page
│   │   ├── masuk/              # Login page
│   │   └── tiket/[id]/         # Ticket detail page
│   ├── components/             # Shared components
│   │   ├── layout/             # Navbar, Footer
│   │   └── ui/                 # ConfirmDialog, etc.
│   ├── lib/                    # Libraries & utilities
│   │   ├── supabase/           # Supabase clients
│   │   ├── ai-tagging.ts       # Claude API + keyword fallback
│   │   ├── email.ts            # Resend email notifications
│   │   ├── indonesia-data.ts   # Province + city data
│   │   └── utils.ts            # Helpers
│   ├── types/                  # TypeScript types
│   └── middleware.ts           # Route protection
├── supabase/
│   ├── schema.sql              # Database schema + RLS
│   └── seed.sql                # Initial data
├── .env.example
└── package.json
```

## Fitur

- **Laporan Anonim & Terdaftar**: Kirim laporan dengan atau tanpa akun
- **Upload Gambar**: Drag-and-drop, maks 3 gambar (8 MB, JPG/PNG/WEBP)
- **AI Auto-Tagging**: Claude API untuk analisis otomatis, fallback ke kata kunci
- **Dasbor Analitik**: KPI, grafik, peta sebaran, drill-down provinsi/kota
- **Manajemen Tiket**: Alur Submitted → Accepted → Review → Resolved, atau Rejected
- **Manajemen Pengguna**: Setujui/tolak pendaftaran, promosikan ke admin
- **Pengaturan Platform**: Kelola kategori laporan dan alasan penolakan
- **Ekspor Data**: Unduh data tiket sebagai Excel (.xlsx)
- **Notifikasi Email**: Kirim email saat tiket diterima, ditolak, atau selesai
- **Row Level Security**: Keamanan tingkat database via Supabase RLS
