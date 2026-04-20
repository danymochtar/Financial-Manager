# Financial Manager

Personal finance tracker buat track **duit masuk & keluar lintas dua negara** — kerjaan di Malaysia (MYR) dan project pribadi di Indonesia (IDR). Signature feature: upload foto receipt → OCR via **Claude Vision** → auto-fill transaksi (merchant, tanggal, total, kategori suggestion).

## Fitur

- **Core**: CRUD transaksi income/expense, source (Kerjaan MY / Project ID / Pribadi), kategori.
- **Receipt OCR**: Upload foto struk, Claude Vision extract structured JSON (merchant, date, total, items, kategori hint), user confirm → jadi transaksi.
- **Dual-base currency**: Setiap transaksi disimpen di currency asli + snapshot FX ke **IDR & MYR** (dari frankfurter.app). Dashboard bisa di-toggle IDR / MYR / Both.
- **Dashboard & reports**: Income vs expense per bulan, breakdown per kategori & per source, filter periode.
- **Budget bulanan**: Set budget per kategori per currency, progress bar, warning kalau >80%.
- **Recurring**: Gaji & subscription otomatis ter-materialize saat jatuh tempo (monthly/weekly).
- **Export**: CSV & XLSX.
- **Multi-user**: NextAuth (email + password), semua data scoped per userId.
- **PWA**: Installable di HP Chrome, langsung buka kamera buat capture struk.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Recharts + lucide-react
- Prisma + **PostgreSQL (Neon)**
- **Vercel Blob** untuk receipt image storage
- NextAuth v5 (Credentials + bcryptjs)
- `@anthropic-ai/sdk` (Claude Vision untuk OCR)
- FX rates dari frankfurter.app (cache harian di tabel `FxRate`)

## Deploy ke Vercel (recommended)

### 1. Setup Neon (Postgres)

1. Daftar di https://neon.tech (free).
2. Bikin project baru.
3. Di dashboard → **Connection string** → copy:
   - **Pooled connection** → taruh di `DATABASE_URL` di Vercel env
   - **Direct connection** → taruh di `DIRECT_URL` di Vercel env (dipake Prisma migrate)

### 2. Setup Vercel + Blob

1. Push repo ini ke GitHub.
2. Import project di https://vercel.com/new.
3. Di project Vercel → **Storage** tab → **Create** → **Blob** → Connect. `BLOB_READ_WRITE_TOKEN` auto-inject ke env.
4. Di project Vercel → **Settings** → **Environment Variables**, tambahin:
   - `DATABASE_URL` (dari Neon, pooled)
   - `DIRECT_URL` (dari Neon, direct)
   - `NEXTAUTH_SECRET` — generate: `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `https://<your-app>.vercel.app`
   - `ANTHROPIC_API_KEY` — dari https://console.anthropic.com
   - `ANTHROPIC_VISION_MODEL` (optional) — default `claude-sonnet-4-6`
5. Deploy. Build command udah disetting `prisma generate && next build`.

### 3. Run migrations ke Neon

Sekali doang, dari laptop:

```bash
cp .env.example .env.local
# isi DATABASE_URL + DIRECT_URL dari Neon (plus NEXTAUTH_SECRET dummy biar gak error)
pnpm install
pnpm prisma migrate deploy        # kalau migrations sudah ada
# atau pertama kali:
pnpm prisma migrate dev --name init
```

Selanjutnya tiap push ke GitHub, Vercel auto-deploy. Kalau ada schema change, bikin migration baru lokal (`prisma migrate dev`), commit, push — Vercel build akan `prisma generate` otomatis, tapi `migrate deploy` harus dijalanin manual (atau taruh di build hook).

### 4. Post-deploy sanity check

- Buka `https://<app>.vercel.app/register` → daftar akun → default kategori & source terprovision.
- Upload receipt → gambar tersimpan di Vercel Blob, di-OCR → draft muncul.

---

## Local development

```bash
# 1. Install
pnpm install

# 2. Env
cp .env.example .env.local
# isi dengan credentials lokal / Neon dev branch
#  - DATABASE_URL + DIRECT_URL (Neon dev branch atau local postgres docker)
#  - NEXTAUTH_SECRET (random 32-byte)
#  - ANTHROPIC_API_KEY
#  - BLOB_READ_WRITE_TOKEN (generate di Vercel dashboard)

# 3. Migrate
pnpm prisma migrate dev --name init

# 4. Run
pnpm dev          # http://localhost:3000
```

