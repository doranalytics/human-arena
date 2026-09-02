import type { ChallengeDef } from "./types";

/**
 * Skills first. Each challenge exercises one to four skills from src/lib/arena/skills.ts.
 * Rules: the brief supplies everything the learner needs (inline text or a fixture);
 * it can mention the company but never asks anyone to remember colleagues or products;
 * points reward doing the skill, not solving a puzzle.
 */

const SLOP_PARAGRAPH = `In today's fast-paced world, effective communication is more important than ever. It's crucial to note that by leveraging cutting-edge tools and fostering a culture of collaboration, teams can unlock unprecedented levels of productivity. Ultimately, this isn't just about working harder; it's about working smarter. Let's dive in and explore how embracing these best practices can transform the way we work, one step at a time.`;

const WRITING_SAMPLE_1 = `Quick one. The tent samples landed Tuesday, two days late, which is fine. Zips are better than last round. The rainfly still pools at the corners, so I've asked for a steeper cut. Photos in the shared folder. Shout if you want the full notes, otherwise I'll roll this into Friday.`;
const WRITING_SAMPLE_2 = `Short version: we can hit the October date if we stop changing the spec. Every tweak costs us a week at the mill. I'd rather ship something 90 percent right in October than something perfect in January. Happy to be talked out of it, but that's my read.`;

const FAVOUR_REQUEST = `Hi! Any chance you could cover the Saturday shift at the pop-up store this weekend? I know it's short notice. I'd owe you one. It's 9 to 6, and the till training takes about an hour beforehand. Let me know by tonight if you can.`;

const BACK_TRANSLATE = `Our lightest tent yet weighs under a kilo, sleeps two, and pitches in three minutes with one pole. It is built for people who count grams and still want to sleep dry.`;

const MESSY_LINES = `booth rental hall B .... 2,400.00 (paid 12 Aug)
40x catalogues @ 3.15 ea = 126.00
demo tent shipping - 218.50 - invoice #FR-2210
lunch x3 days   87.20 / 91.05 / 64.75
badges + lanyards: $58
hotel 2 nights @ 189.00 --> 378.00
taxi to venue 24.60, back 27.10
freight desk surcharge (late booking) 45.00
banner reprint 112.00 - the old one had a typo
parking: 3 x 18.00`;

const LONG_DOC = `EXPENSE POLICY, 2026 EDITION

Purpose. This policy sets out what the company reimburses, how to claim it, and what happens when a claim is late or incomplete. It applies to everyone who spends money on the company's behalf, including contractors on fixed-term agreements.

Who approves what. Line managers approve claims up to 500 dollars. Claims between 500 and 2,500 dollars go to the department head. Anything above 2,500 dollars needs the finance director. A manager may not approve their own claim; it goes one level up.

Timing. Submit claims within 30 days of the spend. Claims submitted between 30 and 60 days are paid but flagged in the quarterly review. Claims older than 60 days are not paid unless the finance director grants an exception in writing. Reimbursement lands with the next payroll after approval, which means a claim approved on the 20th of the month is paid on the last working day of that month.

Receipts. Every line over 25 dollars needs a receipt showing the vendor, the date and the amount. A card statement alone is not a receipt. Photos of paper receipts are fine if legible. For online purchases, the confirmation email counts.

Travel. Book flights and hotels through the travel portal where possible. Economy class for flights under six hours. Hotels up to 220 dollars a night in major cities and 160 dollars elsewhere; anything above that needs prior approval. Mileage in a personal car is reimbursed at 0.62 dollars per mile. Taxis and ride shares are fine when public transport would add more than 30 minutes.

Meals. When travelling, meals are covered up to 65 dollars a day. Alcohol is not reimbursed except at approved client dinners, where it is capped at two drinks per person. Meals with colleagues in your home city are not reimbursed unless a manager has approved a team event in advance.

Equipment. Laptops, monitors and phones are ordered through IT, not expensed. Small accessories under 80 dollars (cables, adapters, a mouse) can be expensed with a receipt. Software subscriptions need IT approval before purchase so the licence can be tracked.

Trade shows and events. Booth fees, shipping of demo gear and printed material are reimbursed at cost with the event named on the claim. Giveaways are capped at 400 dollars per event. Tickets for staff to attend are approved by the department head.

Gifts. Gifts to clients are capped at 75 dollars per person per year and must be logged on the gift register. Gifts to public officials are never allowed.

Personal expenses. Anything for personal use, including upgrades, companion travel, minibar, laundry on trips under five nights, and fines, is not reimbursed. If a personal item is mixed into a company purchase, split it on the claim.

Currency. Claims in foreign currency are converted at the card rate shown on the statement, or the mid-market rate on the day of purchase when paid in cash. Attach the statement line or a screenshot of the rate.

Corporate cards. Card holders reconcile their statement by the 5th of each month. Missing receipts on a card statement are treated the same as missing receipts on a claim. Two consecutive months of unreconciled spend suspends the card.

Misuse. Claims that turn out to be personal, duplicated, or altered are recovered from the next payroll and reported to HR. Honest mistakes are corrected without penalty when the claimant flags them first.

Questions. Ask finance before you spend when the answer is not obvious. A two-line email saves a week of back and forth later.`;

