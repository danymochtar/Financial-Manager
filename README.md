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
- Prisma + SQLite (local file)
- NextAuth v5 (Credentials + bcryptjs)
- `@anthropic-ai/sdk` (Claude Vision untuk OCR)
- `exchange` rates dari frankfurter.app (cache harian di tabel `FxRate`)

## Setup

```bash
# 1. Install deps
pnpm install

# 2. Env
cp .env.example .env
# isi:
#   NEXTAUTH_SECRET (generate: openssl rand -base64 32)
#   ANTHROPIC_API_KEY (dari https://console.anthropic.com)

# 3. Inisialisasi DB
pnpm db:migrate     # pertama kali
# atau untuk apply existing migrations di environment baru:
# pnpm db:deploy

# 4. Run
pnpm dev            # http://localhost:3000
```

Buka browser, klik **Register**, bikin akun — default kategori & source (Kerjaan Malaysia, Project Indonesia, Pribadi) auto-provisioned.

## Environment Variables

| Name | Required | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `file:./dev.db` | Path SQLite (relative ke `prisma/`) |
| `NEXTAUTH_SECRET` | ✅ | — | Secret buat JWT session |
| `NEXTAUTH_URL` | — | `http://localhost:3000` | Base URL (diperlukan di prod) |
| `ANTHROPIC_API_KEY` | ✅ | — | API key untuk Claude Vision OCR |
| `ANTHROPIC_VISION_MODEL` | — | `claude-sonnet-4-6` | Model vision (upgrade ke `claude-opus-4-7` kalau akurasi kurang) |
| `STORAGE_DIR` | — | `./storage` | Folder buat simpen gambar receipt |

## Struktur

```
src/
├── app/
│   ├── (auth)/              # login & register
│   ├── (app)/               # dashboard + semua fitur (protected)
│   │   ├── page.tsx         # dashboard
│   │   ├── transactions/
│   │   ├── receipts/
│   │   ├── budgets/
│   │   ├── recurring/
│   │   ├── reports/
│   │   ├── categories/
│   │   ├── sources/
│   │   └── settings/
│   ├── api/                 # semua route API
│   ├── manifest.ts          # PWA manifest
│   └── layout.tsx
├── components/              # AppShell, ReceiptUploader, Charts, TransactionForm, Toast, dll
├── lib/
│   ├── db.ts                # Prisma client singleton
│   ├── auth.ts              # NextAuth config
│   ├── fx.ts                # FX rate fetch + cache (frankfurter fallback exchangerate.host)
│   ├── currency.ts          # format + sumInBase helpers
│   ├── ocr.ts               # Claude Vision -> ReceiptDraft
│   ├── categories.ts        # default seed + keyword-based suggestCategoryName
│   ├── storage.ts           # saveReceiptImage / readReceiptImage ke disk lokal
│   ├── recurring.ts         # computeNextDue + runDueRecurrings
│   └── export.ts            # CSV / XLSX
└── middleware.ts            # gate all routes via NextAuth
```

## Verification (end-to-end)

1. **Register & login** — daftar akun baru, pastiin default kategori (Makan, Transport, Gaji, dll) & source (Kerjaan MY / Project ID / Pribadi) muncul.
2. **Transaksi manual** — add income MYR 5000 (Kerjaan Malaysia, Gaji). Cek detail transaksi: `amount=5000 MYR`, `amountIDR ≈ 17.000.000`, `amountMYR=5000`.
3. **Receipt OCR** — buka `/receipts`, upload foto struk Indomaret / 7-Eleven nyata. Draft muncul dengan merchant, total, kategori suggestion. Klik **Confirm** → transaksi ter-create & link ke receipt.
4. **Dashboard** — toggle IDR / MYR / Both. Grafik monthly, breakdown kategori & source harus konsisten.
5. **Budget** — set budget "Makan & Minum" MYR 800. Tambah beberapa expense → progress bar gerak, badge warning ≥80%.
6. **Recurring** — bikin recurring gaji monthly dayOfMonth=25, set `nextDueDate` ke kemarin, klik **Run due sekarang** → transaksi auto ter-create.
7. **Export** — klik CSV / XLSX di page Reports → file download, kolom lengkap.
8. **PWA** — buka di HP Chrome, tap "Add to Home Screen", buka dari icon, upload receipt via kamera.
9. **Multi-user isolation** — register user kedua, verify gak bisa liat data user pertama.

## Catatan

- **FX**: Rate di-fetch saat transaksi di-create, disimpen di kolom `amountIDR` & `amountMYR` per transaksi (tidak recompute). Kalau mau refresh snapshot historis, bisa ditambah job re-compute nanti.
- **OCR cost**: Setiap upload receipt = 1 call ke Claude Vision. Image di-encode base64 ke request. Model default `claude-sonnet-4-6` murah & akurat untuk receipt campur Bahasa Indonesia / Malay / English.
- **Recurring**: Di-trigger opportunistically setiap user buka app shell (`src/app/(app)/layout.tsx`) + manual via tombol. Kalau mau cron beneran, bisa pasang di OS / Vercel cron / pm2.
- **Security**: SQLite lokal + file-based. Jangan commit `.env` atau `storage/`. Untuk deploy multi-user, pertimbangin migrate ke Postgres + S3.
- **PWA icons**: File di `public/icons/` sekarang cuma placeholder 1×1 px. Replace dengan icon proper (192×192 & 512×512) untuk production.
