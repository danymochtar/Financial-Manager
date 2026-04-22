// Default categories + suggestion engine buat "Seberapa Boros Lo?"
// Emoji-forward biar lebih fun di mobile.

export type DefaultCategory = {
  name: string;
  kind: "income" | "expense";
  nature: "fixed" | "variable";
  emoji: string;
  color: string;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Expense — variable (keborosan potensial)
  { name: "Jajan & Kopi", kind: "expense", nature: "variable", emoji: "☕", color: "#f97316" },
  { name: "Makan Luar", kind: "expense", nature: "variable", emoji: "🍽️", color: "#ef4444" },
  { name: "Groceries", kind: "expense", nature: "variable", emoji: "🛒", color: "#16a34a" },
  { name: "Transport", kind: "expense", nature: "variable", emoji: "🛵", color: "#0ea5e9" },
  { name: "Belanja Online", kind: "expense", nature: "variable", emoji: "📦", color: "#ec4899" },
  { name: "Hiburan", kind: "expense", nature: "variable", emoji: "🎬", color: "#a855f7" },
  { name: "Self-Care", kind: "expense", nature: "variable", emoji: "💅", color: "#f472b6" },
  { name: "Kesehatan", kind: "expense", nature: "variable", emoji: "🏥", color: "#06b6d4" },
  { name: "Traveling", kind: "expense", nature: "variable", emoji: "✈️", color: "#14b8a6" },
  { name: "Lain-lain", kind: "expense", nature: "variable", emoji: "✨", color: "#94a3b8" },
  // Expense — fixed (wajib)
  { name: "Sewa / Kost", kind: "expense", nature: "fixed", emoji: "🏠", color: "#8b5cf6" },
  { name: "Utilitas", kind: "expense", nature: "fixed", emoji: "💡", color: "#eab308" },
  { name: "Internet & Pulsa", kind: "expense", nature: "fixed", emoji: "📶", color: "#3b82f6" },
  { name: "Langganan Digital", kind: "expense", nature: "fixed", emoji: "📺", color: "#64748b" },
  { name: "Cicilan", kind: "expense", nature: "fixed", emoji: "💳", color: "#dc2626" },
  { name: "Asuransi", kind: "expense", nature: "fixed", emoji: "🛡️", color: "#0891b2" },
  { name: "Tanggungan Keluarga", kind: "expense", nature: "fixed", emoji: "👪", color: "#be185d" },
  // Income
  { name: "Gaji", kind: "income", nature: "fixed", emoji: "💰", color: "#22c55e" },
  { name: "Side Business", kind: "income", nature: "variable", emoji: "🧑‍💻", color: "#14b8a6" },
  { name: "Project / Freelance", kind: "income", nature: "variable", emoji: "💼", color: "#10b981" },
  { name: "Bonus", kind: "income", nature: "variable", emoji: "🎁", color: "#059669" },
  { name: "Dividen / Investasi", kind: "income", nature: "variable", emoji: "📈", color: "#0d9488" },
  { name: "Lainnya (Income)", kind: "income", nature: "variable", emoji: "➕", color: "#34d399" },
];

