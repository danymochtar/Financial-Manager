export const DEFAULT_CATEGORIES: Array<{
  name: string;
  kind: "income" | "expense";
  icon: string;
  color: string;
}> = [
  // Expenses
  { name: "Makan & Minum", kind: "expense", icon: "utensils", color: "#f97316" },
  { name: "Transport", kind: "expense", icon: "car", color: "#0ea5e9" },
  { name: "Belanja", kind: "expense", icon: "shopping-bag", color: "#ec4899" },
  { name: "Groceries", kind: "expense", icon: "shopping-cart", color: "#16a34a" },
  { name: "Tagihan & Utilitas", kind: "expense", icon: "receipt", color: "#eab308" },
  { name: "Sewa / Kost", kind: "expense", icon: "home", color: "#8b5cf6" },
  { name: "Kesehatan", kind: "expense", icon: "heart-pulse", color: "#ef4444" },
  { name: "Hiburan", kind: "expense", icon: "clapperboard", color: "#a855f7" },
  { name: "Traveling", kind: "expense", icon: "plane", color: "#06b6d4" },
  { name: "Langganan Digital", kind: "expense", icon: "monitor", color: "#64748b" },
  { name: "Lain-lain (Expense)", kind: "expense", icon: "ellipsis", color: "#94a3b8" },
  // Income
  { name: "Gaji", kind: "income", icon: "wallet", color: "#22c55e" },
  { name: "Project / Freelance", kind: "income", icon: "briefcase", color: "#10b981" },
  { name: "Bonus", kind: "income", icon: "gift", color: "#059669" },
  { name: "Investasi", kind: "income", icon: "trending-up", color: "#0d9488" },
  { name: "Lain-lain (Income)", kind: "income", icon: "plus-circle", color: "#34d399" },
];

export const DEFAULT_SOURCES: Array<{ name: string; country: string; color: string }> = [
  { name: "Kerjaan Malaysia", country: "MY", color: "#ef4444" },
  { name: "Project Indonesia", country: "ID", color: "#ef4444" },
  { name: "Pribadi", country: "ID", color: "#6366f1" },
];

/**
 * Keyword-based category suggestion. Given a merchant name and receipt items,
 * return the best-matching category name from a user's category list.
 * Returns null if no confident match.
 */
const RULES: Array<{ keywords: string[]; category: string }> = [
  // Transport
  { keywords: ["grab", "gojek", "gocar", "maxim", "bluebird", "taxi", "bolt", "indrive"], category: "Transport" },
  { keywords: ["shell", "petronas", "pertamina", "bp ", "caltex", "bensin", "fuel", "esso"], category: "Transport" },
  { keywords: ["mrt", "lrt", "krl", "transjakarta", "commuter", "ktm", "rapidkl"], category: "Transport" },
  // Groceries
  { keywords: ["indomaret", "alfamart", "alfa midi", "superindo", "hypermart", "giant", "tesco", "lotus", "aeon", "jaya grocer", "village grocer", "mydin"], category: "Groceries" },
  // Makan
  { keywords: ["starbucks", "kopi kenangan", "janji jiwa", "fore", "tomoro", "kopitiam", "mamak", "mcd", "mcdonald", "kfc", "burger king", "pizza", "sushi", "ramen", "warung", "resto", "cafe", "secret recipe", "old town", "marrybrown"], category: "Makan & Minum" },
  // Utilities
  { keywords: ["pln", "tnb", "indihome", "biznet", "maxis", "celcom", "digi", "umobile", "xl", "telkomsel", "indosat", "smartfren", "myunifi", "pdam", "syabas"], category: "Tagihan & Utilitas" },
  // Entertainment / subs
  { keywords: ["netflix", "spotify", "youtube premium", "disney", "iflix", "hbo", "apple music", "tidal", "prime video"], category: "Langganan Digital" },
  { keywords: ["cinema", "cgv", "xxi", "tgv", "gsc", "bioskop"], category: "Hiburan" },
  // Shopping
  { keywords: ["shopee", "tokopedia", "lazada", "zalora", "uniqlo", "h&m", "zara", "cotton on"], category: "Belanja" },
  // Health
  { keywords: ["kimia farma", "guardian", "watsons", "century", "apotek", "clinic", "klinik", "hospital", "rumah sakit"], category: "Kesehatan" },
];

export function suggestCategoryName(merchant?: string | null, items?: Array<{ name: string }>): string | null {
  const haystack = [
    merchant ?? "",
    ...(items?.map((i) => i.name) ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (!haystack.trim()) return null;
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) return rule.category;
    }
  }
  return null;
}
