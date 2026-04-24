import type Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeDualBase } from "@/lib/fx";
import { toNumber } from "@/lib/currency";
import { suggestCategoryName } from "@/lib/categories";

/**
 * Tools Dukun Pesugihan dapat invoke lewat tool-use.
 * Semua execute di server, always scoped ke userId. Dukun gak boleh operate
 * lintas user, dan gak boleh hapus massal — keep ke CRUD single-record.
 */
export const DUKUN_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "list_accounts",
    description:
      "List semua akun (bank/ewallet/cash/credit_card) user yg aktif. Pakai ini KALAU lo butuh tau accountId sebelum add_transaction atau update_account_balance.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_categories",
    description:
      "List semua kategori expense/income user. Pakai ini KALAU lo butuh tau categoryId sebelum add_transaction atau add_fixed_expense.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_goals",
    description: "List semua goals aktif user.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_assets",
    description: "List semua physical assets (rumah, mobil, gadget, dll).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "add_transaction",
    description:
      "Catat transaksi baru income atau expense. Pake ketika user bilang \"catet gw beli X Rp Y\", \"tadi abis makan Rp Z\", \"gajian masuk Rp A\", dll. Panggil list_accounts & list_categories dulu kalau belum tau ID-nya. Default date hari ini kalau user gak sebut.",
    input_schema: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "Account ID dari list_accounts" },
        categoryId: { type: "string", description: "Category ID dari list_categories" },
        type: { type: "string", enum: ["income", "expense"] },
        amount: { type: "number", description: "Positive number in the given currency" },
        currency: { type: "string", enum: ["IDR", "MYR", "USD", "SGD"] },
        date: {
          type: "string",
          description: "ISO date yyyy-mm-dd. Default hari ini.",
        },
        merchant: { type: "string", description: "Nama toko/merchant, nullable" },
        note: { type: "string", description: "Catatan bebas, nullable" },
        isBoros: {
          type: "boolean",
          description: "true kalau user bilang kalap/impulse/boros",
        },
      },
      required: ["accountId", "categoryId", "type", "amount", "currency"],
    },
  },
  {
    name: "update_account_balance",
    description:
      "Set saldo akun ke nilai baru (bukan tambah/kurangi). Pake ketika user bilang \"saldo BCA gw skrg 5jt\", \"update OVO gw jadi 200rb\".",
    input_schema: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        newBalance: { type: "number" },
      },
      required: ["accountId", "newBalance"],
    },
  },
  {
    name: "add_goal",
    description:
      "Bikin goal baru (nikah, rumah, mobil, umrah, dll). Pake ketika user bilang \"tambahin goal gw mau nikah Rp 200jt 2 tahun lagi\".",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        emoji: { type: "string", description: "1-2 emoji mewakili goal, misal 💍 🏠 🚗" },
        targetAmount: { type: "number" },
        currency: { type: "string", enum: ["IDR", "MYR", "USD", "SGD"] },
        currentSaved: { type: "number", description: "Default 0 kalau belum nabung" },
        targetDate: { type: "string", description: "yyyy-mm-dd atau null" },
        priority: {
          type: "number",
          description: "1=high, 2=normal, 3=low. Default 2.",
        },
      },
      required: ["name", "targetAmount", "currency"],
    },
  },
  {
    name: "add_asset",
    description:
      "Tambah aset fisik (rumah, mobil, gadget, dll). Pake ketika user bilang \"tambahin mobil gw Honda Brio 2020 beli 150jt\".",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        type: {
          type: "string",
          enum: ["property", "vehicle", "electronics", "collectible", "other"],
        },
        subtype: {
          type: "string",
          description: "house/apartment/car/motorcycle/phone/laptop/etc",
        },
        emoji: { type: "string" },
        purchasePrice: { type: "number" },
        purchaseDate: { type: "string", description: "yyyy-mm-dd" },
        currentValue: {
          type: "number",
          description: "Default = purchasePrice kalau user gak sebut",
        },
        currency: { type: "string", enum: ["IDR", "MYR", "USD", "SGD"] },
        details: { type: "string" },
      },
      required: ["name", "type", "purchasePrice", "purchaseDate", "currency"],
    },
  },
  {
    name: "update_asset_value",
    description: "Update nilai aset sekarang (manual). Pake kalau user bilang \"motor gw skrg nilainya 18jt\".",
    input_schema: {
      type: "object",
      properties: {
        assetId: { type: "string" },
        newValue: { type: "number" },
      },
      required: ["assetId", "newValue"],
    },
  },
  {
    name: "add_fixed_expense",
    description:
      "Tambah pengeluaran fix bulanan (Netflix, kost, internet, cicilan). Pake ketika user bilang \"gw langganan Spotify Rp 55rb tiap bulan\".",
    input_schema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        name: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", enum: ["IDR", "MYR", "USD", "SGD"] },
        dayOfMonth: { type: "number", description: "1-31. Default 1." },
      },
      required: ["categoryId", "name", "amount", "currency"],
    },
  },
  {
    name: "list_wishlist",
    description: "List wishlist items user (item yg dipertimbangin buat dibeli).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "add_wishlist",
    description:
      'Simpen item ke wishlist SETELAH simulasi affordability/financing. Pake ketika user bilang "simpen ke wishlist", "catet", "save ini" setelah bahas "pengen beli X". JANGAN langsung simpan sebelum tanya harga + simulasi. decisionNote WAJIB isi ringkasan analisa (realistis/engga + saran). projectedDate = estimasi tanggal paling cepat bisa dibeli cash berdasarkan free cash flow.',
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: 'Nama item (e.g. "iPhone 16 Pro 256GB", "Honda Brio 2020 bekas")' },
        emoji: { type: "string", description: "Emoji mewakili item" },
        estimatedPrice: { type: "number" },
        currency: { type: "string", enum: ["IDR", "MYR", "USD", "SGD"] },
        priority: { type: "number", description: "1=urgent/pengen banget, 2=nice, 3=someday" },
        category: { type: "string", description: "gadget|travel|experience|home|vehicle|other" },
        note: { type: "string", description: "Catatan bebas dari user" },
        financingPlan: {
          type: "string",
          description: 'Ringkas rencana financing kalau ada. Misal: "cicilan 12 bln Rp 1.75jt, bunga 0%" atau "cash setelah nabung 8 bulan".',
        },
        projectedDate: {
          type: "string",
          description: "yyyy-mm-dd estimasi paling cepat bisa kebeli cash dari free cash flow. Null kalau gak realistis.",
        },
        decisionNote: {
          type: "string",
          description: "Kesimpulan Dukun: realistis/engga, untung/rugi beli, recommend cash vs cicilan. 1-3 kalimat padat.",
        },
      },
      required: ["name", "estimatedPrice", "currency", "decisionNote"],
    },
  },
  {
    name: "update_wishlist",
    description: "Update wishlist item (ganti priority, harga, decisionNote, dll).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        estimatedPrice: { type: "number" },
        priority: { type: "number" },
        financingPlan: { type: "string" },
        projectedDate: { type: "string" },
        decisionNote: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "remove_wishlist",
    description: 'Hapus wishlist item (user bilang "udah gak jadi", "hapus aja", "lupain"). Konfirm dulu sebelum hapus.',
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "convert_wishlist_to_goal",
    description: 'Convert wishlist item ke Goal (committed savings target). Pake kalau user bilang "yaudah gw nabung buat ini aja", "jadikan goal". Akan mark wishlist isConverted=true dan create Goal baru dengan targetAmount = estimatedPrice.',
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        targetDate: { type: "string", description: "yyyy-mm-dd deadline goal; null = tanpa deadline" },
      },
      required: ["id"],
    },
  },
];