Local Postgres (alternatif Neon dev branch):
```bash
docker run --name fm-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
# DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

## Environment Variables

| Name | Required | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Postgres URL (Neon). Dipake app runtime. |
| `DIRECT_URL` | ✅ | Direct Postgres URL (Neon). Dipake `prisma migrate`. |
| `NEXTAUTH_SECRET` | ✅ | Secret JWT. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ (prod) | `https://<app>.vercel.app` di prod. |
| `ANTHROPIC_API_KEY` | ✅ | API key Claude Vision. |
| `ANTHROPIC_VISION_MODEL` | — | Default `claude-sonnet-4-6`. |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob token (auto-inject kalau Blob linked di project). |

## Struktur

```
src/
├── app/
│   ├── (auth)/              # login & register
│   ├── (app)/               # dashboard + semua fitur (protected)
│   ├── api/                 # semua route API
│   ├── manifest.ts          # PWA manifest
│   └── layout.tsx
├── components/              # AppShell, ReceiptUploader, Charts, TransactionForm, Toast
├── lib/
│   ├── db.ts                # Prisma client singleton
│   ├── auth.config.ts       # edge-safe NextAuth config (dipake middleware)
│   ├── auth.ts              # NextAuth server-side (+ bcrypt / Prisma)
│   ├── fx.ts                # FX rate fetch + cache (frankfurter fallback exchangerate.host)
│   ├── currency.ts          # format + sumInBase helpers
│   ├── ocr.ts               # Claude Vision -> ReceiptDraft
│   ├── categories.ts        # default seed + keyword-based suggestCategoryName
│   ├── storage.ts           # saveReceiptImage / readReceiptImage via Vercel Blob
│   ├── recurring.ts         # computeNextDue + runDueRecurrings
│   └── export.ts            # CSV / XLSX
└── middleware.ts            # edge auth gate
```

## Verification (end-to-end)

1. **Register & login** — daftar akun baru, default kategori & source harus muncul.
2. **Transaksi manual** — add income MYR 5000 (Kerjaan Malaysia, Gaji). Cek `amount=5000 MYR`, `amountIDR ≈ 17M`, `amountMYR=5000`.
3. **Receipt OCR** — upload foto struk nyata. Draft muncul dengan merchant/total/kategori suggestion. Confirm → transaksi ter-create + linked ke receipt (gambar tersimpan di Vercel Blob).
4. **Dashboard** — toggle IDR / MYR / Both.
5. **Budget** — set budget MYR 800 Makan, progress bar gerak, warning ≥80%.
6. **Recurring** — bikin gaji monthly dayOfMonth=25, set `nextDueDate` ke kemarin, klik **Run due sekarang** → auto ter-create.
7. **Export** — CSV / XLSX di `/reports`.
8. **PWA** — buka di HP Chrome, Add to Home Screen, upload via kamera.
9. **Multi-user isolation** — user kedua gak bisa liat data user pertama.

## Catatan penting

- **Migrasi database**: Vercel build **tidak** run `prisma migrate deploy` otomatis. Kalau bikin schema baru, jalanin lokal: `pnpm prisma migrate dev --name <nama>` lalu commit migration files + deploy. Atau tambahin `prisma migrate deploy &&` di `build` script di `package.json` kalau mau full auto.
- **Blob privacy**: Vercel Blob URL public by default, tapi filename-nya random hex — URL gak bocor kecuali via proxy auth-gated `/api/receipts/[id]/image`. Mau full private? Pakai S3 + signed URLs.
- **FX snapshot**: Rate di-fetch saat transaksi di-create & disimpen permanent di `amountIDR/amountMYR`. Gak ada recompute ulang otomatis.
- **Recurring trigger**: Fire-and-forget saat user buka app shell. Di Vercel serverless, kalau request response balik sebelum promise selesai, bisa ke-kill — gak masalah, runner idempotent & jalan lagi next page load. Mau cron beneran? Pakai Vercel Cron → `POST /api/recurring/run` per user.
- **PWA icons**: File di `public/icons/` masih placeholder 1×1 px. Ganti dengan icon proper (192×192 & 512×512) sebelum produksi.
