import "server-only";
import type { ChallengeKey } from "./types";

const KEYS: ChallengeKey[] = [
  { slug: "first-words", key: `Any three-line poem counts as a haiku; do not count syllables strictly. Must contain "Halden" and at least one of: pack, packs, tent, tents, layer, layers, jacket, fleece.` },
  {
    slug: "fresh-news",
    key: `Two separate news items. Each must have a date within 7 days of the attempt date given in the transcript header, and a URL or a named publication that came from a web search result (the transcript will show search tool calls). Items with no date, or dated outside the window, fail "two-items". Fabricated links (no search results in the transcript) fail "sourced".`,
  },
  {
    slug: "july-margin",
    key: `July 2024 gross margin is 41.8%. Accept 41.8 or 41.8%. The source is either the warehouse table monthly_financials (row 2024-07) or Marcus's email "FY24 monthly margin table (for the deck)". The transcript must show a connector tool call (read_table, search_gmail or read_email); a number with no tool call fails "source".`,
  },
  {
    slug: "read-the-fine-print",
    key: `Price: USD 4.62 per metre. Earliest ship date: 5 October 2026. Risk clause: minimum order 25,000 metres per colour, non-cancellable once dyeing starts (either the minimum or the non-cancellable part passes "clause"). The transcript must contain the attached file (a file part or the pasted quote text).`,
  },
  {
    slug: "pick-the-brain",
    key: `Wholesale: partner pays 249 x 0.55 = 136.95. Profit = 136.95 - 92 - 11 = 33.95 per unit. Direct: 249 - 92 - 19 = 138.00 per unit. 1,000 direct units = 138,000 profit. 138,000 / 33.95 = 4,064.8, rounded up 4,065 wholesale units. Accept 4,064 or 4,065 for "equiv". Accept small rounding on the per-unit figures (33.95 or 34; 138).`,
  },
  {
    slug: "deep-dive",
    key: `Pass "structure" for a title plus three or more headed sections (markdown headings or clearly labelled sections). Pass "sources" when four or more distinct URLs or named publications appear and the transcript shows web search tool calls; without search calls, fail. "on-topic": the report discusses supplier delays and/or near-shoring or reshoring for outdoor apparel or apparel brands generally.`,
  },
  {
    slug: "skill-up",
    key: `Decisions in the 26 August transcript: Tomasz requests a Verdant Mills sample this week; Marcus models both options (air freight vs Verdant) by 3 September; nobody commits to air freight yet; fall campaign launches 15 September with "Walk further"; board deck draft by 10 September, Marcus owns; Timberline held at net-30. Pass "decisions" if at least three of these appear. Pass "actions" if owners and at least two of the dates (3 Sep, 10 Sep, 15 Sep, "this week") appear. Sections must be Decisions, Action items, Open questions (wording may vary slightly).`,
  },
  {
    slug: "set-up-shop",
    key: `The transcript header lists the project instructions. Pass "format" if the reply has the four parts: what shipped, what slipped, one number, one ask (labels may vary). Pass "no-repeat" if the project instructions contain the format and the user's message in the chat does NOT itself spell out all four parts; a short request like "write this week's summary" passes.`,
  },
  {
    slug: "inbox-triage",
    key: `Tomasz's latest email (31 Aug, "Re: Bergstrom delay: Verdant sample update"): Verdant can do the sample in 2 weeks if approved by Wednesday; air freight quote came back at $41,200. Pass "found" if the transcript shows read_email or search_gmail returning that email. The draft must (1) approve the Verdant sample, (2) acknowledge the $41,200 quote (accept 41,200 or 41.2k), (3) ask to hold air freight until Marcus's model on 3 September. Count words of the draft body only for "length".`,
  },
  {
    slug: "show-dont-tell",
    key: `You cannot see the image. Pass "described" when the reply names concrete visual specifics (objects, colours, text, layout) rather than hedging that it cannot see an image; fail if the assistant says no image was provided. Pass "caption" if exactly one caption is offered and it contains no exclamation mark.`,
  },
];

export function getKey(slug: string): ChallengeKey | undefined {
  return KEYS.find((k) => k.slug === slug);
}