// Template akun populer di Indonesia + Malaysia
export const ACCOUNT_TEMPLATES: Array<{
  name: string;
  type: "bank" | "ewallet" | "cash" | "credit_card";
  currency: "IDR" | "MYR" | "USD" | "SGD";
  emoji: string;
  color: string;
}> = [
  // Bank ID
  { name: "BCA", type: "bank", currency: "IDR", emoji: "🏦", color: "#0050a0" },
  { name: "Mandiri", type: "bank", currency: "IDR", emoji: "🏦", color: "#003d7a" },
  { name: "BRI", type: "bank", currency: "IDR", emoji: "🏦", color: "#00529b" },
  { name: "BNI", type: "bank", currency: "IDR", emoji: "🏦", color: "#f58220" },
  { name: "CIMB Niaga", type: "bank", currency: "IDR", emoji: "🏦", color: "#c8102e" },
  { name: "Jenius", type: "bank", currency: "IDR", emoji: "🔷", color: "#0088cc" },
  { name: "Jago", type: "bank", currency: "IDR", emoji: "🟠", color: "#ff6600" },
  { name: "Seabank", type: "bank", currency: "IDR", emoji: "🌊", color: "#ee4d2d" },
  { name: "Line Bank", type: "bank", currency: "IDR", emoji: "💚", color: "#00c300" },
  // Bank MY
  { name: "Maybank MYR", type: "bank", currency: "MYR", emoji: "🏦", color: "#ffc400" },
  { name: "CIMB MY", type: "bank", currency: "MYR", emoji: "🏦", color: "#c8102e" },
  { name: "Public Bank", type: "bank", currency: "MYR", emoji: "🏦", color: "#005bbb" },
  { name: "Hong Leong MY", type: "bank", currency: "MYR", emoji: "🏦", color: "#00649f" },
  { name: "Touch 'n Go eWallet", type: "ewallet", currency: "MYR", emoji: "📱", color: "#1e3a8a" },
  // USD
  { name: "Wise USD", type: "bank", currency: "USD", emoji: "🌎", color: "#9fe870" },
  { name: "Revolut USD", type: "bank", currency: "USD", emoji: "🌎", color: "#1b1b1d" },
  // E-wallet ID
  { name: "GoPay", type: "ewallet", currency: "IDR", emoji: "🟢", color: "#00aa13" },
  { name: "OVO", type: "ewallet", currency: "IDR", emoji: "🟣", color: "#4c2a86" },
  { name: "DANA", type: "ewallet", currency: "IDR", emoji: "🔵", color: "#118eea" },
  { name: "ShopeePay", type: "ewallet", currency: "IDR", emoji: "🟠", color: "#ee4d2d" },
  { name: "LinkAja", type: "ewallet", currency: "IDR", emoji: "🔴", color: "#e02020" },
  // Cash
  { name: "Cash Dompet IDR", type: "cash", currency: "IDR", emoji: "💵", color: "#22c55e" },
  { name: "Cash Dompet MYR", type: "cash", currency: "MYR", emoji: "💵", color: "#22c55e" },
];

// Template kartu kredit (terpisah supaya UI step CC gak ribet)
export const CREDIT_CARD_TEMPLATES: Array<{
  name: string;
  currency: "IDR" | "MYR" | "USD";
  emoji: string;
  color: string;
}> = [
  // Indonesia
  { name: "BCA Credit Card", currency: "IDR", emoji: "💳", color: "#0050a0" },
  { name: "Mandiri Credit Card", currency: "IDR", emoji: "💳", color: "#003d7a" },
  { name: "BNI Credit Card", currency: "IDR", emoji: "💳", color: "#f58220" },
  { name: "BRI Credit Card", currency: "IDR", emoji: "💳", color: "#00529b" },
  { name: "CIMB Niaga CC", currency: "IDR", emoji: "💳", color: "#c8102e" },
  { name: "HSBC Indonesia CC", currency: "IDR", emoji: "💳", color: "#db0011" },
  { name: "Citibank CC", currency: "IDR", emoji: "💳", color: "#003b70" },
  { name: "Mega Credit Card", currency: "IDR", emoji: "💳", color: "#ffcc00" },
  { name: "Permata CC", currency: "IDR", emoji: "💳", color: "#00a94f" },
  // Malaysia
  { name: "Maybank CC (MY)", currency: "MYR", emoji: "💳", color: "#ffc400" },
  { name: "CIMB MY CC", currency: "MYR", emoji: "💳", color: "#c8102e" },
  { name: "Public Bank CC", currency: "MYR", emoji: "💳", color: "#005bbb" },
  { name: "HSBC MY CC", currency: "MYR", emoji: "💳", color: "#db0011" },
  { name: "Hong Leong CC", currency: "MYR", emoji: "💳", color: "#00649f" },
  { name: "RHB CC", currency: "MYR", emoji: "💳", color: "#14408a" },
  // International
  { name: "AmEx USD", currency: "USD", emoji: "💳", color: "#016fd0" },
  { name: "Chase USD", currency: "USD", emoji: "💳", color: "#117aca" },
];