/**
 * Execute a tool call. Returns a JSON-serializable result that's sent
 * back to Claude as a tool_result.
 */
export async function executeTool(
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    switch (toolName) {
      case "list_accounts": {
        const accounts = await prisma.account.findMany({
          where: { userId, isActive: true },
          select: { id: true, name: true, type: true, currency: true, balance: true, emoji: true },
        });
        return accounts.map((a) => ({ ...a, balance: toNumber(a.balance) }));
      }

      case "list_categories": {
        const cats = await prisma.category.findMany({
          where: { userId },
          select: { id: true, name: true, kind: true, nature: true, emoji: true },
        });
        return cats;
      }

      case "list_goals": {
        const goals = await prisma.goal.findMany({
          where: { userId, isActive: true },
          select: {
            id: true,
            name: true,
            emoji: true,
            targetAmount: true,
            currentSaved: true,
            currency: true,
            targetDate: true,
            priority: true,
          },
        });
        return goals.map((g) => ({
          ...g,
          targetAmount: toNumber(g.targetAmount),
          currentSaved: toNumber(g.currentSaved),
        }));
      }

      case "list_assets": {
        const assets = await prisma.asset.findMany({
          where: { userId, isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            subtype: true,
            emoji: true,
            currentValue: true,
            purchasePrice: true,
            currency: true,
          },
        });
        return assets.map((a) => ({
          ...a,
          currentValue: toNumber(a.currentValue),
          purchasePrice: toNumber(a.purchasePrice),
        }));
      }

      case "add_transaction": {
        const a = args as {
          accountId: string;
          categoryId: string;
          type: "income" | "expense";
          amount: number;
          currency: string;
          date?: string;
          merchant?: string | null;
          note?: string | null;
          isBoros?: boolean;
        };
        const [account, category] = await Promise.all([
          prisma.account.findFirst({ where: { id: a.accountId, userId } }),
          prisma.category.findFirst({ where: { id: a.categoryId, userId } }),
        ]);
        if (!account) return { error: "Account not found or not yours" };
        if (!category) return { error: "Category not found" };
        if (category.kind !== a.type) {
          return { error: `Category '${category.name}' adalah ${category.kind}, not ${a.type}` };
        }
        const date = a.date ? new Date(a.date) : new Date();
        const { amountIDR, amountMYR } = await computeDualBase(a.amount, a.currency, date);
        const created = await prisma.$transaction(async (trx) => {
          const tx = await trx.transaction.create({
            data: {
              userId,
              accountId: a.accountId,
              categoryId: a.categoryId,
              type: a.type,
              amount: new Prisma.Decimal(a.amount),
              currency: a.currency,
              amountIDR: new Prisma.Decimal(amountIDR),
              amountMYR: new Prisma.Decimal(amountMYR),
              date,
              merchant: a.merchant ?? null,
              note: a.note ?? null,
              isBoros: a.isBoros ?? false,
            },
          });
          if (account.currency === a.currency) {
            const delta = a.type === "income" ? a.amount : -a.amount;
            await trx.account.update({
              where: { id: account.id },
              data: { balance: { increment: new Prisma.Decimal(delta) } },
            });
          }
          return tx;
        });
        const fresh = await prisma.account.findUnique({ where: { id: account.id } });
        return {
          ok: true,
          transactionId: created.id,
          accountName: account.name,
          newAccountBalance: fresh ? toNumber(fresh.balance) : null,
          categoryName: category.name,
          suggestedTag:
            a.isBoros
              ? "boros"
              : category.nature === "variable"
              ? (suggestCategoryName(a.merchant ?? null) ?? undefined)
              : undefined,
        };
      }

      case "update_account_balance": {
        const a = args as { accountId: string; newBalance: number };
        const acc = await prisma.account.findFirst({ where: { id: a.accountId, userId } });
        if (!acc) return { error: "Account not found" };
        const updated = await prisma.account.update({
          where: { id: a.accountId },
          data: { balance: new Prisma.Decimal(a.newBalance) },
        });
        return {
          ok: true,
          accountName: acc.name,
          oldBalance: toNumber(acc.balance),
          newBalance: toNumber(updated.balance),
        };
      }

      case "add_goal": {
        const a = args as {
          name: string;
          emoji?: string;
          targetAmount: number;
          currency: string;
          currentSaved?: number;
          targetDate?: string | null;
          priority?: number;
        };
        const created = await prisma.goal.create({
          data: {
            userId,
            name: a.name,
            emoji: a.emoji ?? "🎯",
            targetAmount: new Prisma.Decimal(a.targetAmount),
            currency: a.currency,
            currentSaved: new Prisma.Decimal(a.currentSaved ?? 0),
            targetDate: a.targetDate ? new Date(a.targetDate) : null,
            priority: a.priority ?? 2,
          },
        });
        return { ok: true, goalId: created.id, goalName: created.name };
      }

      case "add_asset": {
        const a = args as {
          name: string;
          type: string;
          subtype?: string | null;
          emoji?: string;
          purchasePrice: number;
          purchaseDate: string;
          currentValue?: number;
          currency: string;
          details?: string | null;
        };
        const created = await prisma.asset.create({
          data: {
            userId,
            name: a.name,
            type: a.type,
            subtype: a.subtype ?? null,
            emoji: a.emoji ?? "💎",
            purchasePrice: new Prisma.Decimal(a.purchasePrice),
            purchaseDate: new Date(a.purchaseDate),
            currentValue: new Prisma.Decimal(a.currentValue ?? a.purchasePrice),
            currency: a.currency,
            details: a.details ?? null,
            valuationMethod: "manual",
          },
        });
        return { ok: true, assetId: created.id, assetName: created.name };
      }

      case "update_asset_value": {
        const a = args as { assetId: string; newValue: number };
        const existing = await prisma.asset.findFirst({ where: { id: a.assetId, userId } });
        if (!existing) return { error: "Asset not found" };
        const updated = await prisma.asset.update({
          where: { id: a.assetId },
          data: {
            currentValue: new Prisma.Decimal(a.newValue),
            valuationMethod: "manual",
            lastValuationAt: new Date(),
          },
        });
        return {
          ok: true,
          name: existing.name,
          oldValue: toNumber(existing.currentValue),
          newValue: toNumber(updated.currentValue),
        };
      }

      case "add_fixed_expense": {
        const a = args as {
          categoryId: string;
          name: string;
          amount: number;
          currency: string;
          dayOfMonth?: number;
        };
        const cat = await prisma.category.findFirst({
          where: { id: a.categoryId, userId, kind: "expense" },
        });
        if (!cat) return { error: "Category not found (expense)" };
        const dom = a.dayOfMonth ?? 1;
        const nextDue = new Date();
        nextDue.setDate(dom);
        if (nextDue < new Date()) nextDue.setMonth(nextDue.getMonth() + 1);
        const created = await prisma.fixedExpense.create({
          data: {
            userId,
            categoryId: a.categoryId,
            name: a.name,
            amount: new Prisma.Decimal(a.amount),
            currency: a.currency,
            dayOfMonth: dom,
            nextDue,
          },
        });
        return { ok: true, fixedExpenseId: created.id, name: created.name, category: cat.name };
      }

      case "list_wishlist": {
        const items = await prisma.wishlist.findMany({
          where: { userId, isConverted: false },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        });
        return items.map((w) => ({
          id: w.id,
          name: w.name,
          emoji: w.emoji,
          estimatedPrice: toNumber(w.estimatedPrice),
          currency: w.currency,
          priority: w.priority,
          category: w.category,
          note: w.note,
          financingPlan: w.financingPlan,
          projectedDate: w.projectedDate?.toISOString().slice(0, 10) ?? null,
          decisionNote: w.decisionNote,
          createdAt: w.createdAt.toISOString().slice(0, 10),
        }));
      }

      case "add_wishlist": {
        const a = args as {
          name: string;
          emoji?: string;
          estimatedPrice: number;
          currency: string;
          priority?: number;
          category?: string | null;
          note?: string | null;
          financingPlan?: string | null;
          projectedDate?: string | null;
          decisionNote: string;
        };
        const created = await prisma.wishlist.create({
          data: {
            userId,
            name: a.name,
            emoji: a.emoji ?? "🛒",
            estimatedPrice: new Prisma.Decimal(a.estimatedPrice),
            currency: a.currency,
            priority: a.priority ?? 2,
            category: a.category ?? null,
            note: a.note ?? null,
            financingPlan: a.financingPlan ?? null,
            projectedDate: a.projectedDate ? new Date(a.projectedDate) : null,
            decisionNote: a.decisionNote,
          },
        });
        return { ok: true, wishlistId: created.id, name: created.name };
      }

      case "update_wishlist": {
        const a = args as {
          id: string;
          name?: string;
          estimatedPrice?: number;
          priority?: number;
          financingPlan?: string;
          projectedDate?: string;
          decisionNote?: string;
        };
        const existing = await prisma.wishlist.findFirst({ where: { id: a.id, userId } });
        if (!existing) return { error: "Wishlist not found" };
        const updated = await prisma.wishlist.update({
          where: { id: a.id },
          data: {
            name: a.name,
            estimatedPrice:
              a.estimatedPrice != null ? new Prisma.Decimal(a.estimatedPrice) : undefined,
            priority: a.priority,
            financingPlan: a.financingPlan,
            projectedDate: a.projectedDate ? new Date(a.projectedDate) : undefined,
            decisionNote: a.decisionNote,
          },
        });
        return { ok: true, name: updated.name };
      }

      case "remove_wishlist": {
        const a = args as { id: string };
        const existing = await prisma.wishlist.findFirst({ where: { id: a.id, userId } });
        if (!existing) return { error: "Wishlist not found" };
        await prisma.wishlist.delete({ where: { id: a.id } });
        return { ok: true };
      }

      case "convert_wishlist_to_goal": {
        const a = args as { id: string; targetDate?: string | null };
        const wish = await prisma.wishlist.findFirst({ where: { id: a.id, userId } });
        if (!wish) return { error: "Wishlist not found" };
        const goal = await prisma.$transaction(async (trx) => {
          const g = await trx.goal.create({
            data: {
              userId,
              name: wish.name,
              emoji: wish.emoji,
              targetAmount: wish.estimatedPrice,
              currentSaved: new Prisma.Decimal(0),
              currency: wish.currency,
              targetDate: a.targetDate ? new Date(a.targetDate) : null,
              priority: wish.priority,
              note: wish.note,
            },
          });
          await trx.wishlist.update({ where: { id: wish.id }, data: { isConverted: true } });
          return g;
        });
        return { ok: true, goalId: goal.id, goalName: goal.name };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { error: (err as Error).message };
  }
}
