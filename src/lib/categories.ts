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
  { name: "Project / Freelance", kind: "income", nature: "variable", emoji: "💼", color: "#10b981" },
  { name: "Bonus", kind: "income", nature: "variable", emoji: "🎁", color: "#059669" },
  { name: "Dividen / Investasi", kind: "income", nature: "variable", emoji: "📈", color: "#0d9488" },
  { name: "Lainnya (Income)", kind: "income", nature: "variable", emoji: "➕", color: "#34d399" },
];

// Template akun populer di Indonesia + Malaysia
export const ACCOUNT_TEMPLATES: Array<{
  name: string;
  type: "bank" | "ewallet" | "cash" | "credit_card";
  currency: "IDR" | "MYR";
  emoji: string;
  color: string;
}> = [
  // Bank ID
  { name: "BCA", type: "bank", currency: "IDR", emoji: "🏦", color: "#0050a0" },
  { name: "Mandiri", type: "bank", currency: "IDR", emoji: "🏦", color: "#003d7a" },
  { name: "BRI", type: "bank", currency: "IDR", emoji: "🏦", color: "#00529b" },
  { name: "BNI", type: "bank", currency: "IDR", emoji: "🏦", color: "#f58220" },
  { name: "Jenius", type: "bank", currency: "IDR", emoji: "🔷", color: "#0088cc" },
  { name: "Jago", type: "bank", currency: "IDR", emoji: "🟠", color: "#ff6600" },
  { name: "Seabank", type: "bank", currency: "IDR", emoji: "🌊", color: "#ee4d2d" },
  // Bank MY
  { name: "Maybank MYR", type: "bank", currency: "MYR", emoji: "🏦", color: "#ffc400" },
  { name: "CIMB MY", type: "bank", currency: "MYR", emoji: "🏦", color: "#c8102e" },
  { name: "Public Bank", type: "bank", currency: "MYR", emoji: "🏦", color: "#005bbb" },
  { name: "Touch 'n Go eWallet", type: "ewallet", currency: "MYR", emoji: "📱", color: "#1e3a8a" },
  // E-wallet ID
  { name: "GoPay", type: "ewallet", currency: "IDR", emoji: "🟢", color: "#00aa13" },
  { name: "OVO", type: "ewallet", currency: "IDR", emoji: "🟣", color: "#4c2a86" },
  { name: "DANA", type: "ewallet", currency: "IDR", emoji: "🔵", color: "#118eea" },
  { name: "ShopeePay", type: "ewallet", currency: "IDR", emoji: "🟠", color: "#ee4d2d" },
  // Cash
  { name: "Cash Dompet", type: "cash", currency: "IDR", emoji: "💵", color: "#22c55e" },
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
  { keywords: ["netflix", "spotify", "youtube premium", "disney", "iflix", "hbo", "apple music", "tidal", "prime video", "canva", "notion"], category: "Langganan Digital" },
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