// Template pengeluaran fix + langganan (bisa dicomot pas onboarding / wajib page)
export const FIXED_EXPENSE_TEMPLATES: Array<{
  name: string;
  categoryName: string;
  emoji: string;
  defaultAmountIDR?: number;
  defaultAmountMYR?: number;
}> = [
  // Utilitas & home
  { name: "Sewa / Kost", categoryName: "Sewa / Kost", emoji: "🏠" },
  { name: "KPR (cicilan rumah)", categoryName: "Cicilan", emoji: "🏡" },
  { name: "Listrik", categoryName: "Utilitas", emoji: "💡" },
  { name: "Air", categoryName: "Utilitas", emoji: "💧" },
  { name: "Gas", categoryName: "Utilitas", emoji: "🔥" },
  { name: "Iuran RT / Kebersihan", categoryName: "Utilitas", emoji: "🧹" },
  // Komunikasi
  { name: "Internet Rumah", categoryName: "Internet & Pulsa", emoji: "📶" },
  { name: "Pulsa HP", categoryName: "Internet & Pulsa", emoji: "📱" },
  { name: "Paket Data", categoryName: "Internet & Pulsa", emoji: "📡" },
  // Asuransi
  { name: "BPJS Kesehatan", categoryName: "Asuransi", emoji: "🏥", defaultAmountIDR: 150000 },
  { name: "Asuransi Jiwa", categoryName: "Asuransi", emoji: "🛡️" },
  { name: "Asuransi Kendaraan", categoryName: "Asuransi", emoji: "🚗" },
  // Langganan digital
  { name: "Netflix", categoryName: "Langganan Digital", emoji: "🎬", defaultAmountIDR: 120000, defaultAmountMYR: 45 },
  { name: "Spotify", categoryName: "Langganan Digital", emoji: "🎵", defaultAmountIDR: 54990, defaultAmountMYR: 15.9 },
  { name: "Apple Music", categoryName: "Langganan Digital", emoji: "🍎", defaultAmountIDR: 69000, defaultAmountMYR: 14.9 },
  { name: "YouTube Premium", categoryName: "Langganan Digital", emoji: "📺", defaultAmountIDR: 59000, defaultAmountMYR: 23.9 },
  { name: "Disney+ Hotstar", categoryName: "Langganan Digital", emoji: "🏰", defaultAmountIDR: 39000 },
  { name: "Vidio Premier", categoryName: "Langganan Digital", emoji: "📹", defaultAmountIDR: 43000 },
  { name: "iCloud", categoryName: "Langganan Digital", emoji: "☁️", defaultAmountIDR: 15000 },
  { name: "Google One", categoryName: "Langganan Digital", emoji: "☁️", defaultAmountIDR: 26900 },
  { name: "ChatGPT Plus", categoryName: "Langganan Digital", emoji: "🤖", defaultAmountIDR: 330000 },
  { name: "Claude Pro", categoryName: "Langganan Digital", emoji: "🧡", defaultAmountIDR: 330000 },
  { name: "Notion", categoryName: "Langganan Digital", emoji: "📝", defaultAmountIDR: 80000 },
  { name: "Canva Pro", categoryName: "Langganan Digital", emoji: "🎨", defaultAmountIDR: 55000 },
  // Self care / gym
  { name: "Gym / Fitness", categoryName: "Self-Care", emoji: "🏋️" },
];

// Template cicilan / hutang
export const DEBT_TEMPLATES: Array<{ name: string; emoji: string }> = [
  { name: "KPR (Kredit Rumah)", emoji: "🏠" },
  { name: "KKB (Kredit Mobil)", emoji: "🚗" },
  { name: "Kredit Motor", emoji: "🏍️" },
  { name: "Pinjol / Personal Loan", emoji: "📱" },
  { name: "CC Installment", emoji: "💳" },
  { name: "KTA Bank", emoji: "🏦" },
  { name: "Student Loan", emoji: "🎓" },
  { name: "Pinjaman Keluarga", emoji: "👪" },
];

// Template investasi
export const INVESTMENT_TEMPLATES: Array<{
  type: "gold" | "crypto" | "stock" | "mutual_fund" | "forex" | "deposit" | "bond" | "property" | "other";
  name: string;
  emoji: string;
  color: string;
  defaultPlatform?: string;
}> = [
  { type: "gold", name: "Emas Antam", emoji: "🥇", color: "#eab308", defaultPlatform: "Antam" },
  { type: "gold", name: "Tabungan Emas Pegadaian", emoji: "🥇", color: "#eab308", defaultPlatform: "Pegadaian" },
  { type: "gold", name: "Emas Pluang", emoji: "🥇", color: "#eab308", defaultPlatform: "Pluang" },
  { type: "crypto", name: "Bitcoin", emoji: "₿", color: "#f7931a" },
  { type: "crypto", name: "Ethereum", emoji: "⟠", color: "#627eea" },
  { type: "crypto", name: "Crypto Portfolio", emoji: "🪙", color: "#8b5cf6" },
  { type: "stock", name: "Saham IDX", emoji: "📊", color: "#dc2626", defaultPlatform: "Ajaib/Stockbit" },
  { type: "stock", name: "Saham US", emoji: "📈", color: "#2563eb", defaultPlatform: "Interactive Brokers" },
  { type: "stock", name: "Saham MY (Bursa)", emoji: "📈", color: "#16a34a" },
  { type: "mutual_fund", name: "Reksadana Pasar Uang", emoji: "💰", color: "#16a34a" },
  { type: "mutual_fund", name: "Reksadana Saham", emoji: "📈", color: "#0d9488" },
  { type: "mutual_fund", name: "Reksadana Obligasi", emoji: "📃", color: "#7c3aed" },
  { type: "deposit", name: "Deposito Bank", emoji: "🏦", color: "#0891b2" },
  { type: "bond", name: "SBN / ORI", emoji: "📃", color: "#059669" },
  { type: "forex", name: "Forex Trading", emoji: "💱", color: "#f97316" },
  { type: "property", name: "Properti", emoji: "🏢", color: "#6366f1" },
  { type: "other", name: "Aset Lainnya", emoji: "💎", color: "#ec4899" },
];