export const CHALLENGES: ChallengeDef[] = [
  /* ------------------------------------------------------------ prompting moves */
  {
    slug: "ten-words",
    order: 1,
    title: "Ten words",
    hook: "Ask it anything, and tell it exactly how long. It obeys to the word.",
    teaches: "Chat and constraints: ask a question, set the length",
    badges: ["chat", "constraints"],
    minutes: 3,
    points: 25,
    brief: `Ask the AI to explain a complex subject in **10 words**. For example, quantum physics.`,
    deliverable: "A ten-word explanation.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [{ id: "ten", label: "The final answer is exactly ten words and explains the subject" }],
    hints: [{ text: "Say: 'Explain quantum physics in exactly ten words.'" }],
  },
  {
    slug: "make-it-ask-first",
    order: 2,
    title: "Make it ask first",
    hook: "Ask it to interview you first and the answer fits your situation.",
    teaches: "Make it ask first: get the questions before the plan",
    badges: ["interviewing"],
    minutes: 5,
    points: 40,
    brief: `Ask for help planning a **team offsite**.

Before it answers, tell it to **ask you three questions** first. Answer them, and the plan follows.`,
    deliverable: "Three questions from the assistant, then a plan built on your answers.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "asked", label: "The assistant asked three or more questions before giving any plan" },
      { id: "used", label: "The final plan uses details you gave in your answers" },
    ],
    hints: [{ text: "Say: 'Before you plan anything, ask me the questions you need answered.'" }, { text: "Answer briefly, then say 'Now write the plan.'" }],
  },
  {
    slug: "grade-yourself",
    order: 3,
    title: "Grade yourself",
    hook: "It will grade and improve its own draft if you ask.",
    teaches: "Iteration and verification: make it critique and redo its own work",
    badges: ["iteration", "verification"],
    minutes: 6,
    points: 45,
    brief: `Ask for a **short note telling customers about a shipping delay**.

Then ask the assistant to **grade its own draft** and **rewrite it** to fix what it marked down.`,
    deliverable: "A draft, a self-grade, and a better rewrite.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "rubric", label: "The assistant graded its own draft against stated criteria" },
      { id: "rewrite", label: "A rewrite followed that differs from the first draft" },
    ],
    hints: [{ text: "Three messages: ask for the note, ask it to grade the note, ask it to rewrite." }],
  },
  {
    slug: "two-audiences",
    order: 4,
    title: "Two audiences",
    hook: "Name the reader and it rewrites for that person.",
    teaches: "Audience switching: change the reader, change the writing",
    badges: ["audience"],
    minutes: 5,
    points: 40,
    brief: `Get the assistant to explain **how a rain jacket keeps water out but lets sweat escape**, twice:

1. For a **ten-year-old**.
2. For a **textile engineer**.

Both in the same reply, clearly labelled.`,
    deliverable: "Two labelled explanations in different registers.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "both", label: "Both versions are present and labelled" },
      { id: "register", label: "The two versions differ clearly in vocabulary and depth" },
    ],
    hints: [{ text: "Ask for both in one message and name the two audiences." }],
  },
  {
    slug: "the-other-side",
    order: 5,
    title: "The other side",
    hook: "It will argue against you, hard, if you tell it to drop the balance.",
    teaches: "Steelman: get the strongest case against your view",
    badges: ["steelman"],
    minutes: 5,
    points: 45,
    brief: `Take this position: **"Remote work is better than office work."**

Tell the assistant you believe it, then make it **argue the opposite as hard as it can**. No balance, no both-sides.`,
    deliverable: "A real argument against your view.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [{ id: "counter", label: "The assistant argued against remote work with concrete points and no both-sides hedging" }],
    hints: [{ text: "Say: 'I think remote work is better. Argue the opposite as hard as you can. No caveats.'" }],
  },
  {
    slug: "rehearsal",
    order: 6,
    title: "Rehearsal",
    hook: "It can play the other person, then step out and coach you.",
    teaches: "Roleplay: make it play the other person, then coach you",
    badges: ["roleplay", "iteration"],
    minutes: 6,
    points: 50,
    brief: `Have the assistant **play a tough customer** pushing you for a discount. Hold your price for a few exchanges.

Then tell it to **break character** and give you feedback on how you did.`,
    deliverable: "A few in-character exchanges, then coaching.",
    behaviors: [{ id: "sent", label: "Sent at least three messages", event: "message_sent" }],
    checks: [
      { id: "character", label: "The assistant stayed in character as the customer across the exchanges" },
      { id: "coach", label: "After 'break character', it gave feedback on your responses" },
    ],
    hints: [{ text: "Open with: 'Play a customer who wants a discount. Stay in character until I say stop.'" }, { text: "After a few rounds: 'Break character. How did I do?'" }],
  },
  {
    slug: "twenty-then-three",
    order: 7,
    title: "Twenty then three",
    hook: "Ask for many, then hand it a rule to pick the best.",
    teaches: "Brainstorming with constraints: go wide, then cut by a rule",
    badges: ["brainstorming", "constraints"],
    minutes: 5,
    points: 40,
    brief: `Ask for **twenty names for a new tent**.

Then give it **one rule** of your choosing and have it pick the **best three**.`,
    deliverable: "Twenty names, then three picked by your rule.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "twenty", label: "Twenty names were produced" },
      { id: "three", label: "Three were chosen using the rule you gave" },
    ],
    hints: [{ text: "Ask for exactly twenty. Then in a second message give a rule, like 'easy to say out loud', and ask for three." }],
  },
  {
    slug: "side-by-side",
    order: 8,
    title: "Side by side",
    hook: "Ask for a table and a pick, and it stops hedging.",
    teaches: "Comparisons: force a table and a recommendation",
    badges: ["comparisons"],
    minutes: 5,
    points: 40,
    brief: `Ask the assistant to compare **courier, post and freight** for shipping a parcel, **as a table**, and to **pick one**.`,
    deliverable: "A comparison table and a pick.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "table", label: "A table comparing the three options" },
      { id: "pick", label: "One option recommended, with a reason" },
    ],
    hints: [{ text: "Say 'as a table' and 'then pick one'." }],
  },
  {
    slug: "tutor-mode",
    order: 9,
    title: "Tutor mode",
    hook: "It can quiz you one question at a time instead of lecturing.",
    teaches: "Tutor mode: one question at a time, adapts to your answers",
    badges: ["tutoring"],
    minutes: 6,
    points: 50,
    brief: `Ask the assistant to **teach you what gross margin is** by **quizzing you one question at a time**. No lecture.`,
    deliverable: "Questions one at a time, with your answers in between.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "one-at-a-time", label: "The assistant asked one question per turn and waited for the answer" },
      { id: "adapts", label: "A later question responded to an earlier answer" },
    ],
    hints: [{ text: "Say 'Teach me gross margin by asking one question at a time. Don't explain until I answer.'" }],
  },
  {
    slug: "deslop",
    order: 10,
    title: "Deslop",
    hook: "One instruction strips the AI voice out of AI writing.",
    teaches: "Constraints and style: strip the AI voice in one instruction",
    badges: ["constraints", "style-training"],
    minutes: 4,
    points: 40,
    brief: `Paste this paragraph and make it **sound like a person wrote it**, in one instruction:

> ${SLOP_PARAGRAPH}

Same meaning, no filler phrases, no "let's dive in", no "in today's fast-paced world".`,
    deliverable: "A plain rewrite with the AI tells removed.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "clean", label: "The rewrite has none of the flagged phrases and no new ones like them" },
      { id: "meaning", label: "The point of the paragraph survived" },
    ],
    hints: [{ text: "Tell it what to remove and what to keep: 'Rewrite plainly. Cut every cliché. Keep the meaning.'" }],
  },
  {
    slug: "sound-like-you",
    order: 11,
    title: "Sound like you",
    hook: "Two samples of your writing are enough for it to copy your voice.",
    teaches: "Style training: show samples, then get new writing in that voice",
    badges: ["style-training"],
    minutes: 6,
    points: 45,
    brief: `Here are two notes written in your voice. Paste both, then ask for a **new note in the same voice** about a **delayed delivery**.

Sample 1:
> ${WRITING_SAMPLE_1}

Sample 2:
> ${WRITING_SAMPLE_2}`,
    deliverable: "A new note that reads like the samples.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "samples", label: "Both samples were given to the assistant" },
      { id: "voice", label: "The new note matches the samples: short sentences, direct, no corporate filler, ends with a next step" },
    ],
    hints: [{ text: "Paste both samples in one message and say 'Write like this.'" }],
  },
  {
    slug: "reply-to-this",
    order: 12,
    title: "Reply to this",
    hook: "Give it the message and the outcome you want, and it drafts the reply.",
    teaches: "Drafting: brief the assistant with the message and the outcome",
    badges: ["drafting"],
    minutes: 4,
    points: 40,
    brief: `A colleague sent this:

> ${FAVOUR_REQUEST}

Draft a **short reply that says no**.`,
    deliverable: "A short reply that declines.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "no", label: "The reply clearly declines the Saturday shift" },
      { id: "length", label: "It is short" },
    ],
    hints: [{ text: "Paste the message, then say what you want: 'Reply and say no, keep it short.'" }],
  },
  {
    slug: "there-and-back",
    order: 13,
    title: "There and back",
    hook: "Translate there and back to see what a translation lost.",
    teaches: "Translation with verification: round-trip and diff",
    badges: ["translation", "verification"],
    minutes: 4,
    points: 35,
    brief: `Translate this into **French**, then have the assistant translate its French **back into English** and list **what changed** between the original and the round trip:

> ${BACK_TRANSLATE}`,
    deliverable: "French version, English round trip, and a list of differences.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "french", label: "A French translation is present" },
      { id: "back", label: "It was translated back to English and the differences were listed" },
    ],
    hints: [{ text: "Ask for all three steps in one message: translate, translate back, compare." }],
  },

  /* ------------------------------------------------------------ files and images */
  {
    slug: "one-page",
    order: 14,
    title: "One page",
    hook: "Attach a long document and ask for the shape you want back.",
    teaches: "File upload and summarizing: attach, then ask for the shape you want",
    badges: ["file-upload", "summarizing"],
    minutes: 5,
    points: 45,
    brief: `Download the expense policy from this brief and **attach it** to the chat.

Ask for the **five things a new starter must know**.`,
    deliverable: "Five bullets drawn from the document.",
    behaviors: [{ id: "file", label: "Attached the file", event: "file_attached" }],
    checks: [{ id: "five", label: "Five bullets drawn from the document" }],
    fixtures: [{ filename: "expense-policy.txt", title: "Expense policy", body: LONG_DOC }],
    hints: [{ text: "Use the + button or drag the file onto the chat. Then ask." }],
  },
  {
    slug: "pull-the-table",
    order: 15,
    title: "Pull the table",
    hook: "Name the columns and messy notes come back as a clean table.",
    teaches: "Data extraction from a file: name the columns you want",
    badges: ["extraction", "file-upload"],
    minutes: 6,
    points: 55,
    brief: `Download the trade show expense notes and **attach** them.

Ask for a **clean table with a total**.`,
    deliverable: "A table and a correct total.",
    behaviors: [{ id: "file", label: "Attached the file", event: "file_attached" }],
    checks: [
      { id: "table", label: "A table with one row per line item" },
      { id: "total", label: "The total is correct" },
    ],
    fixtures: [{ filename: "trade-show-expenses.txt", title: "Trade show expense notes", body: MESSY_LINES }],
    hints: [{ text: "Say 'one row per line item, with a total at the bottom'." }],
  },
  {
    slug: "read-the-pdf",
    order: 16,
    title: "Read the PDF",
    hook: "A PDF is something you can ask questions of.",
    teaches: "PDF reading and extraction: attach the PDF, ask precise questions",
    badges: ["pdf", "extraction"],
    minutes: 6,
    points: 55,
    brief: `Download the supply agreement PDF and **attach it**.

Ask for the **price per metre** and the **minimum order**.`,
    deliverable: "Two correct figures from the PDF.",
    behaviors: [{ id: "file", label: "Attached the PDF", event: "file_attached" }],
    checks: [
      { id: "price", label: "Price per metre is correct" },
      { id: "minimum", label: "Minimum order per colour is correct" },
    ],
    fixtures: [{ filename: "supply-agreement.pdf", title: "Supply agreement (PDF)", url: "/fixtures/supply-agreement.pdf", mediaType: "application/pdf" }],
    hints: [{ text: "Attach the PDF with + and ask both questions in one message." }],
  },
  {
    slug: "show-dont-tell",
    order: 17,
    title: "Show, don't tell",
    hook: "A photo is a prompt. It reads what is in the picture.",
    teaches: "Camera input: send a picture and ask about it",
    badges: ["camera"],
    minutes: 4,
    points: 35,
    brief: `Download the photo of the care label and **attach it**.

Ask **what you must never do** with this jacket.`,
    deliverable: "The prohibited step, read from the photo.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [{ id: "never", label: "A prohibited action from the label is named" }],
    fixtures: [{ filename: "care-label.png", title: "Photo of the care label", url: "/fixtures/care-label.png", mediaType: "image/png" }],
    hints: [{ text: "Use the image button in the composer, or drag the picture in." }],
  },
  {
    slug: "picture-to-text",
    order: 18,
    title: "Picture to text",
    hook: "It transcribes handwriting and screenshots, then works with the text.",
    teaches: "Image to text: transcribe first, then work with it",
    badges: ["ocr"],
    minutes: 4,
    points: 40,
    brief: `Download the handwritten note and **attach it**.

Ask the assistant to **type out what it says**.`,
    deliverable: "The note, as text.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [{ id: "transcribed", label: "The note's lines are transcribed accurately" }],
    fixtures: [{ filename: "handwritten-note.png", title: "Handwritten note", url: "/fixtures/handwritten-note.png", mediaType: "image/png" }],
    hints: [{ text: "Attach the image and ask for 'the exact text'." }],
  },
  {
    slug: "picture-math",
    order: 19,
    title: "Picture math",
    hook: "It can read a table out of a screenshot and do the sums.",
    teaches: "Screenshot input and extraction: pull numbers out of a picture",
    badges: ["screenshot", "extraction"],
    minutes: 5,
    points: 50,
    brief: `Download the screenshot of the sales table and **attach it**.

Ask for the **total of the June column**.`,
    deliverable: "The June total.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [{ id: "june", label: "The June total is correct" }],
    fixtures: [{ filename: "regional-sales-q2.png", title: "Screenshot of the sales table", url: "/fixtures/regional-sales-q2.png", mediaType: "image/png" }],
    hints: [{ text: "Ask it to read the table out first, then do the sums. Errors show up in the read-out." }],
  },

  /* ------------------------------------------------------------ search and research */
  {
    slug: "fresh-news",
    order: 20,
    title: "Fresh news",
    hook: "Its memory has a cutoff. Turn on search when the question is about now.",
    teaches: "Live search: turn it on when the question is about now",
    badges: ["web-search"],
    minutes: 5,
    points: 45,
    brief: `Ask for **two news stories from this week about outdoor gear**, with links.`,
    deliverable: "Two recent stories with links.",
    behaviors: [{ id: "search", label: "Turned on web search", event: "web_search_on" }],
    checks: [
      { id: "two-items", label: "Two distinct items, each dated within the last seven days" },
      { id: "sourced", label: "Each has a real link from the search results" },
    ],
    hints: [{ text: "Look in the + menu for Web search. Without it the assistant cannot see the news." }],
  },
  {
    slug: "check-it",
    order: 21,
    title: "Check it",
    hook: "Ask it to verify its own answer with search and it will correct itself.",
    teaches: "Verification with search: make it check its own answer",
    badges: ["verification", "web-search"],
    minutes: 6,
    points: 55,
    brief: `With web search **off**, ask: **when was Gore-Tex invented, and by whom?**

Then turn web search **on** and tell the assistant to **verify its previous answer** and list anything it got wrong or was unsure about.`,
    deliverable: "An unsearched answer, then a searched verification with corrections.",
    behaviors: [{ id: "sent", label: "Asked once with search off", event: "message_sent" }, { id: "search", label: "Turned on web search for the check", event: "web_search_on" }],
    checks: [
      { id: "two-turns", label: "First answer had no search; the second turn used search" },
      { id: "verified", label: "The second turn compared the two and stated corrections or confirmed each fact" },
    ],
    hints: [{ text: "Ask plainly first. Then switch search on and say 'Verify what you just told me.'" }],
  },
  {
    slug: "deep-dive",
    order: 22,
    title: "Deep dive",
    hook: "Research mode runs many searches and writes a cited report.",
    teaches: "Deep research: many searches, then a structured report",
    badges: ["deep-research"],
    minutes: 10,
    points: 70,
    brief: `Turn on **Research** and ask: **how are outdoor apparel brands handling supplier delays in 2026?**

You want a proper report with sources, not a quick answer.`,
    deliverable: "A sectioned, cited report.",
    behaviors: [{ id: "research", label: "Turned on Research", event: "research_on" }],
    checks: [
      { id: "structure", label: "A title and three or more headed sections" },
      { id: "sources", label: "Four or more distinct cited sources with links" },
    ],
    hints: [{ text: "Research is in the + menu next to Web search. It runs several searches before writing." }],
  },
  {
    slug: "read-the-link",
    order: 23,
    title: "Read the link",
    hook: "Paste a URL and it reads the page for you.",
    teaches: "Link reading: hand over a page and ask about it",
    badges: ["url-reading", "summarizing"],
    minutes: 4,
    points: 40,
    brief: `Paste this link and ask **what the page says**:

https://en.wikipedia.org/wiki/Ultralight_backpacking`,
    deliverable: "A summary of the page.",
    behaviors: [{ id: "link", label: "The assistant fetched the link", event: "link_read" }],
    checks: [{ id: "bullets", label: "The summary reflects the fetched page" }],
    hints: [{ text: "Just paste the URL with your request. The assistant fetches it." }],
  },

  /* ------------------------------------------------------------ tools and setup */
  {
    slug: "pick-the-brain",
    order: 24,
    title: "Pick the right brain",
    hook: "Hard reasoning needs the bigger model and more effort. You choose.",
    teaches: "Model choice: pick Smart and High effort for hard reasoning",
    badges: ["model-choice"],
    minutes: 6,
    points: 55,
    brief: `A jacket sells for **$249**. It costs **$92** to make. Retail partners buy it at **45 percent off** the price. Wholesale orders cost **$11** per unit to fulfil, direct online orders cost **$19**.

Switch to the **Smart** model and **High** effort, then ask for the **profit per unit on wholesale versus direct**.`,
    deliverable: "Two correct numbers, asked with Smart and High.",
    behaviors: [
      { id: "smart", label: "Selected the Smart model", event: "model_selected", detail: "smart" },
      { id: "high", label: "Set effort to High", event: "effort_selected", detail: "high" },
    ],
    checks: [
      { id: "wholesale", label: "Wholesale profit per unit is correct" },
      { id: "direct", label: "Direct profit per unit is correct" },
    ],
    hints: [{ text: "The model picker is at the bottom right of the composer. Change both the model and the effort." }],
  },
  {
    slug: "connect-and-ask",
    order: 25,
    title: "Connect and ask",
    hook: "Connect a data source and it can answer from the numbers directly.",
    teaches: "Connectors: plug in a data source and ask it directly",
    badges: ["connectors", "extraction"],
    minutes: 6,
    points: 60,
    brief: `Connect the **data warehouse** (Customize, then Connectors).

Ask for the company's **revenue in the most recent month on record**.`,
    deliverable: "The latest month's revenue, read from the warehouse.",
    behaviors: [{ id: "used", label: "Used the warehouse connector", event: "connector_used", detail: "warehouse" }],
    checks: [{ id: "number", label: "The latest month's revenue is correct" }],
    hints: [{ text: "Customize in the sidebar, then Connectors. Connect the warehouse, then ask." }],
  },
  {
    slug: "inbox-to-reply",
    order: 26,
    title: "Inbox to reply",
    hook: "With your inbox connected it finds the email and drafts the reply.",
    teaches: "Connectors and drafting: work an inbox through the assistant",
    badges: ["connectors", "drafting"],
    minutes: 7,
    points: 60,
    brief: `Connect **Gmail**.

Ask the assistant to find your **newest unread email** and **draft a short reply** to it.`,
    deliverable: "The right email found, and a reply drafted.",
    behaviors: [{ id: "gmail", label: "Used the Gmail connector", event: "connector_used", detail: "gmail" }],
    checks: [
      { id: "found", label: "The newest unread email was identified correctly" },
      { id: "reply", label: "The draft replies to what that email asks" },
    ],
    hints: [{ text: "Customize, then Connectors, connect Gmail. Then say 'Find my newest unread email and draft a reply.'" }],
  },
  {
    slug: "skill-up",
    order: 27,
    title: "Skill up",
    hook: "A slash command runs saved instructions so you never re-explain the format.",
    teaches: "Skills: invoke a saved prompt with a slash command",
    badges: ["skills", "connectors"],
    minutes: 6,
    points: 55,
    brief: `Connect **Drive**. There is a **leadership meeting transcript** in it.

Type **/meeting-notes** and ask for notes on that transcript. The skill sets the format; you should not have to describe it.`,
    deliverable: "Decisions, action items and open questions from the transcript.",
    behaviors: [
      { id: "skill", label: "Invoked a skill with /", event: "skill_invoked", detail: "meeting-notes" },
      { id: "drive", label: "Read the transcript from Drive", event: "connector_used", detail: "drive" },
    ],
    checks: [{ id: "sections", label: "Notes with Decisions, Action items and Open questions, drawn from the transcript" }],
    hints: [{ text: "Type / in the message box and pick meeting-notes. Then say which file." }],
  },
  {
    slug: "make-a-skill",
    order: 28,
    title: "Make a skill",
    hook: "Anything you ask for twice can become your own slash command.",
    teaches: "Skills: write your own and run it",
    badges: ["skills"],
    minutes: 7,
    points: 60,
    brief: `Create a skill called **/three-lines** (Customize, then Skills). Its instruction: *turn any text into three short lines*.

Then run it on this:

> ${BACK_TRANSLATE}`,
    deliverable: "A saved skill, invoked once, producing three short lines.",
    behaviors: [
      { id: "created", label: "Created a skill", event: "skill_created" },
      { id: "invoked", label: "Invoked it with /", event: "skill_invoked", detail: "three-lines" },
    ],
    checks: [{ id: "three", label: "The output is three short lines" }],
    hints: [{ text: "Customize, then Skills, then Add. Name it three-lines and paste the instruction." }, { text: "In the chat, type /three-lines, then paste the paragraph." }],
  },
  {
    slug: "set-up-shop",
    order: 29,
    title: "Set up shop",
    hook: "Rules in a project's instructions apply to every chat inside it.",
    teaches: "Projects: instructions that every chat inside inherits",
    badges: ["projects", "custom-instructions"],
    minutes: 6,
    points: 55,
    brief: `Create a **project** and put one rule in its **instructions**: *always answer in three bullets*.

Start a chat **inside the project** and ask it anything. Do not mention the rule in the chat.`,
    deliverable: "A three-bullet answer to a question that never mentioned bullets.",
    behaviors: [
      { id: "project", label: "Created a project", event: "project_created" },
      { id: "inside", label: "Started a chat inside it", event: "chat_in_project" },
    ],
    checks: [
      { id: "format", label: "The reply is three bullets" },
      { id: "no-repeat", label: "The chat message did not mention bullets or the rule" },
    ],
    hints: [{ text: "Projects in the sidebar, then New project. Paste the rule into Instructions." }, { text: "Open the project and start a chat from there." }],
  },
  {
    slug: "call-me",
    order: 30,
    title: "Call me",
    hook: "Custom instructions follow you into every chat.",
    teaches: "Personalization: custom instructions the assistant always follows",
    badges: ["personalization"],
    minutes: 4,
    points: 40,
    brief: `Open **Settings** (the gear, top right), then **General**, and add one custom instruction: **call me Captain**.

Start a **new chat** and ask anything.`,
    deliverable: "A reply that calls you Captain without being asked in the chat.",
    behaviors: [{ id: "set", label: "Saved custom instructions", event: "instructions_set" }],
    checks: [{ id: "honoured", label: "The reply addresses the user as Captain, with the name never mentioned in the chat" }],
    hints: [{ text: "Gear top right, General, type the instruction, Save. Then New." }],
  },
  {
    slug: "remember-this",
    order: 31,
    title: "Remember this",
    hook: "Ask it to remember something and later chats know it.",
    teaches: "Memory: tell it to remember, then use it in a fresh chat",
    badges: ["memory"],
    minutes: 5,
    points: 40,
    brief: `In a chat, tell the assistant to **remember that your favourite trail is the Timberline Trail**.

Then start a **new chat** and ask **"which trail do I like best?"** It should know.`,
    deliverable: "The right trail, answered in a chat you never told it in.",
    behaviors: [{ id: "saved", label: "The assistant saved a memory", event: "memory_saved" }],
    checks: [{ id: "recalled", label: "In a second chat, the assistant named the Timberline Trail without being told again" }],
    hints: [{ text: "Say 'Remember this: my favourite trail is the Timberline Trail.' Then use New for a fresh chat." }],
  },
  {
    slug: "say-it",
    order: 32,
    title: "Say it out loud",
    hook: "You can talk instead of type, and it transcribes as you go.",
    teaches: "Voice dictation: speak the prompt instead of typing it",
    badges: ["dictation"],
    minutes: 3,
    points: 35,
    brief: `Click the **microphone** in the message box and **say** this, then send it:

> "Give me three tips for packing up a tent when it is still wet."

Fix any words it misheard before you send.`,
    deliverable: "A dictated message and a reply with three tips.",
    behaviors: [{ id: "voice", label: "Dictated a message", event: "dictation_used" }],
    checks: [{ id: "tips", label: "The reply gives three tips about packing a wet tent" }],
    hints: [{ text: "The microphone is at the bottom right of the message box, next to Send. Click it once, speak, click it again to stop." }],
  },
  {
    slug: "hand-it-off",
    order: 33,
    title: "Hand it off",
    hook: "In Cowork mode it plans the steps and works through them on its own.",
    teaches: "Cowork: give it a multi-step task and let it run",
    badges: ["cowork", "connectors"],
    minutes: 6,
    points: 55,
    brief: `Connect **Gmail** and the **data warehouse**. Switch the composer from **Chat** to **Cowork**.

Then say: **"Read my newest unread email and pull the numbers it asks for from the warehouse."** Watch it work.`,
    deliverable: "The email found and its numbers pulled, in one go.",
    behaviors: [
      { id: "cowork", label: "Used Cowork mode", event: "cowork_on" },
      { id: "gmail", label: "Read Gmail", event: "connector_used", detail: "gmail" },
      { id: "warehouse", label: "Read the warehouse", event: "connector_used", detail: "warehouse" },
    ],
    checks: [{ id: "numbers", label: "The reply reports figures from the warehouse that the email asked for" }],
    hints: [{ text: "The Chat / Cowork switch is in the message box. Cowork keeps going through several steps without asking." }],
  },
];

export const TOTAL_POINTS = CHALLENGES.reduce((s, c) => s + c.points, 0);

/** Feature challenges count toward Tool sense. */
export const FEATURE_SLUGS = new Set(["one-page", "pull-the-table", "read-the-pdf", "show-dont-tell", "picture-to-text", "picture-math", "fresh-news", "check-it", "deep-dive", "read-the-link", "pick-the-brain", "connect-and-ask", "inbox-to-reply", "skill-up", "make-a-skill", "set-up-shop", "call-me", "remember-this", "say-it", "hand-it-off"]);

export function getChallenge(slug: string) {
  return CHALLENGES.find((c) => c.slug === slug) ?? null;
}
