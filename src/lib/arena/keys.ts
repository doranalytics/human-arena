import "server-only";
import type { ChallengeKey } from "./types";

/** Reference facts ONLY. All grading requirements live in the public challenge definition. */
const FACTS: Record<string, string> = {
  "ten-words": "Count whitespace-separated words in the final explanation; hyphenated words count as one. Ignore an appended word-count note.",
  "three-audiences": "Sky: shorter wavelengths of sunlight scatter more in the atmosphere. Rayleigh scattering is proportional to inverse wavelength to the fourth power. Child-friendly analogies and explained vocabulary are fine.",
  "tutor-mode": "Gross margin = (revenue minus cost of goods) divided by revenue.",
  "deslop": "The supplied paragraph says communication, useful tools and teamwork improve productivity. There is no forbidden-word list.",
  "pull-the-table": "Expense totals: booth2400; catalogues126; shipping218.50; lunches87.20,91.05,64.75; badges58; hotel378; taxis24.60,27.10; surcharge45; banner112; parking3x18. Total3686.20. Repeated purchases may be grouped when quantity and unit amount are visible. Every individual charge over25 dollars needs a receipt, so each18-dollar parking charge does not. The whole claim exceeds2500 dollars, so the finance director approves it.",
  "read-the-pdf": "Supply agreement: USD3.85 per metre, minimum 8000 metres per colour.",
  "show-dont-tell": "The care label prohibits fabric softener, ironing and dry cleaning; it says wash cold and tumble dry low.",
  "picture-to-text": "The note reads: Trade show, Thursday. Booth 214, hall B, set up from 7am. Bring 40 catalogues and the demo tent. Buyer meetings 10:30, 1:15 and 3:00. Call the freight desk before 4pm. Dinner with the retail team at 7, Alder Street.",
  "picture-math": "June values, USD thousands: Pacific Northwest471, Mountain West352, Northeast288, Southwest139, Canada137, Online402. Total1789 thousand dollars = $1.789 million. Strongest is Pacific Northwest; weakest is Canada; gap334 thousand dollars. Equivalent units are valid.",
  "check-it": "Bob Gore discovered expanded PTFE in 1969 at W. L. Gore and Associates. Patented in the early1970s, commercialized in1976. Verification can confirm an already correct answer; no correction is required when none is needed.",
  "pick-the-brain": "249 times0.55 minus92 = $44.95 earned per partner jacket. About $45 is equivalent rounding.",
  "connect-and-ask": "Most recent monthly_financials month:2025-08, revenue USD2,490,000. list_tables alone contains no revenue data; read_table returns the figures.",
  "inbox-to-reply": "Newest unread sample email: CFO, Board deck: what I need from ops,1September2026, draft due10September. A reply draft acknowledges its requests; it need not perform them.",
  "hand-it-off": "Newest unread board email: board18September; draft10September; requests Bergstrom plan, FY24 monthly margin trend, Q3 regional sales to date. FY24 margins Jan-Dec:39.2,38.7,40.1,40.6,41.0,41.3,41.8,42.4,41.1,43.0,44.2,43.6 percent; blended41.5 percent. Q3 to date: Pacific Northwest1960000, Mountain West1390000, Northeast940000, Online510000; total4800000. Drive facts: Bergstrom is six weeks late, ETA24October; air freight first40 percent about38000 in transcript but newer email quote41200; Verdant price7 percent higher, can ship5October, sample two weeks if approved Wednesday; any supplier change requires ten-working-day fabric retest; spring delay remains an option; no air-freight commitment yet. Prefer newer evidence when figures conflict.",
  "skill-up": "Leadership transcript decisions: request a Verdant sample this week; Marcus models both supplier options by3September; no air-freight commitment; fall campaign launches15September with Walk further; board draft due10September; Timberline remains net30. Actions and owners/dates must come from the transcript; do not invent missing dates.",
  "chain-it": "Use the successful live search results as the source of story facts and links. Brand Guidelines2026 say: plain, warm, unhurried; say walk, never hike; short sentences; no exclamation marks.",
  "cowork-to-skill": "Leadership transcript decisions: Tomasz requests a Verdant sample this week; Marcus models both options by3September; nobody commits to air freight; fall campaign launches15September with Walk further; board draft due10September; Timberline stays net30. Preserve owners and dates; do not invent them.",
  "one-paragraph": "The supplied five paragraphs cover purpose, approval thresholds, timing, receipts and travel. Meal caps are NOT in this material.",
};
export function getKey(slug: string): ChallengeKey {
  return { slug, key: FACTS[slug] ?? "Use the supplied material and successful tool results as reference facts. There are no additional private requirements." };
}