// Template aset fisik (rumah, mobil, gadget, dll)
export const ASSET_TEMPLATES: Array<{
  type: "property" | "vehicle" | "electronics" | "collectible" | "other";
  subtype: string;
  name: string;
  emoji: string;
  detailsHint: string; // contoh detail yang bagus diisi
}> = [
  // Property
  { type: "property", subtype: "house", name: "Rumah", emoji: "🏠", detailsHint: "misal: LT 120m², LB 80m², Bintaro" },
  { type: "property", subtype: "apartment", name: "Apartment", emoji: "🏢", detailsHint: "misal: Studio 30m², Taman Anggrek, lantai 15" },
  { type: "property", subtype: "land", name: "Tanah", emoji: "🌳", detailsHint: "misal: 500m², Depok" },
  { type: "property", subtype: "kos", name: "Kost / Rumah Kontrakan", emoji: "🏡", detailsHint: "misal: 10 kamar, Jogja" },
  // Vehicle
  { type: "vehicle", subtype: "car", name: "Mobil", emoji: "🚗", detailsHint: "misal: Honda Brio 2020 AT, 45rb km, silver" },
  { type: "vehicle", subtype: "motorcycle", name: "Motor", emoji: "🏍️", detailsHint: "misal: Yamaha NMax 2022, 12rb km" },
  { type: "vehicle", subtype: "bicycle", name: "Sepeda", emoji: "🚲", detailsHint: "misal: Polygon Siskiu D7 2023" },
  // Electronics
  { type: "electronics", subtype: "phone", name: "HP / iPhone", emoji: "📱", detailsHint: "misal: iPhone 15 Pro 256GB Natural Titanium" },
  { type: "electronics", subtype: "laptop", name: "Laptop / MacBook", emoji: "💻", detailsHint: "misal: MacBook Air M2 2022 16GB/512GB" },
  { type: "electronics", subtype: "camera", name: "Kamera", emoji: "📷", detailsHint: "misal: Sony A7 IV" },
  { type: "electronics", subtype: "gadget", name: "Gadget Lain", emoji: "🎮", detailsHint: "misal: PS5, iPad Air, Apple Watch" },
  // Collectible
  { type: "collectible", subtype: "watch", name: "Jam Tangan", emoji: "⌚", detailsHint: "misal: Seiko SKX007, kondisi mint" },
  { type: "collectible", subtype: "art", name: "Art / Koleksi", emoji: "🖼️", detailsHint: "misal: Lukisan, action figure limited edition" },
  { type: "collectible", subtype: "shoes", name: "Sneakers", emoji: "👟", detailsHint: "misal: Jordan 1 Chicago 2023" },
  // Other
  { type: "other", subtype: "furniture", name: "Furniture / Home Goods", emoji: "🛋️", detailsHint: "" },
  { type: "other", subtype: "other", name: "Aset Lainnya", emoji: "💎", detailsHint: "" },
];

