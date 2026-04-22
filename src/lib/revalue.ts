import Anthropic from "@anthropic-ai/sdk";

export type ValuationResult = {
  estimate: number;
  currency: string;
  reasoning: string;
};

const PROMPT = `You are a used-market valuation expert for Indonesia & Malaysia. Estimate the current fair market resale value for the asset described.

Output ONLY valid JSON (no fences, no prose):
{
  "estimate": number,          // your best estimate in the requested currency
  "currency": string,          // same as input currency
  "reasoning": string          // 1-2 short sentences in the user's locale explaining your logic (mention depreciation/appreciation rate, market comparables, condition)
}

Consider:
- Depreciation curves: cars ~10-15%/yr first year, 7-10%/yr after. Electronics: phones ~40-50%/yr, laptops 20-30%/yr. Watches vary (luxury can appreciate).
- Appreciation: Indonesian property historically ~5-10%/yr in major cities. Land varies by location.
- Condition & mileage for vehicles.
- Current market trends (EV adoption, iPhone cycles, Gen Z collectibles).
- If the asset is unusual or you're uncertain, still provide a best-effort range midpoint with a caveat in reasoning.

Be conservative rather than optimistic.`;

export async function revalueAsset(input: {
  name: string;
  type: string;
  subtype: string | null;
  details: string | null;
  purchasePrice: number;
  purchaseDate: Date;
  currency: string;
  locale: "id" | "en";
}): Promise<ValuationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_ADVISOR_MODEL || "claude-sonnet-4-6";

  const ageMonths = Math.max(
    0,
    Math.floor((Date.now() - input.purchaseDate.getTime()) / (30 * 24 * 3600 * 1000))
  );

  const localeNote =
    input.locale === "en"
      ? "Respond in English."
      : "Respond in casual Indonesian (lo/gw tone OK).";

  const user = `Asset to value:
- Name: ${input.name}
- Type: ${input.type}${input.subtype ? ` / ${input.subtype}` : ""}
- Details: ${input.details ?? "(none)"}
- Purchased: ${input.purchaseDate.toISOString().slice(0, 10)} for ${input.currency} ${input.purchasePrice.toLocaleString()}
- Age: ${ageMonths} months

${localeNote} Output JSON only.`;

  const response = await client.messages.create({
    model,
    max_tokens: 500,
    system: PROMPT,
    messages: [{ role: "user", content: user }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text from Claude");
  const raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(raw) as ValuationResult;
  if (typeof parsed.estimate !== "number" || !Number.isFinite(parsed.estimate)) {
    throw new Error("Claude didn't return a numeric estimate");
  }
  return parsed;
}
