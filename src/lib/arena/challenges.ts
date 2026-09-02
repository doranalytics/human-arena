import type { ChallengeDef } from "./types";

export const CHALLENGES: ChallengeDef[] = [
  {
    slug: "first-words",
    order: 1,
    title: "First words",
    hook: "Say hello. Get Halden into the answer.",
    teaches: "Sending a message and steering the reply",
    badges: ["first-chat"],
    minutes: 3,
    points: 10,
    brief: `You have just joined **Halden Outdoor Co.** as an Operations Associate. Priya, your boss, likes a light touch.

Ask the assistant to write a **haiku** that welcomes you to Halden. It must mention Halden by name and something the company makes (packs, tents or layers).`,
    deliverable: "A haiku in the chat that names Halden and a product.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "haiku", label: "The reply contains a three-line haiku" },
      { id: "halden", label: "It names Halden and one of packs, tents or layers" },
    ],
    hints: [{ text: "Just type what you want in the box at the bottom. Be specific: haiku, Halden, a product." }],
  },
  {
    slug: "fresh-news",
    order: 2,
    title: "Fresh news",
    hook: "The model's memory has a cutoff. The web doesn't.",
    teaches: "Knowing when to turn on web search",
    badges: ["web-search"],
    minutes: 5,
    points: 30,
    brief: `Lena wants a line for Friday's ops summary about **what happened in the outdoor industry this week**.

Get the assistant to give you **two news items from the last seven days**, each with a source link and the date. Old news does not count, and neither does anything the assistant makes up.`,
    deliverable: "Two dated, linked news items from the past week.",
    behaviors: [{ id: "search", label: "Turned on web search", event: "web_search_on" }],
    checks: [
      { id: "two-items", label: "Two distinct news items, each with a date within the last seven days" },
      { id: "sourced", label: "Each item has a real source link or named publication from the search results" },
    ],
    hints: [{ text: "Look at the + menu in the message box. The assistant cannot see the news unless you let it search." }, { text: "Turn on Web search, then ask for news from the last 7 days with links and dates." }],
  },
  {
    slug: "july-margin",
    order: 3,
    title: "The July margin",
    hook: "The number is not in your head. It is in the company's data.",
    teaches: "Connecting a data source and asking it a question",
    badges: ["connectors", "data-query"],
    minutes: 6,
    points: 40,
    brief: `Marcus needs one number for the board deck: **Halden's gross margin for July 2024**, to one decimal place.

You do not know it. Nobody has told you. But the company keeps its numbers somewhere the assistant can reach, if you let it.

Get the assistant to report the July 2024 gross margin **and say where it found it**.`,
    deliverable: "The July 2024 gross margin, with its source.",
    behaviors: [{ id: "used", label: "Used a connector", event: "connector_used" }],
    checks: [
      { id: "number", label: "The reply states the July 2024 gross margin correctly (one decimal)" },
      { id: "source", label: "The reply names the source it read (a warehouse table or an email)" },
    ],
    hints: [{ text: "Open Connectors in the sidebar. Halden has a data warehouse and your Gmail, both waiting to be connected." }, { text: "Connect the warehouse, then ask for the July 2024 gross margin from the monthly financials." }],
  },
  {
    slug: "read-the-fine-print",
    order: 4,
    title: "Read the fine print",
    hook: "A file the assistant has never seen. Until you hand it over.",
    teaches: "Attaching a file and asking questions about it",
    badges: ["file-upload"],
    minutes: 6,
    points: 35,
    brief: `Tomasz forwarded the **Verdant Mills quote** as a text file. Download it from this brief, then get it into the chat.

Ask the assistant for **three things**: the price per metre, the earliest ship date, and the one clause that should worry Halden.`,
    deliverable: "Price per metre, ship date and the risky clause, from the attached file.",
    behaviors: [{ id: "file", label: "Attached the file", event: "file_attached" }],
    checks: [
      { id: "price", label: "States the correct price per metre from the quote" },
      { id: "ship", label: "States the correct earliest ship date" },
      { id: "clause", label: "Identifies the minimum-order or cancellation clause as the risk" },
    ],
    fixtures: [
      {
        filename: "verdant-mills-quote.txt",
        title: "Verdant Mills quote",
        body: `VERDANT MILLS CO., LTD.  Ho Chi Minh City
Quotation VM-26-0817 for Halden Outdoor Co.
Item: 20D nylon ripstop, DWR C0, colour Basalt / Moss / Ember
Price: USD 4.62 per metre (FOB Cat Lai), valid 21 days
Minimum order: 25,000 metres per colour, non-cancellable once dyeing starts
Sample lead time: 14 working days from approval
Earliest ship date for full order: 5 October 2026
Payment: 40% deposit on order, 60% before shipment
Notes: Fabric re-test at customer's cost. Lead times assume approval by 3 September 2026.`,
      },
    ],
    hints: [{ text: "Download the file from the brief. Then look for the + button next to the message box, or drag the file onto the chat." }, { text: "Once it is attached, ask for the three items in one message." }],
  },
  {
    slug: "pick-the-brain",
    order: 5,
    title: "Pick the right brain",
    hook: "Fast is for most things. This is not most things.",
    teaches: "Choosing the model and effort level for the task",
    badges: ["model-choice"],
    minutes: 6,
    points: 35,
    brief: `Marcus wants a sanity check on a pricing puzzle before the board meeting.

Halden sells the Ridgeline jacket at **$249**. Landed cost is **$92**. Retail partners take **45% off MSRP**. Halden pays **$11** per unit in freight and handling on wholesale orders, and **$19** on direct online orders (packaging, payment fees, returns).

Ask: **what is Halden's gross profit per unit on a wholesale sale versus a direct online sale, and how many wholesale units equal the profit of 1,000 direct units?**

Choose the model and effort you think this deserves. The environment watches.`,
    deliverable: "Both per-unit profits and the wholesale-units equivalent, correct.",
    behaviors: [
      { id: "smart", label: "Selected the Smart model", event: "model_selected", detail: "smart" },
      { id: "high", label: "Set effort to High", event: "effort_selected", detail: "high" },
    ],
    checks: [
      { id: "wholesale", label: "Wholesale profit per unit is correct" },
      { id: "direct", label: "Direct profit per unit is correct" },
      { id: "equiv", label: "The wholesale-unit equivalent of 1,000 direct units is correct (rounded up)" },
    ],
    hints: [{ text: "The model name at the bottom right of the message box is a menu. Look at what it lets you change." }, { text: "Pick Smart and High, then paste the puzzle. Ask it to show its working." }],
  },
  {
    slug: "deep-dive",
    order: 6,
    title: "Deep dive",
    hook: "Some questions deserve a report, not a reply.",
    teaches: "Using research mode for a bigger question",
    badges: ["deep-research"],
    minutes: 10,
    points: 45,
    brief: `Priya asked for a short background paper: **how are outdoor apparel brands handling supplier delays and near-shoring in 2026?**

A one-paragraph answer is not enough. Get a **structured report with sections and at least four cited sources**, produced the way a research assistant would: searching, reading, then writing.`,
    deliverable: "A sectioned report with four or more cited sources.",
    behaviors: [{ id: "research", label: "Turned on Research", event: "research_on" }],
    checks: [
      { id: "structure", label: "The reply is a report with a title and at least three headed sections" },
      { id: "sources", label: "At least four distinct cited sources with links" },
      { id: "on-topic", label: "It addresses supplier delays and near-shoring for outdoor apparel" },
    ],
    hints: [{ text: "Web search gives quick answers. There is a bigger button for bigger questions. Look in the + menu." }, { text: "Turn on Research, then ask for a report with sections and sources." }],
  },
  {
    slug: "skill-up",
    order: 7,
    title: "Skill up",
    hook: "Stop retyping the same instructions.",
    teaches: "Invoking a skill with a slash command",
    badges: ["skills"],
    minutes: 6,
    points: 35,
    brief: `The leadership meeting transcript from **26 August** is in your Drive. Priya wants proper notes: decisions, action items, open questions.

Someone already wrote a **skill** for exactly this. Use it on the transcript rather than explaining the format yourself.`,
    deliverable: "Meeting notes with decisions, action items and open questions, produced with a skill.",
    behaviors: [
      { id: "skill", label: "Invoked a skill with /", event: "skill_invoked" },
      { id: "drive", label: "Read the transcript from Drive", event: "connector_used", detail: "drive" },
    ],
    checks: [
      { id: "decisions", label: "Notes list the decisions from the transcript (Verdant sample, Marcus models options, no air freight yet, hold Timberline at net-30)" },
      { id: "actions", label: "Action items carry owners and the dates from the transcript" },
      { id: "sections", label: "Has the three sections: Decisions, Action items, Open questions" },
    ],
    hints: [{ text: "Type / in the message box and see what appears. Then connect Drive so the assistant can read the transcript." }, { text: "Use /meeting-notes and ask it to apply the skill to the 26 August transcript in Drive." }],
  },
  {
    slug: "set-up-shop",
    order: 8,
    title: "Set up shop",
    hook: "Tell it who you are once. Then never again.",
    teaches: "Creating a project with instructions and starting a chat inside it",
    badges: ["projects"],
    minutes: 6,
    points: 35,
    brief: `You will be writing the weekly ops summary every Friday. Priya's rules: **what shipped, what slipped, one number, one ask; half a page**.

Create a **project** for the ops summary with those rules as its instructions, then start a chat inside it and ask for this week's summary using anything you know. The assistant should follow the format **without you repeating it**.`,
    deliverable: "A project with the format in its instructions, and a summary in that format from a chat inside it.",
    behaviors: [
      { id: "project", label: "Created a project", event: "project_created" },
      { id: "in-project", label: "Started a chat inside the project", event: "chat_in_project" },
    ],
    checks: [
      { id: "format", label: "The summary follows the four-part format (shipped, slipped, one number, one ask)" },
      { id: "no-repeat", label: "The user's chat message did not restate the format; the project instructions carried it" },
    ],
    hints: [{ text: "Projects live in the sidebar. A project has instructions that every chat inside it inherits." }, { text: "Create the project, paste Priya's rules into its instructions, click New chat inside the project, and just ask for the summary." }],
  },
  {
    slug: "inbox-triage",
    order: 9,
    title: "Inbox triage",
    hook: "Three unread emails. One needs an answer today.",
    teaches: "Working across a connector and drafting a reply",
    badges: ["email-drafting", "connectors"],
    minutes: 8,
    points: 40,
    brief: `It is Tuesday. Tomasz sent an update on the Bergstrom delay that needs a decision **by Wednesday**.

Get the assistant to find the latest email from Tomasz and **draft a reply** that approves the Verdant Mills sample, acknowledges the new air freight quote, and asks Tomasz to hold on air freight until Marcus's model lands on 3 September. Under 120 words.`,
    deliverable: "A reply draft to Tomasz's latest email, with the three points, under 120 words.",
    behaviors: [{ id: "gmail", label: "Read Gmail through a connector", event: "connector_used", detail: "gmail" }],
    checks: [
      { id: "found", label: "The assistant read Tomasz's 31 August email (Verdant sample in 2 weeks, air freight $41,200)" },
      { id: "three-points", label: "The draft approves the sample, acknowledges the $41,200 quote, and asks to hold air freight until 3 September" },
      { id: "length", label: "The draft is under 120 words" },
    ],
    hints: [{ text: "Connect Gmail. Then ask for the latest email from Tomasz before asking for the draft." }, { text: "There is an /email-reply skill if you want the draft in the right shape." }],
  },
  {
    slug: "show-dont-tell",
    order: 10,
    title: "Show, don't tell",
    hook: "It can look at pictures. Most people never try.",
    teaches: "Sending an image and asking about it",
    badges: ["vision"],
    minutes: 4,
    points: 25,
    brief: `Attach **any photo or screenshot** from your computer and ask the assistant to describe what is in it in three bullets, then suggest one caption Lena could use in Halden's voice (plain, warm, no exclamation marks).`,
    deliverable: "Three bullets about the image and one caption.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [
      { id: "described", label: "The reply describes specific visual content (not a generic guess)" },
      { id: "caption", label: "One caption is offered, with no exclamation marks" },
    ],
    hints: [{ text: "Images go in the same place files do: the + button, or drag and drop onto the chat." }],
  },
];

export function getChallenge(slug: string) {
  return CHALLENGES.find((c) => c.slug === slug);
}
export const TOTAL_POINTS = CHALLENGES.reduce((n, c) => n + c.points, 0);