// Template goal hidup
export const GOAL_TEMPLATES: Array<{
  name: string;
  emoji: string;
  hint: string;
  defaultAmountIDR?: number;
}> = [
  { name: "Dana Darurat", emoji: "🛡️", hint: "Minimal 6× pengeluaran bulanan", defaultAmountIDR: 60_000_000 },
  { name: "Nikah", emoji: "💍", hint: "Range Rp 100-400jt tergantung konsep", defaultAmountIDR: 200_000_000 },
  { name: "Naik Haji", emoji: "🕋", hint: "Reguler ~Rp 60jt, Plus ~Rp 250-400jt", defaultAmountIDR: 60_000_000 },
  { name: "Umrah", emoji: "🕌", hint: "Range Rp 25-40jt per orang", defaultAmountIDR: 30_000_000 },
  { name: "DP Rumah", emoji: "🏠", hint: "20-30% dari harga rumah", defaultAmountIDR: 200_000_000 },
  { name: "Beli Mobil", emoji: "🚗", hint: "Cash atau DP 20-30%", defaultAmountIDR: 250_000_000 },
  { name: "Beli Motor", emoji: "🏍️", hint: "DP cash", defaultAmountIDR: 25_000_000 },
  { name: "Liburan Jepang", emoji: "🗾", hint: "~Rp 25-35jt per orang", defaultAmountIDR: 30_000_000 },
  { name: "Liburan Eropa", emoji: "🗼", hint: "~Rp 40-60jt per orang", defaultAmountIDR: 50_000_000 },
  { name: "Pendidikan Anak", emoji: "🎓", hint: "Kuliah S1 Rp 150-500jt", defaultAmountIDR: 200_000_000 },
  { name: "Beli iPhone / Gadget", emoji: "📱", hint: "Nabung buat gadget baru", defaultAmountIDR: 20_000_000 },
  { name: "Modal Usaha", emoji: "💼", hint: "Buat buka bisnis", defaultAmountIDR: 50_000_000 },
  { name: "Dana Pensiun", emoji: "🧓", hint: "Target 70% income aktif × 20 thn", defaultAmountIDR: 2_000_000_000 },
];

export const DEPENDENT_RELATIONSHIPS = [
  { value: "parent", label: "Orang Tua", emoji: "👵" },
  { value: "sibling", label: "Kakak/Adik", emoji: "👫" },
  { value: "child", label: "Anak", emoji: "👶" },
  { value: "partner", label: "Pasangan", emoji: "💑" },
  { value: "other", label: "Lainnya", emoji: "👤" },
];

// Keyword-based kategori suggestion dari merchant/items
const RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["grab", "gojek", "gocar", "maxim", "bluebird", "taxi", "bolt", "indrive"], category: "Transport" },
  { keywords: ["shell", "petronas", "pertamina", "bp ", "caltex", "bensin", "fuel"], category: "Transport" },
  { keywords: ["mrt", "lrt", "krl", "transjakarta", "commuter", "ktm", "rapidkl"], category: "Transport" },
  { keywords: ["indomaret", "alfamart", "alfa midi", "superindo", "hypermart", "giant", "tesco", "lotus", "aeon", "jaya grocer", "mydin"], category: "Groceries" },
  { keywords: ["starbucks", "kopi kenangan", "janji jiwa", "fore", "tomoro", "dunkin", "excelso", "kulo"], category: "Jajan & Kopi" },
  { keywords: ["mcd", "mcdonald", "kfc", "burger king", "pizza", "sushi", "ramen", "warung", "resto", "cafe", "secret recipe", "old town", "marrybrown", "texas chicken", "solaria", "hoka"], category: "Makan Luar" },
  { keywords: ["pln", "tnb", "pdam", "syabas"], category: "Utilitas" },
  { keywords: ["indihome", "biznet", "maxis", "celcom", "digi", "umobile", "xl", "telkomsel", "indosat", "smartfren", "myunifi", "by.u"], category: "Internet & Pulsa" },
  { keywords: ["netflix", "spotify", "youtube premium", "disney", "iflix", "hbo", "apple music", "tidal", "prime video", "canva", "notion", "claude", "chatgpt"], category: "Langganan Digital" },
  { keywords: ["cinema", "cgv", "xxi", "tgv", "gsc", "bioskop", "spotify concert", "tix id"], category: "Hiburan" },
  { keywords: ["shopee", "tokopedia", "lazada", "zalora", "uniqlo", "h&m", "zara", "cotton on", "tiktok shop"], category: "Belanja Online" },
  { keywords: ["kimia farma", "guardian", "watsons", "century", "apotek", "clinic", "klinik", "hospital", "rumah sakit", "halodoc"], category: "Kesehatan" },
  { keywords: ["salon", "nail", "spa", "facial", "barbershop", "johnny andrean", "chloe"], category: "Self-Care" },
];

export function suggestCategoryName(
  merchant?: string | null,
  items?: Array<{ name: string }>
): string | null {
  const haystack = [merchant ?? "", ...(items?.map((i) => i.name) ?? [])].join(" ").toLowerCase();
  if (!haystack.trim()) return null;
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) return rule.category;
    }
  }
  return null;
}
