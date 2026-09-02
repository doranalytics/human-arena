export interface DriveFile {
  id: string;
  name: string;
  kind: "doc" | "sheet" | "slides" | "pdf";
  modified: string;
  owner: string;
  folder: string;
  content: string;
}

export const DRIVE: DriveFile[] = [
  {
    id: "d-201",
    name: "Ridgeline Jacket Spec v3",
    kind: "doc",
    modified: "2026-08-28",
    owner: "Dana Whitfield",
    folder: "Product",
    content: `Ridgeline Jacket, relaunch spec v3
Shell: 20D nylon ripstop, DWR, supplier Bergstrom Textiles (fabric code BT-2040)
Fill: 700 fill-power recycled down, 110g (size M)
Weight: 385g (size M)
Colours: Basalt, Moss, Ember
MSRP: $249. Target landed cost: $92.
Retest required if shell supplier changes: 10 working days.
Relaunch window: October retail season, or spring if delayed.`,
  },
  {
    id: "d-202",
    name: "Supplier Contract Summary: Bergstrom Textiles",
    kind: "doc",
    modified: "2026-06-03",
    owner: "Tomasz Nowak",
    folder: "Supply chain",
    content: `Term: 1 Jan 2025 to 31 Dec 2026. Minimum annual volume: 60,000 metres.
Lead time: 12 weeks standard. Late delivery clause: 2% credit per week late, capped at 10%.
Exclusivity: none. Halden may source shell fabric elsewhere.
Termination: 90 days notice by either party.`,
  },
  {
    id: "d-203",
    name: "Weekly Ops Summary Template",
    kind: "doc",
    modified: "2026-08-27",
    owner: "Priya Raman",
    folder: "Operations",
    content: `WEEKLY OPS SUMMARY, week of ___
What shipped:
What slipped:
The one number:
The one ask:`,
  },
  {
    id: "d-204",
    name: "Leadership Meeting 2026-08-26 transcript",
    kind: "doc",
    modified: "2026-08-26",
    owner: "Priya Raman",
    folder: "Operations",
    content: `[Priya] Let's start with Bergstrom. Tomasz?
[Tomasz] Six week slip, new ETA 24 October. Three options: air freight the first 40 percent for about 38k, split with Verdant Mills in Vietnam at 7 percent higher price with a 5 October ship, or push the relaunch to spring.
[Marcus] Air freight kills the margin on the first batch. I'd want to see the Verdant numbers before deciding. Can we get a sample?
[Tomasz] Three weeks for a sample. I'll ask if they can compress.
[Dana] Any supplier change means a fabric retest, ten working days. So Verdant plus retest still lands before the October window if we approve fast.
[Priya] Decision: Tomasz requests a Verdant sample this week. Marcus models both options by 3 September. Nobody commits to air freight yet.
[Lena] Fall campaign launches 15 September regardless. "Walk further" is locked.
[Priya] Fine. Board deck: Marcus owns, ops supports, draft by 10 September. Anything else?
[June] Timberline wants net-60. I'll hold at net-30 unless finance says otherwise.
[Marcus] Hold at 30.
[Priya] Done. Thanks all.`,
  },
  {
    id: "d-205",
    name: "Wholesale Pricing Sheet FY26",
    kind: "sheet",
    modified: "2026-08-25",
    owner: "June Castellanos",
    folder: "Sales",
    content: `partner,terms,discount_off_msrp,annual_commit_units
Cascade Supply,net-30,45%,6000
Timberline Gear,net-30 (requesting net-60),45%,4200
North Bend Outfitters,net-30,42%,2500
Alder & Pine,net-30,40%,1800`,
  },
  {
    id: "d-206",
    name: "Brand Guidelines 2026",
    kind: "pdf",
    modified: "2026-05-14",
    owner: "Lena Fischer",
    folder: "Marketing",
    content: `Voice: plain, warm, unhurried. We say "walk", never "hike". Sentences short. No exclamation marks.
Colours: Basalt #3b3a37, Moss #5f7355, Ember #d9743c, Chalk #f4f1ea.
Logo clear space: height of the H on all sides.`,
  },
  {
    id: "d-207",
    name: "Expense Policy",
    kind: "doc",
    modified: "2026-02-02",
    owner: "Marcus Oyelaran",
    folder: "Finance",
    content: `Meals: $60/day domestic, $85 international. Hotels: booked through the portal, cap $220/night. Anything over $500 needs manager pre-approval. Receipts within 30 days.`,
  },
  {
    id: "d-208",
    name: "Q3 Board Deck (draft outline)",
    kind: "slides",
    modified: "2026-09-01",
    owner: "Marcus Oyelaran",
    folder: "Finance",
    content: `1. FY24 recap and FY25 to date
2. Margin trend (monthly, FY24 to now)
3. Regional sales Q3
4. Ridgeline relaunch and the Bergstrom plan
5. Fall campaign
6. Asks`,
  },
];
