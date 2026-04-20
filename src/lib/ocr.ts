import Anthropic from "@anthropic-ai/sdk";

/**
 * The structured receipt draft returned by Claude Vision.
 */
export type ReceiptDraft = {
  merchant: string | null;
  date: string | null; // ISO date (yyyy-mm-dd)
  currency: string | null; // e.g. "IDR" | "MYR" | "USD" | "SGD"
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

const OCR_PROMPT = `You are a receipt parser. Analyze the uploaded receipt image and return ONLY valid JSON (no prose, no markdown fences) with this exact schema:

{
  "merchant": string | null,
  "date": string | null,                // ISO date yyyy-mm-dd if visible, else null
  "currency": "IDR" | "MYR" | "USD" | "SGD" | null,   // detect from symbols: Rp/IDR -> IDR, RM/MYR -> MYR, $/USD -> USD, S$ -> SGD
  "total": number | null,               // grand total as number (no thousand separators)
  "tax": number | null,                 // tax/SST/PPN amount if shown separately
  "items": [
    { "name": string, "quantity": number | null, "unit_price": number | null, "total": number | null,
      "category_hint": string | null }    // short English hint like "food", "transport", "groceries"
  ],
  "notes": string | null                // anything unusual worth flagging
}

Rules:
- Parse Indonesian, Malay, or English text.
- For IDR, amounts often have no decimal; treat "12.000" or "12,000" as 12000.
- For MYR, amounts typically have two decimals.
- If the total is clearly marked (Total, Grand Total, Jumlah), use that.
- If you cannot read a field, use null. Never guess a merchant if unclear.
- Do NOT wrap the output in \`\`\`json fences. Output must start with { and end with }.`;

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

/**
 * Call Claude Vision to extract structured fields from a receipt image.
 */
export async function extractReceipt(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ draft: ReceiptDraft; raw: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
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
          { type: "text", text: OCR_PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return a text block");
  }
  const raw = stripJsonFences(textBlock.text);

  let parsed: ReceiptDraft;
  try {
    parsed = JSON.parse(raw) as ReceiptDraft;
  } catch (err) {
    throw new Error(`Failed to parse receipt JSON: ${(err as Error).message}\nRaw: ${raw.slice(0, 400)}`);
  }

  // Basic normalization
  if (parsed.date) {
    const m = parsed.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) parsed.date = null;
  }
  if (parsed.currency && !["IDR", "MYR", "USD", "SGD"].includes(parsed.currency)) {
    parsed.currency = null;
  }
  if (!Array.isArray(parsed.items)) parsed.items = [];

  return { draft: parsed, raw };
}
