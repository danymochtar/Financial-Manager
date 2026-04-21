"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "id" | "en";

const STORAGE_KEY = "sbl_locale";

/**
 * Dictionary format: key -> { id, en }. Missing translations fall back
 * to ID (the app's native language). Keys are dot-separated by area.
 */
export const TR: Record<string, { id: string; en: string }> = {
  // Brand
  "brand.name": { id: "Seberapa Boros Lo?", en: "How Wasteful Are You?" },
  "brand.tagline": { id: "Catet keborosan, sadar, nabung.", en: "Log overspending. Get real. Save up." },

  // Generic
  "hi": { id: "Halo", en: "Hi" },
  "save": { id: "Simpan", en: "Save" },
  "cancel": { id: "Batal", en: "Cancel" },
  "delete": { id: "Hapus", en: "Delete" },
  "edit": { id: "Edit", en: "Edit" },
  "back": { id: "Balik", en: "Back" },
  "next": { id: "Lanjut", en: "Next" },
  "skip": { id: "Skip", en: "Skip" },
  "add": { id: "Tambah", en: "Add" },
  "confirm": { id: "Konfirm", en: "Confirm" },
  "loading": { id: "Loading...", en: "Loading..." },
  "saving": { id: "Nyimpen...", en: "Saving..." },
  "submit": { id: "Kirim", en: "Submit" },
  "close": { id: "Tutup", en: "Close" },
  "retry": { id: "Coba lagi", en: "Retry" },
  "logout": { id: "Keluar", en: "Log out" },
  "settings.link": { id: "Setting", en: "Settings" },

  // Nav
  "nav.home": { id: "Home", en: "Home" },
  "nav.akun": { id: "Akun", en: "Accounts" },
  "nav.catat": { id: "Catat", en: "Capture" },
  "nav.dukun": { id: "Dukun", en: "Oracle" },
  "nav.stats": { id: "Stats", en: "Stats" },

  // Auth
  "auth.email": { id: "Email", en: "Email" },
  "auth.password": { id: "Password", en: "Password" },
  "auth.name": { id: "Panggilan", en: "What should we call you?" },
  "auth.namePlaceholder": { id: "Namamu (yg lo mau dipanggil)", en: "Your preferred name" },
  "auth.loginTitle": { id: "Masuk", en: "Log in" },
  "auth.loggingIn": { id: "Login...", en: "Logging in..." },
  "auth.registerTitle": { id: "Bikin Akun", en: "Create Account" },
  "auth.noAccount": { id: "Belum punya akun?", en: "No account yet?" },
  "auth.hasAccount": { id: "Udah punya akun?", en: "Already have an account?" },
  "auth.register": { id: "Bikin akun", en: "Create account" },
  "auth.login": { id: "Masuk", en: "Log in" },
  "auth.invalid": { id: "Email atau password-nya salah bestie.", en: "Wrong email or password." },
  "auth.passwordMin": { id: "Minimal 6 karakter.", en: "Minimum 6 characters." },
  "auth.currencyDefault": { id: "Currency default", en: "Default currency" },

  // Dashboard
  "dash.today": { id: "Hari ini", en: "Today" },
  "dash.boros.today": { id: "Hari Ini", en: "Today" },
  "dash.boros.week": { id: "Minggu ini", en: "This week" },
  "dash.boros.month": { id: "Bulan ini", en: "This month" },
  "dash.borosTitle": { id: "Seberapa Boros Lo?", en: "How wasteful?" },
  "dash.borosNoLimit": { id: "Set target dulu di /budget 👆", en: "Set a target in /budget first 👆" },
  "dash.borosCrazy": { id: "🔥 LO GILA BOROS BET", en: "🔥 You're burning cash" },
  "dash.borosOver": { id: "⚠️ Lewat budget, rem dong", en: "⚠️ Over budget, slow down" },
  "dash.borosAlmost": { id: "Hati-hati, tinggal dikit", en: "Careful, not much left" },
  "dash.borosOk": { id: "Santai, masih aman", en: "Chill, still safe" },
  "dash.borosGood": { id: "Mantap, hemat 🎉", en: "Nice, saving well 🎉" },
  "dash.borosSubtitle": { id: "Variable expense lo", en: "Your variable spending" },
  "dash.netWorth": { id: "Net Worth", en: "Net Worth" },
  "dash.viewAccounts": { id: "Lihat akun →", en: "View accounts →" },
  "dash.asset": { id: "Aset", en: "Assets" },
  "dash.debt": { id: "Hutang", en: "Debts" },
  "dash.fixedLoad": { id: "Beban Fix Bulanan", en: "Monthly Fixed Load" },
  "dash.adjust": { id: "Atur →", en: "Manage →" },
  "dash.fixedIncome": { id: "Income fix", en: "Fixed income" },
  "dash.fixedExpense": { id: "Expense fix", en: "Fixed expense" },
  "dash.recentTx": { id: "Transaksi Terakhir", en: "Recent Transactions" },
  "dash.seeAll": { id: "Liat semua →", en: "See all →" },
  "dash.emptyTx": { id: "Belum ada transaksi. Tap tombol kamera di bawah 👇", en: "No transactions yet. Tap the camera below 👇" },
  "dash.streak": { id: "Hemat Streak", en: "Saving Streak" },
  "dash.streakDays": { id: "hari", en: "days" },
  "dash.best": { id: "Best", en: "Best" },
  "dash.dukunCta.title": { id: "Tanya Dukun Duit", en: "Ask Money Oracle" },
  "dash.dukunCta.question": { id: "\"Realistis gak nabung Brio 2 tahun?\"", en: "\"Can I afford that car in 2 years?\"" },
  "dash.dukunCta.sub": { id: "AI advisor baca semua data lo · 1 tap", en: "AI advisor reads all your data · 1 tap" },

  // Onboarding
  "onb.welcomeTitle": { id: "Halo", en: "Hi" },
  "onb.welcomeBody": {
    id: "Gw bakal bantuin lo sadar seberapa boros kebiasaan lo, biar pelan-pelan bisa lebih hemat dan nabung. Singkat aja — skip step yang ga relevan buat lo.",
    en: "I'll help you see how much you're overspending, so you can slowly save more. Keep it quick — skip steps that don't apply.",
  },
  "onb.welcomeAccounts": { id: "🏦 Input saldo rekening & e-wallet", en: "🏦 Enter bank & e-wallet balances" },
  "onb.welcomeCC": { id: "💳 Kartu kredit (limit + tagihan)", en: "💳 Credit cards (limit + balance)" },
  "onb.welcomeIncome": { id: "💰 Penghasilan fix", en: "💰 Fixed income" },
  "onb.welcomeFixedExpense": { id: "🏠 Pengeluaran fix bulanan", en: "🏠 Monthly fixed expenses" },
  "onb.welcomeDebts": { id: "⛓️ Cicilan / hutang", en: "⛓️ Installments / debt" },
  "onb.welcomeDependents": { id: "👪 Tanggungan (kalau generasi sandwich)", en: "👪 Dependents (if sandwich gen)" },
  "onb.welcomeBudget": { id: "🎯 Set target budget harian/mingguan/bulanan", en: "🎯 Set daily / weekly / monthly budget" },
  "onb.welcomeNote": { id: "Bisa di-update kapan aja nanti di setting.", en: "You can update anytime in settings." },
  "onb.stepAccounts": { id: "Rekening Lo", en: "Your Accounts" },
  "onb.stepCC": { id: "Kartu Kredit", en: "Credit Cards" },
  "onb.stepIncome": { id: "Penghasilan", en: "Income" },
  "onb.stepFixedExpense": { id: "Pengeluaran Fix", en: "Fixed Expenses" },
  "onb.stepDebts": { id: "Cicilan", en: "Installments" },
  "onb.stepDependents": { id: "Tanggungan", en: "Dependents" },
  "onb.stepBudget": { id: "Target Boros", en: "Spend Target" },
  "onb.stepDone": { id: "Siap!", en: "Ready!" },
  "onb.gas": { id: "Gas", en: "Let's go" },
  "onb.start": { id: "Mulai Catat 🚀", en: "Start Tracking 🚀" },

  // Wajib
  "wajib.title": { id: "Wajib Bulanan", en: "Monthly Essentials" },
  "wajib.desc": {
    id: "Income, fix expense, cicilan, tanggungan, investasi, & target goals.",
    en: "Income, fixed expenses, debts, dependents, investments, & life goals.",
  },
  "wajib.tab.expense": { id: "Expense Fix", en: "Fixed Expense" },
  "wajib.tab.income": { id: "Income", en: "Income" },
  "wajib.tab.debt": { id: "Cicilan", en: "Debts" },
  "wajib.tab.dependent": { id: "Tanggungan", en: "Dependents" },
  "wajib.tab.investment": { id: "Investasi", en: "Investments" },
  "wajib.tab.goal": { id: "Target 🎯", en: "Goals 🎯" },
  "wajib.addBtn": { id: "Tambah", en: "Add" },
  "wajib.noItems": { id: "Belum ada.", en: "Nothing yet." },
  "wajib.template": { id: "Template cepet", en: "Quick template" },
  "wajib.templateLife": { id: "Template target hidup", en: "Life goal templates" },

  // Dukun
  "dukun.title": { id: "Dukun Duit 🧙", en: "Money Oracle 🧙" },
  "dukun.desc": {
    id: "AI financial advisor. Tanya apa aja — dari safety net, plan nabung, sampe strategi lunasin hutang.",
    en: "AI financial advisor. Ask anything — safety net, savings plan, debt payoff strategy.",
  },
  "dukun.greet": {
    id: "Assalamu'alaikum, gw **Dukun Duit** 🧙. Tanyain apa aja soal keuangan lo — gw baca snapshot lo yg paling update. Mulai dari quick action di atas, atau ngetik pertanyaan di bawah.",
    en: "Hey, I'm the **Money Oracle** 🧙. Ask anything about your finances — I read your latest snapshot. Try a quick action above or type a question below.",
  },
  "dukun.thinking": { id: "Dukun lagi meditasi...", en: "Oracle is thinking..." },
  "dukun.placeholder": {
    id: "Tanya apa aja... (misal: kalo mau nabung Brio bekas 120jt dalam 2 tahun realistis gak?)",
    en: "Ask anything... (e.g. Can I afford a used car in 2 years?)",
  },
  "dukun.clear": { id: "Bersihin chat", en: "Clear chat" },
  "dukun.disclaimer": {
    id: "Saran dari Dukun bukan advice finansial profesional. Pake sebagai starting point, verify sebelum decide besar.",
    en: "Oracle advice is not a replacement for professional financial advice. Use as a starting point, verify before big decisions.",
  },
  "dukun.snapshotLabel": { id: "Snapshot Lo", en: "Your Snapshot" },
  "dukun.freeCash": { id: "Free Cash/bln", en: "Free cash/mo" },
  "dukun.investment": { id: "Investasi", en: "Investments" },
  "dukun.activeGoals": { id: "target aktif", en: "active goals" },
  "dukun.qa.analyze": { id: "Analisa Keuangan Gw", en: "Analyze My Finances" },
  "dukun.qa.safety": { id: "Safety Net / Dana Darurat", en: "Safety Net / Emergency Fund" },
  "dukun.qa.savings": { id: "Plan Nabung Goal", en: "Savings Plan for Goals" },
  "dukun.qa.reduce": { id: "Kurangin Boros Gw", en: "Reduce My Overspending" },
  "dukun.qa.debt": { id: "Strategi Lunasin Hutang", en: "Debt Payoff Strategy" },
  "dukun.prompt.analyze": {
    id: "Analisa kondisi keuangan gw sekarang. Kasih tau apakah lo anggap healthy, at-risk, atau bahaya, + reasoning-nya. Sebut angka-angka kunci (income, fix expense, free cash flow, debt ratio, dll). Akhiri dengan 3 step konkret yg bisa gw lakuin minggu ini.",
    en: "Analyze my current finances. Tell me if it's healthy, at-risk, or dangerous, with reasoning. Mention key numbers (income, fixed expense, free cash flow, debt ratio). End with 3 concrete steps I can take this week.",
  },
  "dukun.prompt.safety": {
    id: "Hitung idealnya gw punya dana darurat berapa berdasarkan situasi gw (sandwich gen, income fix + variable, dll). Bandingin sama aset likuid gw sekarang — cukup atau belom? Kalo belom, berapa bulan gw harus nabung buat capai target? Kasih plan step-by-step.",
    en: "Calculate my ideal emergency fund based on my situation (sandwich gen, fixed + variable income). Compare with my current liquid assets — enough or not? If not, how many months to reach the target? Give me a step-by-step plan.",
  },
  "dukun.prompt.savings": {
    id: "Liat goals gw yg aktif di snapshot. Buat plan nabung bulanan buat masing-masing goal, urutkan prioritas (high dulu). Kalau goal-nya gak realistis dengan free cash flow gw sekarang, kasih tau + kasih saran (extend timeline, naikin income, atau potong expense mana).",
    en: "Look at my active goals in the snapshot. Build a monthly savings plan for each, ordered by priority (high first). If any goal is unrealistic given my free cash flow, say so and suggest fixes (extend timeline, raise income, cut which expense).",
  },
  "dukun.prompt.reduce": {
    id: "Liat variable expense gw 30 hari terakhir di snapshot. Tunjukin kategori mana yg paling boros, bandingkan sama benchmark ideal (misal makan luar idealnya <15% income, hiburan <5%, dll). Kasih target hemat realistis di tiap kategori + efek total penghematan per bulan kalo gw nurut.",
    en: "Look at my variable expenses in the last 30 days. Show which categories are most wasteful, compared to ideal benchmarks (e.g. eating out ideally <15% of income, entertainment <5%). Give realistic saving targets per category and the total monthly saving if I follow them.",
  },
  "dukun.prompt.debt": {
    id: "Liat cicilan & hutang CC gw. Rekomendasikan strategi avalanche (bayar yg bunga tertinggi dulu) atau snowball (yg sisa terkecil dulu) — pilih yg cocok buat psikologis gw. Tunjukin timeline lunas kalo ikutin strategi lo, + berapa bunga yg bisa dihemat.",
    en: "Look at my installments and CC debt. Recommend avalanche (highest interest first) or snowball (smallest remaining first) strategy — pick what fits me psychologically. Show payoff timeline if I follow your strategy, and interest saved.",
  },

  // Setting
  "setting.title": { id: "Setting", en: "Settings" },
  "setting.name": { id: "Nama", en: "Name" },
  "setting.language": { id: "Bahasa", en: "Language" },
  "setting.currencyDefault": { id: "Currency default", en: "Default currency" },
  "setting.saved": { id: "Tersimpan", en: "Saved" },

  // Catat
  "catat.title": { id: "Catat Keborosan 📸", en: "Capture Spending 📸" },
  "catat.desc": {
    id: "Foto struk langsung dari kamera. Bisa banyak sekaligus — tap tombol \"Ambil lagi\" sampe puas.",
    en: "Shoot receipts straight from camera. Multi-capture supported.",
  },
  "catat.takePhoto": { id: "Ambil Foto Struk", en: "Capture Receipt" },
  "catat.hint": {
    id: "Kamera bakal kebuka — bisa ambil beberapa",
    en: "Camera opens — grab multiple if you like",
  },
  "catat.tip": {
    id: "💡 Tips: foto dari atas, jangan miring. Makin jelas teks-nya makin akurat OCR-nya.",
    en: "💡 Tip: shoot from above, keep it flat. Clearer text = more accurate OCR.",
  },

  // Akun
  "akun.title": { id: "Akun Lo", en: "Your Accounts" },
  "akun.newBtn": { id: "Akun baru", en: "New account" },
  "akun.uploadBalance": { id: "Update Saldo via Screenshot", en: "Update Balance via Screenshot" },
  "akun.uploadHint": {
    id: "Upload screenshot banking app / e-wallet → auto-extract saldo",
    en: "Upload banking app screenshot → auto-extract balance",
  },
  "akun.ocrLoading": { id: "Lagi nebak saldo dari screenshot...", en: "Reading balance from screenshot..." },
  "akun.noAccounts": { id: "Belum ada akun.", en: "No accounts yet." },

  // Budget
  "budget.title": { id: "Target Boros 🎯", en: "Spend Target 🎯" },
  "budget.desc": {
    id: "Set target harian/mingguan/bulanan biar ga kalap.",
    en: "Set daily/weekly/monthly targets so you don't blow it.",
  },

  // Analytics
  "analytics.title": { id: "Stats", en: "Stats" },
  "analytics.desc": { id: "Liat seberapa jago lo ngerem boros.", en: "See how well you're reining it in." },

  // Tx list
  "tx.title": { id: "Transaksi", en: "Transactions" },
  "tx.manual": { id: "Manual", en: "Manual" },
  "tx.filter.all": { id: "Semua", en: "All" },
  "tx.filter.expense": { id: "Pengeluaran", en: "Expense" },
  "tx.filter.income": { id: "Pemasukan", en: "Income" },
  "tx.filter.boros": { id: "🫠 Boros", en: "🫠 Overspent" },
  "tx.empty": { id: "Gak ada transaksi. Tap tombol 📸 di bawah buat mulai catat.", en: "No transactions. Tap 📸 below to start." },

  // Currency toggle
  "currency.idr": { id: "IDR", en: "IDR" },
  "currency.myr": { id: "MYR", en: "MYR" },
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof TR | string) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "id" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = TR[key as keyof typeof TR];
      if (!entry) return key; // fallback: return key as-is (helps spot missing translations)
      return entry[locale] ?? entry.id;
    },
    [locale]
  );

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Outside provider — return no-op that returns ID translation
    return {
      locale: "id" as Locale,
      setLocale: () => undefined,
      t: (key: string) => TR[key as keyof typeof TR]?.id ?? key,
    };
  }
  return ctx;
}
