import { PEOPLE } from "./world";

export interface Email {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  labels: string[];
  unread?: boolean;
}

const P = PEOPLE;

export const EMAILS: Email[] = [
  {
    id: "m-1041",
    from: P.priya.email,
    fromName: P.priya.name,
    to: "you",
    subject: "Welcome, and your first three weeks",
    date: "2026-08-12T08:14:00-07:00",
    labels: ["inbox"],
    body: `Welcome aboard. Three things I'd like you to own this quarter:

1. The weekly ops summary (Fridays, one page, goes to the leadership team).
2. The Bergstrom Textiles delay (Tomasz will brief you). We need a plan by end of month.
3. Board deck prep support for Marcus in September.

Ask me anything, any time. Priya`,
  },
  {
    id: "m-1052",
    from: P.tomasz.email,
    fromName: P.tomasz.name,
    to: "you",
    subject: "Bergstrom delay: what we know",
    date: "2026-08-19T11:32:00-07:00",
    labels: ["inbox", "important"],
    unread: true,
    body: `Quick brain dump before our call.

Bergstrom Textiles (our shell fabric supplier for the Ridgeline jacket line) has slipped the September delivery by 6 weeks. New ETA is 24 October. That pushes Ridgeline restock past the October outdoor retail window.

Options I see:
a) Air freight the first 40% of the order. Adds roughly $38k.
b) Split the order with Verdant Mills in Vietnam. Sample lead time 3 weeks, price is 7% higher per metre, but they can ship by 5 October.
c) Accept the delay and push the Ridgeline relaunch to spring.

Priya wants a recommendation with numbers by 29 August. Tomasz`,
  },
  {
    id: "m-1063",
    from: P.marcus.email,
    fromName: P.marcus.name,
    to: "you",
    subject: "FY24 monthly margin table (for the deck)",
    date: "2026-08-21T16:05:00-07:00",
    labels: ["inbox"],
    body: `As promised, gross margin by month for FY24. Same numbers as the warehouse; I'm pasting them here so you don't have to dig.

Jan 39.2% | Feb 38.7% | Mar 40.1% | Apr 40.6% | May 41.0% | Jun 41.3%
Jul 41.8% | Aug 42.4% | Sep 41.1% | Oct 43.0% | Nov 44.2% | Dec 43.6%

FY24 blended: 41.5%. Please use one decimal in the deck. Marcus`,
  },
  {
    id: "m-1071",
    from: P.lena.email,
    fromName: P.lena.name,
    to: "you",
    subject: "Re: fall campaign copy review",
    date: "2026-08-24T09:48:00-07:00",
    labels: ["inbox"],
    body: `Thanks for the notes. We're going with "Walk further" as the line. Launch is 15 September across email, paid social and the four REI-adjacent retail partners June is handling. Could you make sure the ops summary mentions the launch date? Lena`,
  },
  {
    id: "m-1078",
    from: P.june.email,
    fromName: P.june.name,
    to: "you",
    subject: "Retail partner pricing sheet",
    date: "2026-08-25T13:20:00-07:00",
    labels: ["inbox"],
    body: `Attached the wholesale pricing sheet for the four partners (Cascade Supply, Timberline Gear, North Bend Outfitters, Alder & Pine). Timberline is asking for net-60 terms; everyone else is net-30. Flagging in case ops has a view. June`,
  },
  {
    id: "m-1080",
    from: P.sam.email,
    fromName: P.sam.name,
    to: "all-staff@haldenoutdoor.example",
    subject: "Password reset window this Friday",
    date: "2026-08-26T10:00:00-07:00",
    labels: ["inbox"],
    body: `All staff: single sign-on maintenance Friday 8pm to 10pm Pacific. You'll be asked to sign in again on Monday. Nothing to do beforehand. Sam`,
  },
  {
    id: "m-1085",
    from: P.priya.email,
    fromName: P.priya.name,
    to: "you",
    subject: "Ops summary format",
    date: "2026-08-27T07:55:00-07:00",
    labels: ["inbox"],
    body: `For the Friday summary, keep it to: what shipped, what slipped, one number that matters, one ask. Half a page is better than a page. Priya`,
  },
  {
    id: "m-1090",
    from: P.dana.email,
    fromName: P.dana.name,
    to: "you",
    subject: "Ridgeline relaunch: product spec v3",
    date: "2026-08-28T15:10:00-07:00",
    labels: ["inbox"],
    body: `Spec v3 is in Drive (Ridgeline Jacket Spec v3). Headline changes: 20D ripstop shell from Bergstrom, recycled fill at 700 FP, MSRP $249. If we switch shell supplier the spec needs a fabric re-test, which is about 10 working days. Dana`,
  },
  {
    id: "m-1093",
    from: "newsletter@trailweekly.example",
    fromName: "Trail Weekly",
    to: "you",
    subject: "This week: 5 ultralight packs under 900g",
    date: "2026-08-29T06:00:00-07:00",
    labels: ["inbox", "promotions"],
    body: `Our roundup of the lightest packs this season, plus a gear giveaway. Read more on the site.`,
  },
  {
    id: "m-1097",
    from: P.tomasz.email,
    fromName: P.tomasz.name,
    to: "you",
    subject: "Re: Bergstrom delay: Verdant sample update",
    date: "2026-08-31T12:41:00-07:00",
    labels: ["inbox", "important"],
    unread: true,
    body: `Verdant Mills confirmed they can do the sample in 2 weeks instead of 3 if we approve by Wednesday. Air freight quote from Bergstrom's forwarder came back at $41,200 (up from the $38k estimate). Tomasz`,
  },
  {
    id: "m-1101",
    from: P.marcus.email,
    fromName: P.marcus.name,
    to: "you",
    subject: "Board deck: what I need from ops",
    date: "2026-09-01T09:30:00-07:00",
    labels: ["inbox"],
    unread: true,
    body: `Board is 18 September. From ops I need: the Bergstrom plan on one slide, FY24 margin trend chart (use the warehouse numbers), and Q3 regional sales to date. Draft by 10 September please. Marcus`,
  },
  {
    id: "m-1104",
    from: "no-reply@expensify-lookalike.example",
    fromName: "Expense Portal",
    to: "you",
    subject: "Your August expense report was approved",
    date: "2026-09-01T17:02:00-07:00",
    labels: ["inbox", "updates"],
    body: `Report #A-2291 ($312.40) approved by Priya Raman. Reimbursement lands with the next payroll.`,
  },
];
