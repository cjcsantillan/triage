import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient, BEDROCK_MODEL_ID } from "./bedrockClient.js";
import { CATEGORIES, URGENCY_LEVELS, type TriageResult } from "./types.js";

const SYSTEM_PROMPT = `You are a support-ticket triage assistant for a SaaS product. Given an
incoming support ticket, respond with ONLY a JSON object matching this shape, no
prose before or after it:

{
  "urgency": "Low" | "Medium" | "High",
  "category": "${CATEGORIES.join('" | "')}",
  "reply": "a short, ready-to-send draft reply, empathetic and specific to the ticket"
}

Base urgency on customer impact and time sensitivity (e.g. being charged twice
or a total outage is High; a how-to question is Low). Pick the single best-fit
category. The reply should sound like a human support agent, not a template.`;

export class BedrockInvocationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BedrockInvocationError";
  }
}

/** Ask the configured Bedrock text model to triage a support ticket. */
export async function triageTicket(ticketText: string): Promise<TriageResult> {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: ticketText }],
  };

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  let response;
  try {
    response = await bedrockClient.send(command);
  } catch (err) {
    throw new BedrockInvocationError("Bedrock invocation failed", { cause: err });
  }

  const payload = JSON.parse(Buffer.from(response.body!).toString("utf-8"));
  const rawText: string | undefined = payload?.content?.[0]?.text;
  if (!rawText) {
    throw new BedrockInvocationError("Bedrock response had no text content");
  }

  return parseModelJson(rawText);
}

function parseModelJson(rawText: string): TriageResult {
  // Models occasionally wrap JSON in a code fence despite instructions — strip it.
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new BedrockInvocationError("Could not parse model response as JSON", { cause: err });
  }

  const { urgency, category, reply } = parsed as Record<string, unknown>;
  if (typeof urgency !== "string" || !URGENCY_LEVELS.includes(urgency as never)) {
    throw new BedrockInvocationError(`Model returned an unexpected urgency value: ${urgency}`);
  }
  if (typeof category !== "string" || typeof reply !== "string") {
    throw new BedrockInvocationError("Model response was missing category or reply");
  }

  return { urgency: urgency as TriageResult["urgency"], category, reply: reply.trim() };
}
