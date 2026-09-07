import "server-only";
import type { ChallengeKey } from "./types";

/** Reference facts ONLY. All grading requirements live in the public challenge definition. */
const FACTS: Record<string, string> = {
  "ten-words": "Count whitespace-separated words in the final explanation; hyphenated words count as one. Ignore an appended word-count note.",
  "three-audiences": "Sky: shorter wavelengths of sunlight scatter more in the atmosphere. Rayleigh scattering is proportional to inverse wavelength to the fourth power. Child-friendly analogies and explained vocabulary are fine.",
  "tutor-mode": "Gross margin = (revenue minus cost of goods) divided by revenue.",
  "deslop": "The supplied paragraph says communication, useful tools and teamwork improve productivity. There is no forbidden-word list.",
  "pull-the-table": "Expense totals: booth 2400; catalogues 126; shipping 218.50; lunches 243; badges 58; hotel 378; taxis 51.70; surcharge 45; banner 112; parking 54. Total 3686.20. Lunches and taxis may be combined or split without losing expenses.",
  "read-the-pdf": "Supply agreement: USD3.85 per metre, minimum 8000 metres per colour.",
  "show-dont-tell": "The care label prohibits fabric softener, ironing and dry cleaning; it says wash cold and tumble dry low.",
  "picture-to-text": "The note reads: Trade show, Thursday. Booth 214, hall B, set up from 7am. Bring 40 catalogues and the demo tent. Buyer meetings 10:30, 1:15 and 3:00. Call the freight desk before 4pm. Dinner with the retail team at 7, Alder Street.",
  "picture-math": "June values, USD thousands: 471,352,288,139,137,402. Total1789 thousand dollars = $1.789 million. Equivalent units are valid.",
  "check-it": "Bob Gore discovered expanded PTFE in 1969 at W. L. Gore and Associates. Patented in the early1970s, commercialized in1976. Verification can confirm an already correct answer; no correction is required when none is needed.",
  "pick-the-brain": "249 times0.55 minus92 = $44.95 earned per partner jacket. About $45 is equivalent rounding.",
  "connect-and-ask": "Most recent monthly_financials month:2025-08, revenue USD2,490,000. list_tables alone contains no revenue data; read_table returns the figures.",
  "inbox-to-reply": "Newest unread sample email: CFO, Board deck: what I need from ops,1September2026, draft due10September. A reply draft acknowledges its requests; it need not perform them.",
  "hand-it-off": "The newest unread email asks for FY24 margin figures and Q3 regional sales to date. Only its numerical requests are in scope; no slide, chart or supplier plan is required. Compare each requested figure with the actual read_table results. The learner need not type numbers, request a table, name datasets or do further calculations unless the email asks for them. Accept prose, bullets or tables. Missing source data should be identified as unavailable, never fabricated.",
  "one-paragraph": "The supplied five paragraphs cover purpose, approval thresholds, timing, receipts and travel. Meal caps are NOT in this material.",
};
export function getKey(slug: string): ChallengeKey {
  return { slug, key: FACTS[slug] ?? "Use the supplied material and successful tool results as reference facts. There are no additional private requirements." };
}
