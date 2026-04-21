import Anthropic from "@anthropic-ai/sdk";

export type ReceiptDraft = {
  merchant: string | null;
  date: string | null;
  currency: string | null;
  total: number | null;
  tax: number | null;
  items: Array<{
    name: string;
    quantity: number | null;
    unit_price: number | null;
    total: number | null;
    category_hint: string | null;
  }>;
  notes: string | null;
};

export type BalanceDraft = {
  account_name: string | null; // "BCA", "Jenius", "GoPay", dll
  account_type: "bank" | "ewallet" | "credit_card" | "cash" | null;
  balance: number | null;
  currency: "IDR" | "MYR" | "USD" | "SGD" | null;
  credit_limit: number | null; // kalau kartu kredit
  notes: string | null;
};

const RECEIPT_PROMPT = `You are a receipt parser for a personal finance app. Analyze the receipt image and return ONLY valid JSON (no prose, no markdown fences):

{
  "merchant": string | null,
  "date": string | null,
  "currency": "IDR" | "MYR" | "USD" | "SGD" | null,
  "total": number | null,
  "tax": number | null,
  "items": [{ "name": string, "quantity": number | null, "unit_price": number | null, "total": number | null, "category_hint": string | null }],
  "notes": string | null
}

Rules:
- Parse Indonesian, Malay, or English.
- For IDR, "12.000" / "12,000" = 12000 (no decimals typical).
- For MYR, two decimals typical.
- Use the grand total ("Total", "Jumlah", "Grand Total").
- category_hint: short English like "food", "transport", "groceries", "entertainment".
- Output MUST start with { and end with }. No fences.`;

const BALANCE_PROMPT = `You are a banking-app screenshot parser for a personal finance app. The user has uploaded a screenshot of their bank/e-wallet/credit-card app. Extract the current balance and account info. Return ONLY valid JSON:

{
  "account_name": string | null,          // "BCA", "Jenius", "GoPay", "OVO", "Maybank", etc.
  "account_type": "bank" | "ewallet" | "credit_card" | "cash" | null,
  "balance": number | null,               // the MAIN balance/saldo visible, as number
  "currency": "IDR" | "MYR" | "USD" | "SGD" | null,
  "credit_limit": number | null,          // if credit card, the card limit
  "notes": string | null
}

Rules:
- Detect from logo, header, or app branding (BCA mobile, Jenius, GoPay, OVO, DANA, ShopeePay, Maybank, etc.).
- "Rp" / "IDR" → IDR. "RM" / "MYR" → MYR.
- For IDR, strip thousand separators: "Rp 1.234.567" = 1234567.
- For credit card, balance = CURRENT OUTSTANDING (tagihan), not limit. Put limit in credit_limit.
- If multiple balances shown (e.g., savings + current), pick the most prominent/main.
- Output MUST start with { and end with }. No fences, no explanation.`;

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return t;
}

async function callVision<T>(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string
): Promise<{ parsed: T; raw: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_VISION_MODEL || "claude-sonnet-4-6";
  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: (mimeType as "image/jpeg") ?? "image/jpeg",
              data: imageBuffer.toString("base64"),
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block from Claude");
  const raw = stripJsonFences(block.text);
  try {
    const parsed = JSON.parse(raw) as T;
    return { parsed, raw };
  } catch (err) {
    throw new Error(`Failed parse JSON: ${(err as Error).message}\nRaw: ${raw.slice(0, 400)}`);
  }
}

export async function extractReceipt(buffer: Buffer, mimeType: string) {
  const { parsed, raw } = await callVision<ReceiptDraft>(buffer, mimeType, RECEIPT_PROMPT);
  if (parsed.date && !/^(\d{4})-(\d{2})-(\d{2})/.test(parsed.date)) parsed.date = null;
  if (parsed.currency && !["IDR", "MYR", "USD", "SGD"].includes(parsed.currency)) parsed.currency = null;
  if (!Array.isArray(parsed.items)) parsed.items = [];
  return { draft: parsed, raw };
}

export async function extractBalance(buffer: Buffer, mimeType: string) {
  const { parsed, raw } = await callVision<BalanceDraft>(buffer, mimeType, BALANCE_PROMPT);
  if (parsed.currency && !["IDR", "MYR", "USD", "SGD"].includes(parsed.currency)) parsed.currency = null;
  if (parsed.account_type && !["bank", "ewallet", "credit_card", "cash"].includes(parsed.account_type)) {
    parsed.account_type = null;
  }
  return { draft: parsed, raw };
}
