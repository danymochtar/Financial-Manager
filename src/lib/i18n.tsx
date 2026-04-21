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

  // ===== Onboarding step bodies =====
  "onb.accounts.subtitle": {
    id: "Masukin saldo rekening bank, e-wallet, cash. Minimal 1.",
    en: "Add balances for your banks, e-wallets, cash. At least 1.",
  },
  "onb.cc.subtitle": {
    id: "Punya CC? Input limit & tagihan. Skip kalo gak punya.",
    en: "Got credit cards? Enter limit & current balance. Skip if none.",
  },
  "onb.income.subtitle": {
    id: "Gaji, retainer project, dll yang masuk tiap bulan. Skip kalo belum ada.",
    en: "Salary, project retainers, anything recurring monthly. Skip if none.",
  },
  "onb.fixed.subtitle": {
    id: "Biaya pasti tiap bulan: kost, internet, langganan. (Cicilan nanti di step setelah ini).",
    en: "Monthly must-pays: rent, internet, subscriptions. (Debts come in the next step.)",
  },
  "onb.debt.subtitle": {
    id: "Cicilan KPR, KKB, pinjol, CC installment, dll. Biar kelihatan progress lunas-nya.",
    en: "Mortgage, car/motorcycle loan, personal loans, CC installments. Track payoff progress.",
  },
  "onb.dep.subtitle": {
    id: "Generasi sandwich? Tanggungan keluarga yang lo kirimin tiap bulan. (Skip kalo belum ada.)",
    en: "Sandwich generation? Family dependents you send money to monthly. (Skip if none.)",
  },
  "onb.budget.subtitle": {
    id: "Target pengeluaran variable (jajan, makan, belanja). Kalo lewat, gw kasih tau \"Woy boros!\". Isi yang lo mau aja — boleh skip semua juga.",
    en: "Target for variable spending (food, shopping, fun). If you go over, we'll nudge you. Fill what you want — you can skip all.",
  },
  "onb.done.body": {
    id: "Mantap! Semua udah kerekam. Klik Mulai Catat dan kita mulai tracking keborosan lo.",
    en: "Nice! Everything's recorded. Tap Start Tracking and let's go.",
  },
  "onb.done.accounts": { id: "rekening", en: "accounts" },
  "onb.done.cc": { id: "kartu kredit", en: "credit cards" },
  "onb.done.income": { id: "penghasilan", en: "incomes" },
  "onb.done.fixed": { id: "pengeluaran fix", en: "fixed expenses" },
  "onb.done.debts": { id: "cicilan", en: "debts" },
  "onb.done.dependents": { id: "tanggungan", en: "dependents" },

  "onb.f.pickTemplate": { id: "Pilih cepet dari template", en: "Quick pick from template" },
  "onb.f.addManual": { id: "Tambah manual", en: "Add manually" },
  "onb.f.cancel": { id: "Batal", en: "Cancel" },
  "onb.f.accountName": { id: "Nama rekening", en: "Account name" },
  "onb.f.nameExample.kost": { id: "Nama (contoh: Sewa Kost Sudirman)", en: "Name (e.g. Studio Rent Downtown)" },
  "onb.f.nameExample.income": { id: "Nama (contoh: Gaji Kerjaan Malaysia)", en: "Name (e.g. Salary Day Job)" },
  "onb.f.nameDebt": { id: "Nama cicilan", en: "Debt name" },
  "onb.f.nameDep": { id: "Nama (contoh: Mama)", en: "Name (e.g. Mom)" },
  "onb.f.add": { id: "Tambahin", en: "Add" },
  "onb.f.balance": { id: "Saldo", en: "Balance" },
  "onb.f.ccBalance": { id: "Tagihan skrg", en: "Current balance" },
  "onb.f.ccLimit": { id: "Limit", en: "Limit" },
  "onb.f.amount": { id: "Amount", en: "Amount" },
  "onb.f.remaining": { id: "Sisa hutang", en: "Remaining" },
  "onb.f.monthly": { id: "Cicilan/bln", en: "Monthly pmt" },
  "onb.f.monthlySend": { id: "Kirim per bulan", en: "Monthly send" },
  "onb.f.payDay": { id: "Tgl bayar", en: "Pay day" },
  "onb.f.payDate": { id: "Tanggal gajian", en: "Payday of month" },
  "onb.f.category": { id: "Kategori", en: "Category" },
  "onb.f.toAccount": { id: "Masuk ke rekening", en: "Deposit into account" },
  "onb.f.pick": { id: "— pilih —", en: "— select —" },
  "onb.b.rupiah": { id: "Rupiah", en: "Rupiah" },
  "onb.b.ringgit": { id: "Ringgit", en: "Ringgit" },
  "onb.b.daily": { id: "Harian", en: "Daily" },
  "onb.b.weekly": { id: "Mingguan", en: "Weekly" },
  "onb.b.monthly": { id: "Bulanan", en: "Monthly" },
  "onb.b.skipHint": { id: "0 = skip", en: "0 = skip" },

  // ===== Wajib add forms =====
  "wajib.form.name": { id: "Nama", en: "Name" },
  "wajib.form.template": { id: "Template", en: "Template" },
  "wajib.form.templateQuick": { id: "Template cepet", en: "Quick template" },
  "wajib.form.lifeTemplate": { id: "Template target hidup", en: "Life goal templates" },
  "wajib.form.amount": { id: "Amount", en: "Amount" },
  "wajib.form.remaining": { id: "Sisa hutang", en: "Remaining debt" },
  "wajib.form.monthly": { id: "Cicilan / bulan", en: "Monthly payment" },
  "wajib.form.payDay": { id: "Tgl bayar", en: "Pay day" },
  "wajib.form.payDate": { id: "Tgl gajian", en: "Payday" },
  "wajib.form.category": { id: "— kategori —", en: "— category —" },
  "wajib.form.platform": { id: "Platform (contoh: Pluang, Ajaib)", en: "Platform (e.g. Pluang, Ajaib)" },
  "wajib.form.currentValue": { id: "Nilai saat ini", en: "Current value" },
  "wajib.form.goalName": { id: "Nama goal", en: "Goal name" },
  "wajib.form.goalTarget": { id: "Target dana", en: "Target amount" },
  "wajib.form.goalSaved": { id: "Udah nabung berapa?", en: "How much saved already?" },
  "wajib.form.goalDeadline": { id: "Deadline (opsional)", en: "Deadline (optional)" },
  "wajib.form.goalPriority": { id: "Priority", en: "Priority" },
  "wajib.form.saveGoal": { id: "Simpan target", en: "Save target" },
  "wajib.form.selectCategory": { id: "— kategori —", en: "— category —" },
  "wajib.form.priorityHigh": { id: "🔥 High", en: "🔥 High" },
  "wajib.form.priorityNormal": { id: "Normal", en: "Normal" },
  "wajib.form.priorityLow": { id: "Low", en: "Low" },
  "wajib.form.incomeNameHint": { id: "Nama (contoh: Gaji Kerjaan Malaysia)", en: "Name (e.g. Malaysia day job)" },
  "wajib.form.investNameHint": { id: "Nama (contoh: BBCA, Emas Antam)", en: "Name (e.g. BBCA, Antam Gold)" },
  "wajib.form.deleteConfirm": { id: "Hapus?", en: "Delete?" },
  "wajib.addTitle": { id: "Tambah baru", en: "Add new" },
  "wajib.addInvestment": { id: "Tambah Investasi", en: "Add Investment" },
  "wajib.addGoal": { id: "Tambah Target", en: "Add Goal" },
  "wajib.item.empty": { id: "Belum ada", en: "Nothing yet" },
  "wajib.type.gold": { id: "Emas", en: "Gold" },
  "wajib.type.crypto": { id: "Crypto", en: "Crypto" },
  "wajib.type.stock": { id: "Saham", en: "Stocks" },
  "wajib.type.mutual_fund": { id: "Reksadana", en: "Mutual Fund" },
  "wajib.type.forex": { id: "Forex", en: "Forex" },
  "wajib.type.deposit": { id: "Deposito", en: "Deposit" },
  "wajib.type.bond": { id: "Obligasi", en: "Bonds" },
  "wajib.type.property": { id: "Properti", en: "Property" },
  "wajib.type.other": { id: "Lainnya", en: "Other" },

  // ===== Akun page =====
  "akun.addBtn": { id: "Akun baru", en: "New account" },
  "akun.addManually": { id: "Atau manual", en: "Or add manually" },
  "akun.fromTemplate": { id: "Dari template", en: "From template" },
  "akun.asset": { id: "Aset", en: "Assets" },
  "akun.debt": { id: "Hutang", en: "Debts" },
  "akun.initBalance": { id: "Saldo awal", en: "Initial balance" },
  "akun.limitCard": { id: "Limit kartu", en: "Card limit" },
  "akun.ocrResult": { id: "Hasil OCR", en: "OCR Result" },
  "akun.detected": { id: "Terdeteksi", en: "Detected" },
  "akun.unknownAccount": { id: "Akun gak kebaca", en: "Account not read" },
  "akun.applyTo": { id: "Apply ke akun", en: "Apply to account" },
  "akun.newBalance": { id: "Saldo baru", en: "New balance" },
  "akun.updateBalance": { id: "Update saldo", en: "Update balance" },
  "akun.deleteConfirm": { id: "Hapus akun ini?", en: "Delete this account?" },
  "akun.typeBank": { id: "Bank", en: "Bank" },
  "akun.typeEwallet": { id: "E-wallet", en: "E-wallet" },
  "akun.typeCash": { id: "Cash", en: "Cash" },
  "akun.typeCC": { id: "Credit Card", en: "Credit Card" },
  "akun.limit": { id: "limit", en: "limit" },

  // ===== Catat page =====
  "catat.takePhotoBtn": { id: "Ambil Foto Struk", en: "Capture Receipt" },
  "catat.takePhotoHint": { id: "Kamera bakal kebuka — bisa ambil beberapa", en: "Camera opens — grab multiple if you like" },
  "catat.queueLabel": { id: "struk", en: "receipts" },
  "catat.queueDone": { id: "done", en: "done" },
  "catat.queueProcess": { id: "proses", en: "processing" },
  "catat.queuePending": { id: "pending", en: "pending" },
  "catat.process": { id: "Proses", en: "Process" },
  "catat.reviewBtn": { id: "Review {n} struk →", en: "Review {n} receipts →" },
  "catat.processing": { id: "OCR", en: "OCR" },
  "catat.reading": { id: "Ngintip struk...", en: "Reading receipt..." },
  "catat.pending": { id: "Pending", en: "Pending" },
  "catat.notRead": { id: "Total gak ke-baca", en: "Total unreadable" },
  "catat.reviewItem": { id: "Review", en: "Review" },
  "catat.retry": { id: "Retry", en: "Retry" },

  // ===== Review =====
  "review.title": { id: "Review Struk ✍️", en: "Review Receipts ✍️" },
  "review.desc": { id: "Konfirm atau edit hasil OCR biar masuk jadi transaksi.", en: "Confirm or edit OCR results to turn into transactions." },
  "review.empty": { id: "Gak ada draft. Tap kamera buat catet struk baru.", en: "No drafts. Tap the camera to capture a new receipt." },
  "review.merchantUnknown": { id: "Merchant gak ke-baca", en: "Merchant unreadable" },
  "review.confirmed": { id: "Udah ter-confirm.", en: "Already confirmed." },
  "review.detailTitle": { id: "Review Struk", en: "Review Receipt" },
  "review.discard": { id: "Buang", en: "Discard" },
  "review.discardConfirm": { id: "Buang struk ini?", en: "Discard this receipt?" },
  "review.confirmBtn": { id: "Confirm 🚀", en: "Confirm 🚀" },
  "review.amount": { id: "Amount", en: "Amount" },
  "review.date": { id: "Tanggal", en: "Date" },
  "review.paidFrom": { id: "Bayar dari", en: "Paid from" },
  "review.category": { id: "Kategori", en: "Category" },
  "review.merchant": { id: "Merchant", en: "Merchant" },
  "review.note": { id: "Catatan (opsional)", en: "Note (optional)" },
  "review.borosTag": { id: "🫠 Tandain ini transaksi kalap / boros", en: "🫠 Tag this as an impulse / overspend" },

  // ===== Tx =====
  "tx.detail": { id: "Detail", en: "Detail" },
  "tx.manualTitle": { id: "Catat Manual", en: "Manual Entry" },
  "tx.edit": { id: "Edit", en: "Edit" },
  "tx.deleteConfirm": { id: "Hapus transaksi?", en: "Delete transaction?" },
  "tx.deleted": { id: "Kehapus", en: "Deleted" },
  "tx.amountEquivIDR": { id: "Equiv IDR", en: "Equiv IDR" },
  "tx.amountEquivMYR": { id: "Equiv MYR", en: "Equiv MYR" },
  "tx.amountOrig": { id: "Amount asli", en: "Original amount" },
  "tx.pickAccount": { id: "Akun", en: "Account" },
  "tx.pickCategory": { id: "Kategori", en: "Category" },
  "tx.typeExpense": { id: "Pengeluaran", en: "Expense" },
  "tx.typeIncome": { id: "Pemasukan", en: "Income" },
  "tx.date": { id: "Tanggal", en: "Date" },
  "tx.merchant": { id: "Merchant (opsional)", en: "Merchant (optional)" },
  "tx.note": { id: "Catatan", en: "Note" },
  "tx.isBoros": { id: "🫠 Tandain ini transaksi kalap", en: "🫠 Tag as impulse / overspend" },
  "tx.currency": { id: "Currency", en: "Currency" },
  "tx.merchantHint": { id: "Grab, Starbucks, Indomaret...", en: "Uber, Starbucks, Walmart..." },
  "tx.savedToast": { id: "Tercatat 🫠", en: "Saved 🫠" },
  "tx.updateBtn": { id: "Update", en: "Update" },

  // ===== Budget =====
  "budget.overallIDR": { id: "Target Overall (IDR)", en: "Overall Target (IDR)" },
  "budget.overallMYR": { id: "Target Overall (MYR)", en: "Overall Target (MYR)" },
  "budget.perCategory": { id: "Per Kategori", en: "Per Category" },
  "budget.setBtn": { id: "Set budget", en: "Set budget" },
  "budget.deleteConfirm": { id: "Hapus target?", en: "Delete target?" },

  // ===== Analytics =====
  "analytics.streakBest": { id: "Terbaik", en: "Best" },
  "analytics.streakStart": { id: "Set target harian di /budget biar streak mulai keitung.", en: "Set a daily target in /budget so the streak starts counting." },
  "analytics.incomeMonth": { id: "Income bulan ini", en: "Income this month" },
  "analytics.expenseMonth": { id: "🫠 Expense", en: "🫠 Expense" },
  "analytics.last6m": { id: "6 Bulan Terakhir", en: "Last 6 Months" },
  "analytics.borosBreakdown": { id: "Breakdown Keborosan 🫠", en: "Overspending Breakdown 🫠" },
  "analytics.exportData": { id: "Export data", en: "Export data" },

  // ===== Common toasts / errors =====
  "toast.deleted": { id: "Dihapus", en: "Deleted" },
  "toast.saved": { id: "Tersimpan", en: "Saved" },
  "toast.saveFailed": { id: "Gagal simpan", en: "Save failed" },
  "toast.deleteFailed": { id: "Gagal hapus", en: "Delete failed" },
  "toast.failed": { id: "Gagal", en: "Failed" },
  "toast.ocrFailed": { id: "OCR gagal", en: "OCR failed" },
  "toast.uploadFailed": { id: "Upload gagal", en: "Upload failed" },
  "toast.balanceUpdated": { id: "Saldo udah di-update 🎉", en: "Balance updated 🎉" },
  "toast.balanceFailed": { id: "Gagal apply", en: "Apply failed" },
  "toast.receiptToTx": { id: "Masuk catet keborosan 🫠", en: "Saved to your spending 🫠" },
  "toast.fill": { id: "Lengkapi akun, kategori, amount", en: "Fill account, category, amount" },

  // ===== Currency & currency picker =====
  "curr.IDR": { id: "IDR", en: "IDR" },
  "curr.MYR": { id: "MYR", en: "MYR" },
  "curr.USD": { id: "USD", en: "USD" },
  "curr.SGD": { id: "SGD", en: "SGD" },
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
