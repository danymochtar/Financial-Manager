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
  "nav.dukun": { id: "Dukun", en: "Dukun" },
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
  "dash.dukunCta.title": { id: "Ritual Pesugihan", en: "Pesugihan Ritual" },
  "dash.dukunCta.question": {
    id: "\"Gimana biar duit gw cepat berlipat?\"",
    en: "\"How do I grow this stash faster?\"",
  },
  "dash.dukunCta.sub": {
    id: "Strategi compound + roast boros · bukan pake tuyul",
    en: "Compound strategy + overspend roast · no supernatural",
  },

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
  "wajib.title": { id: "Dapur Duit 🍳", en: "Money Kitchen 🍳" },
  "wajib.desc": {
    id: "Semua bahan duit lo di sini: income, expense fix, aset, karir, cicilan, tanggungan, investasi, target. Tap item apa aja buat edit.",
    en: "All your money ingredients: income, fixed expenses, assets, career, debts, dependents, investments, goals. Tap any item to edit.",
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

  // Dukun → Dukun Pesugihan
  "dukun.title": { id: "Dukun Pesugihan 🧙", en: "Dukun Pesugihan 🧙" },
  "dukun.desc": {
    id: "Strategi pesugihan tanpa tuyul — tanya apa aja: dari roast boros, ritual compound, strategi investasi, sampe safety net.",
    en: "Pesugihan (wealth ritual) without the supernatural — ask anything: roast overspending, compound rituals, investment framework, safety net.",
  },
  "dukun.greet": {
    id: "Halo, gw **Dukun Pesugihan** 🧙 — tenang, gak pake tuyul, gak pake gaib. Pesugihan gw = ritual disiplin + strategi compound.\n\nSelain kasih advice, lo juga bisa **catet/update langsung lewat chat**:\n- \"catet gw beli kopi 50rb di Starbucks pake Gopay\"\n- \"update saldo BCA gw jadi 5,2jt\"\n- \"tambahin goal gw mau DP rumah 200jt 3 tahun lagi\"\n- \"mobil Brio gw skrg nilainya 120jt\"\n\nAtau tap quick action di atas.",
    en: "Yo, I'm **Dukun Pesugihan** 🧙 — relax, no tuyul, no supernatural. My \"pesugihan\" = discipline rituals + compound strategy.\n\nBeyond advice, you can also **log/update data via chat**:\n- \"log coffee Rp 50k at Starbucks on GoPay\"\n- \"update my BCA balance to Rp 5.2M\"\n- \"add goal: home DP Rp 200M in 3 years\"\n- \"my Brio is worth Rp 120M now\"\n\nOr tap a quick action above.",
  },
  "dukun.thinking": { id: "Ritual lagi jalan...", en: "Ritual in progress..." },
  "dukun.placeholder": {
    id: "Tanya / catet apa aja... (mis: catet gw beli kopi 50rb pake Gopay)",
    en: "Ask or log anything... (e.g. log coffee Rp 50k on GoPay)",
  },
  "dukun.clear": { id: "Bersihin chat", en: "Clear chat" },
  "dukun.disclaimer": {
    id: "Saran Dukun Pesugihan bukan advice finansial profesional — ini strategi umum berdasarkan data lo. Verifikasi sebelum decide besar.",
    en: "Dukun Pesugihan gives general strategy, not professional financial advice. Verify before big decisions.",
  },
  "dukun.snapshotLabel": { id: "Snapshot Lo", en: "Your Snapshot" },
  "dukun.freeCash": { id: "Free Cash/bln", en: "Free cash/mo" },
  "dukun.investment": { id: "Investasi", en: "Investments" },
  "dukun.activeGoals": { id: "target aktif", en: "active goals" },

  "dukun.qa.roast": { id: "🔥 Roast Boros Gw", en: "🔥 Roast My Overspending" },
  "dukun.qa.ritual": { id: "🔮 Ritual Pesugihan", en: "🔮 Pesugihan Ritual" },
  "dukun.qa.invest": { id: "📈 Strategi Investasi", en: "📈 Investment Strategy" },
  "dukun.qa.moneyTrail": { id: "🧭 Duit Lo Kemana?", en: "🧭 Where Did My Money Go?" },
  "dukun.qa.safety": { id: "🛡️ Dana Darurat", en: "🛡️ Safety Net" },
  "dukun.qa.savings": { id: "🎯 Plan Nabung Goal", en: "🎯 Savings Plan" },
  "dukun.qa.wishlist": { id: "🛒 Pengen Beli Sesuatu", en: "🛒 Thinking of Buying" },

  "dukun.prompt.roast": {
    id: "Roast pengeluaran gw 30 hari terakhir. Fokus ke variable expense (jajan, makan luar, belanja, hiburan). Tunjukin kategori paling boros, bandingin sama benchmark ideal (misal makan luar <15% income). Hitung opportunity cost: kalo duit yg gw bakar itu di-DCA ke reksadana selama 5 tahun dengan return konservatif 7%/yr, jadinya berapa? Habis roast, kasih 3 ritual konkret minggu ini buat cut spending.",
    en: "Roast my last 30 days of spending. Focus on variable expenses (food, shopping, entertainment). Show which categories are the worst offenders vs ideal benchmarks (e.g. eating out <15% of income). Compute opportunity cost: if that wasted money were DCA'd into mutual funds for 5 years at a conservative 7%/yr, what would it be? After the roast, give 3 concrete rituals for this week to cut spending.",
  },
  "dukun.prompt.ritual": {
    id: "Kasih gw 5 ritual pesugihan (compound habits) yg paling relevan buat kondisi gw sekarang. Ritual = kebiasaan harian/mingguan yg kalo dijalanin rutin, 5 tahun lagi net worth gw naik signifikan. Contoh: Bayar Diri Dulu 10-20% gaji auto-transfer begitu gajian, DCA reksadana Rp X/bulan, cancel zombie subscription, 24-hour rule buat impulse buy, target emergency fund naik Rp X/bulan, dll. Kasih angka konkret buat MASING-MASING ritual (bukan generic), disesuaikan sama gaji & free cash flow gw. Akhiri dengan prediksi realistis: kalo ritual ini dijalanin 5 tahun, net worth gw bisa jadi berapa?",
    en: "Give me 5 pesugihan rituals (compound habits) most relevant to my current situation. Rituals = daily/weekly habits that, if followed consistently, meaningfully grow my net worth in 5 years. Examples: Pay Yourself First 10-20% auto-transfer on payday, monthly DCA of Rp X to mutual funds, kill zombie subscriptions, 24-hour impulse-buy rule, emergency fund grows Rp X/mo, etc. Give CONCRETE numbers for each ritual (not generic), calibrated to my salary & free cash flow. End with a realistic 5-year net-worth projection if I stick to them.",
  },
  "dukun.prompt.invest": {
    id: "Kasih framework strategi investasi berdasarkan umur gw (tebak dari yearsWorked + firstJobStart), free cash flow, dan goals gw yg aktif. JANGAN rekomendasikan saham/coin spesifik — kasih framework alokasi asset aja (misal 20s: 80% equity + 20% bond/emas, 30s: 70/30, dst). Sebut: urutan prioritas (emergency fund dulu → debt clearance → invest), DCA vs lump sum, diversifikasi (gak all-in 1 crypto/saham), cek expense ratio reksadana, dan WARNING yg harus gw hindari (pinjol buat invest, margin tanpa literacy, FOMO, MLM). Akhiri dengan 3 ritual minggu ini buat mulai.",
    en: "Give me an investment framework based on my age (infer from yearsWorked + firstJobStart), free cash flow, and active goals. DO NOT recommend specific stocks/coins — only asset allocation framework (e.g. 20s: 80% equity + 20% bond/gold, 30s: 70/30, etc.). Cover: priority order (emergency fund → debt clearance → invest), DCA vs lump sum, diversification (no single concentration), check fund expense ratios, and WARNINGS I should avoid (loans to invest, margin without literacy, FOMO, MLM). End with 3 rituals to start this week.",
  },
  "dukun.prompt.moneyTrail": {
    id: "Analisa 'duit gw kemana?' — bandingin total earnings gw sepanjang karir (dari careerHistory) vs current net worth gw. Hitung savings efficiency %. Kasih narasi jujur: udah kerja X tahun, total earn Y, tapi net worth gw cuma Z% dari itu — tebak kemungkinan alasan dari data yg ada (lifestyle inflation, aset yg depresiasi, investasi kurang baik, tanggungan, dll). Jangan judging, banyak faktor valid. Akhiri dengan 3 ritual konkret buat naikin savings efficiency.",
    en: "Analyze 'where did my money go?' — compare my total career earnings (from careerHistory) vs my current net worth. Compute savings efficiency %. Give an honest narrative: worked X years, earned Y total, net worth is only Z% of that — guess likely causes from the data (lifestyle inflation, depreciating assets, poor investments, dependents). No judgment; many causes are valid. End with 3 concrete rituals to raise savings efficiency.",
  },
  "dukun.prompt.safety": {
    id: "Hitung idealnya gw punya dana darurat berapa berdasarkan situasi gw (sandwich gen, income fix + variable, dll). Bandingin sama aset likuid gw sekarang — cukup atau belom? Kalo belom, berapa bulan gw harus nabung buat capai target? Kasih plan step-by-step.",
    en: "Calculate my ideal emergency fund based on my situation (sandwich gen, fixed + variable income). Compare with my current liquid assets — enough or not? If not, how many months to reach the target? Give me a step-by-step plan.",
  },
  "dukun.prompt.savings": {
    id: "Liat goals gw yg aktif di snapshot. Buat plan nabung bulanan buat masing-masing goal, urutkan prioritas (high dulu). Kalau goal-nya gak realistis dengan free cash flow gw sekarang, kasih tau + kasih saran (extend timeline, naikin income, atau potong expense mana).",
    en: "Look at my active goals in the snapshot. Build a monthly savings plan for each, ordered by priority (high first). If any goal is unrealistic given my free cash flow, say so and suggest fixes (extend timeline, raise income, cut which expense).",
  },
  "dukun.prompt.wishlist": {
    id: "Gw lagi kepengen beli sesuatu tapi belum yakin worth it atau engga. Tanya dulu gw pengen beli apa + perkiraan harganya + kapan pengen kebeli. Habis itu: (1) simulasiin cash scenario — realistis nabung berapa bulan dengan alokasi 20-30% freeCashFlow; (2) simulasiin cicilan scenario 6/12/24 bulan + bunga kira-kira 2-2.5%/bulan; (3) hitung opportunity cost kalo duitnya di-DCA ke reksadana 7%/yr di horizon yg sama; (4) kasih verdict jujur (realistis/stretch/mimpi) + tradeoff; (5) simpen hasilnya ke wishlist gw pake tool add_wishlist (lengkap: estimatedPrice, currency, priority, category, financingPlan, projectedDate, decisionNote).",
    en: "I want to buy something but I'm not sure if it's worth it. First ask me what I want + price estimate + when I want it. Then: (1) simulate cash scenario — realistic savings months if I allocate 20-30% of freeCashFlow; (2) simulate installment scenarios 6/12/24 months at ~2-2.5%/mo interest; (3) compute opportunity cost if the money were DCA'd to mutual funds at 7%/yr over the same horizon; (4) give an honest verdict (realistic/stretch/dream) + tradeoffs; (5) save the result to my wishlist via the add_wishlist tool (include estimatedPrice, currency, priority, category, financingPlan, projectedDate, decisionNote).",
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
  "akun.tileAsset": { id: "Aset", en: "Assets" },
  "akun.tileLiability": { id: "Hutang", en: "Debts" },
  "akun.tileInvestment": { id: "Investasi", en: "Investments" },
  "akun.tapToAdd": { id: "tap buat tambah", en: "tap to add" },
  "akun.itemCount": { id: "item", en: "item" },
  "akun.itemCountPlural": { id: "item", en: "items" },
  "akun.addAsset": { id: "Tambah Aset", en: "Add Asset" },
  "akun.addLiability": { id: "Tambah Hutang", en: "Add Debt" },
  "akun.addInvestment": { id: "Tambah Investasi", en: "Add Investment" },
  "akun.assetSubtitle": {
    id: "Bank, e-wallet, atau cash — duit yang lo punya",
    en: "Bank, e-wallet, or cash — money you have",
  },
  "akun.liabilityChooserTitle": { id: "Tipe Hutang", en: "Debt Type" },
  "akun.liabilityCC": { id: "Kartu Kredit", en: "Credit Card" },
  "akun.liabilityCCDesc": {
    id: "Tagihan + limit, di-track sebagai akun",
    en: "Bill + limit, tracked as an account",
  },
  "akun.liabilityDebt": { id: "Cicilan / Pinjol", en: "Loan / Installment" },
  "akun.liabilityDebtDesc": {
    id: "KPR, KKB, motor, pinjol, KTA, dll",
    en: "Mortgage, car/motorcycle loan, personal loan, etc.",
  },
  "akun.investmentSubtitle": {
    id: "Reksadana, saham, crypto, emas, properti — apapun yang dipegang buat growth",
    en: "Mutual funds, stocks, crypto, gold, property — anything held for growth",
  },
  "akun.sectionEmpty": {
    id: "Belum ada — tap tile di atas buat nambah",
    en: "Empty — tap the tile above to add",
  },

  // Setting currency picker
  "setting.currencyUsed": { id: "Currency yang lo pake", en: "Currencies you use" },
  "setting.currencyUsedHint": {
    id: "Kalau lo gak punya hutang/aset di currency tertentu, matiin aja biar dashboard gak penuh.",
    en: "Hide currencies you don't use so the dashboard stays focused.",
  },
  "setting.currencyPrimary": {
    id: "Primary currency gak bisa dimatiin. Ganti primary dulu.",
    en: "Primary currency can't be disabled. Switch primary first.",
  },

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

  // ===== Wajib new tabs =====
  "wajib.tab.asset": { id: "Aset 🏠", en: "Assets 🏠" },
  "wajib.tab.career": { id: "Karir 💼", en: "Career 💼" },
  "wajib.tab.wishlist": { id: "Wishlist 🛒", en: "Wishlist 🛒" },
  "wajib.addAsset": { id: "Tambah Aset", en: "Add Asset" },
  "wajib.addJob": { id: "Tambah Pekerjaan", en: "Add Job" },
  "wajib.addWishlist": { id: "Tambah Wishlist", en: "Add Wishlist" },

  // ===== Wishlist =====
  "wishlist.empty": {
    id: "Belum ada wishlist — tanya Dukun \"pengen beli X\" atau tambah manual.",
    en: "No wishlist yet — ask Dukun \"I want to buy X\" or add manually.",
  },
  "wishlist.namePlaceholder": {
    id: "Nama item (contoh: iPhone 16 Pro)",
    en: "Item name (e.g. iPhone 16 Pro)",
  },
  "wishlist.estimatedPrice": { id: "Perkiraan Harga", en: "Estimated Price" },
  "wishlist.projectedDate": { id: "Target Kapan?", en: "Target Date?" },
  "wishlist.category": { id: "Kategori", en: "Category" },
  "wishlist.categoryHint": {
    id: "gadget / travel / experience / home / vehicle / other",
    en: "gadget / travel / experience / home / vehicle / other",
  },
  "wishlist.financingPlan": { id: "Rencana Bayar", en: "Financing Plan" },
  "wishlist.financingPlanHint": {
    id: "cash / cicilan 12 bln Rp 1.5jt / dll",
    en: "cash / 12-mo installment / etc",
  },
  "wishlist.decisionNote": { id: "Catatan Verdict Dukun", en: "Dukun's Verdict" },
  "wishlist.decisionNoteHint": {
    id: "untung/rugi, realistis/engga, saran",
    en: "worth it or not, realistic or not, notes",
  },
  "wishlist.note": { id: "Catatan Tambahan", en: "Extra Notes" },
  "wishlist.priority.urgent": { id: "🔥 Pengen Banget", en: "🔥 Really Want" },
  "wishlist.priority.nice": { id: "✨ Nice to Have", en: "✨ Nice to Have" },
  "wishlist.priority.someday": { id: "🌙 Someday", en: "🌙 Someday" },

  // ===== Asset =====
  "asset.empty": { id: "aset fisik (rumah, mobil, gadget)", en: "physical assets (home, car, gadgets)" },
  "asset.namePlaceholder": { id: "Nama aset", en: "Asset name" },
  "asset.detailsPlaceholder": {
    id: "Detail (brand, tahun, ukuran, lokasi, dll) — makin detail makin akurat AI nebak harganya",
    en: "Details (brand, year, size, location) — the more detail, the more accurate the AI estimate",
  },
  "asset.purchaseDate": { id: "Tanggal beli", en: "Purchase date" },
  "asset.purchasePrice": { id: "Harga beli", en: "Purchase price" },
  "asset.currentEstimate": { id: "Nilai sekarang (perkiraan)", en: "Current value (estimate)" },
  "asset.currentHint": {
    id: "Isi kira-kira aja, nanti bisa di-revalue sama AI",
    en: "Rough guess — you can re-estimate with AI later",
  },
  "asset.purchase": { id: "Beli", en: "Purchase" },
  "asset.current": { id: "Skrg", en: "Now" },
  "asset.lastValued": { id: "Valued", en: "Valued" },
  "asset.revalue": { id: "Revalue via AI", en: "Revalue via AI" },
  "asset.revaluing": { id: "Nebak...", en: "Estimating..." },
  "asset.revalued": { id: "Nilai ter-update ✨", en: "Value updated ✨" },
  "asset.revalueCooldown": {
    id: "Baru direvalue. Coba lagi dalam {d} hari ya.",
    en: "Just revalued recently. Try again in {d} days.",
  },

  // ===== Career =====
  "career.empty": {
    id: "Belum ada riwayat karir. Tambahin biar Dukun bisa analisa \"duit lo kemana?\"",
    en: "No career history yet. Add one so the Oracle can analyze \"where did my money go?\"",
  },
  "career.employer": { id: "Perusahaan / Client", en: "Employer / Client" },
  "career.role": { id: "Role (opsional)", en: "Role (optional)" },
  "career.start": { id: "Mulai", en: "Start" },
  "career.end": { id: "Selesai", en: "End" },
  "career.isCurrent": { id: "Sekarang masih kerja di sini", en: "Currently working here" },
  "career.current": { id: "sekarang", en: "present" },
  "career.monthlySalary": { id: "Gaji bulanan (take home)", en: "Monthly salary (take home)" },

  // ===== Dukun additions =====
  "dukun.netWorth": { id: "Net Worth", en: "Net Worth" },
  "dukun.physical": { id: "Aset Fisik", en: "Physical Assets" },
  "dukun.efficiency": { id: "Efisiensi tabungan", en: "Savings efficiency" },

  // ===== Onboarding (assets + career) =====
  "onb.stepAssets": { id: "Aset Fisik", en: "Physical Assets" },
  "onb.stepCareer": { id: "Riwayat Karir", en: "Career History" },
  "onb.assets.subtitle": {
    id: "Punya rumah, apartment, mobil, motor, atau gadget gede? Input biar net worth-nya akurat. Boleh skip.",
    en: "Got a home, car, motorcycle, or big gadget? Add them for accurate net worth. Skippable.",
  },
  "onb.career.subtitle": {
    id: "Kapan lo pertama kerja, gaji pertama berapa? Dukun pake ini buat analisa \"duit lo kemana\" vs total earning lo.",
    en: "When did you first start working? First salary? The Oracle uses this to analyze \"where did my money go?\" against total lifetime earnings.",
  },
  "onb.welcomeAssets": { id: "🏠 Aset fisik (rumah, mobil, gadget)", en: "🏠 Physical assets (home, car, gadgets)" },
  "onb.welcomeCareer": { id: "💼 Riwayat kerja (gaji pertama → sekarang)", en: "💼 Career history (first → current salary)" },
  "onb.done.assets": { id: "aset fisik", en: "physical assets" },
  "onb.done.jobs": { id: "job", en: "jobs" },
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
