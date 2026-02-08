export type Urgency = "Low" | "Medium" | "High";

export const URGENCY_LEVELS: readonly Urgency[] = ["Low", "Medium", "High"];

export const CATEGORIES = [
  "Billing",
  "Bug",
  "How-to",
  "Account",
  "Feature Request",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface TriageResult {
  urgency: Urgency;
  category: string;
  reply: string;
}
