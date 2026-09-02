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
    hook: "The tightest instruction you will ever give.",
    teaches: "Constraints: tell it exactly how long, and it obeys",
    badges: ["constraints"],
    minutes: 3,
    points: 25,
    brief: `Ask the assistant: **why do tents get wet inside on a cold night?**

Get the answer in **exactly ten words**. Not nine, not eleven.`,
    deliverable: "A ten-word answer.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [{ id: "ten", label: "The final answer is exactly ten words" }],
    hints: [{ text: "Put the length rule in the same message as the question: 'Answer in exactly ten words.'" }, { text: "If it misses, say 'Count the words and try again.' The arena grades the final reply." }],
  },
  {
    slug: "make-it-ask-first",
    order: 2,
    title: "Make it ask first",
    hook: "The best answer starts with the assistant's questions, not yours.",
    teaches: "Make it ask first: get the questions before the plan",
    badges: ["interviewing"],
    minutes: 5,
    points: 40,
    brief: `You need a plan for a **two-day team offsite for twelve people**.

Do not let the assistant guess. Tell it to **interview you first**: at least three questions, one at a time or all at once, before it writes anything. Answer them, then get the plan.`,
    deliverable: "Questions from the assistant, your answers, then a plan built on them.",
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
    hook: "The first draft is never the deliverable.",
    teaches: "Iteration and verification: make it critique and redo its own work",
    badges: ["iteration", "verification"],
    minutes: 6,
    points: 45,
    brief: `Ask for a **100-word note to customers announcing a two-week shipping delay**.

Then make the assistant **grade its own draft** out of 10 against three criteria you name (for example: clear, apologetic without grovelling, tells them what happens next). Finally, have it **rewrite** to fix what it marked down.`,
    deliverable: "Draft, a scored critique against three criteria, and a rewrite.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "rubric", label: "The assistant scored the draft against three named criteria" },
      { id: "rewrite", label: "A rewrite followed that differs from the first draft" },
    ],
    hints: [{ text: "Three messages: ask for the draft, ask for the grade, ask for the rewrite." }, { text: "Name your criteria explicitly so the grade is against something." }],
  },
  {
    slug: "two-audiences",
    order: 4,
    title: "Two audiences",
    hook: "Same fact, two very different readers.",
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
    hook: "If it agrees with you, you learned nothing.",
    teaches: "Steelman: get the strongest case against your view",
    badges: ["steelman"],
    minutes: 5,
    points: 45,
    brief: `Take this position: **"Remote work is better than office work for a small company."**

Tell the assistant you hold that view, then make it argue the **strongest possible case against it**, no hedging. When it has, ask it to name the **weakest point in its own argument**.`,
    deliverable: "A real counter-argument, then its weakest point.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "counter", label: "The assistant argued against remote work with concrete points and no 'both sides' hedging" },
      { id: "weakest", label: "It then identified the weakest point of its own case" },
    ],
    hints: [{ text: "Say 'Argue the opposite as hard as you can. No balance, no caveats.'" }, { text: "Then: 'Which of your points is weakest, and why?'" }],
  },
  {
    slug: "rehearsal",
    order: 6,
    title: "Rehearsal",
    hook: "Practise the hard conversation before you have it.",
    teaches: "Roleplay: make it play the other person, then coach you",
    badges: ["roleplay", "iteration"],
    minutes: 6,
    points: 50,
    brief: `A retail buyer wants a **10 percent discount** on next season's order. You need to hold the price.

Have the assistant **play the buyer** for **three rounds** (it pushes, you respond, three times). Then tell it to **break character** and give you feedback on how you did.`,
    deliverable: "Three in-character exchanges, then out-of-character coaching.",
    behaviors: [{ id: "sent", label: "Sent at least four messages", event: "message_sent" }],
    checks: [
      { id: "character", label: "The assistant stayed in character as the buyer for three exchanges" },
      { id: "coach", label: "After 'break character', it gave feedback on the user's responses" },
    ],
    hints: [{ text: "Open with: 'Play a retail buyer pushing for 10% off. Stay in character until I say stop.'" }, { text: "After three rounds: 'Break character. How did I do?'" }],
  },
  {
    slug: "twenty-then-three",
    order: 7,
    title: "Twenty then three",
    hook: "Quantity first. Judgement second.",
    teaches: "Brainstorming with constraints: go wide, then cut by a rule",
    badges: ["brainstorming", "constraints"],
    minutes: 5,
    points: 40,
    brief: `Get **twenty names for a new ultralight tent**, numbered.

Then give the assistant one criterion, **"easy to say out loud in a shop"**, and have it pick the **best three** and say why each passed.`,
    deliverable: "Twenty numbered names, then three picked by the criterion.",
    behaviors: [{ id: "sent", label: "Sent at least two messages", event: "message_sent" }],
    checks: [
      { id: "twenty", label: "Twenty numbered names were produced" },
      { id: "three", label: "Three were chosen with reasons that reference the criterion" },
    ],
    hints: [{ text: "Ask for exactly twenty, numbered. Then in a second message give the criterion and ask for three." }],
  },
  {
    slug: "side-by-side",
    order: 8,
    title: "Side by side",
    hook: "Decisions get easier in a grid.",
    teaches: "Comparisons: force a table and a recommendation",
    badges: ["comparisons"],
    minutes: 5,
    points: 40,
    brief: `Compare **three ways to ship a 12 kg parcel across the country**: courier, postal service, and pallet freight.

Make the assistant build a **table** with your four criteria: **cost, speed, tracking, and damage risk**. Then it must **pick one** for a fragile, non-urgent shipment and say why.`,
    deliverable: "A three-by-four table and a recommendation.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "table", label: "A table with the three options and the four criteria" },
      { id: "pick", label: "One option recommended for fragile and non-urgent, with a reason" },
    ],
    hints: [{ text: "Say 'as a table' and list the four criteria by name." }],
  },
  {
    slug: "tutor-mode",
    order: 9,
    title: "Tutor mode",
    hook: "Stop it lecturing. Make it teach.",
    teaches: "Tutor mode: one question at a time, adapts to your answers",
    badges: ["tutoring"],
    minutes: 6,
    points: 50,
    brief: `Learn **what gross margin is and how it is calculated**, but not from a lecture.

Tell the assistant to **quiz you one question at a time**, wait for your answer, and adjust the next question to what you got right or wrong. Go at least **three questions** deep.`,
    deliverable: "Three or more single questions with your answers in between.",
    behaviors: [{ id: "sent", label: "Sent at least three messages", event: "message_sent" }],
    checks: [
      { id: "one-at-a-time", label: "The assistant asked one question per turn and waited for the answer" },
      { id: "adapts", label: "Later questions responded to earlier answers (correcting or advancing)" },
    ],
    hints: [{ text: "Say 'Teach me gross margin by asking one question at a time. Don't explain until I answer.'" }],
  },
  {
    slug: "deslop",
    order: 10,
    title: "Deslop",
    hook: "You can hear AI writing. So can everyone else.",
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
    hook: "Two samples is all it needs to learn a voice.",
    teaches: "Style training: show samples, then get new writing in that voice",
    badges: ["style-training", "iteration"],
    minutes: 6,
    points: 45,
    brief: `Here are two notes written in your voice. Paste both, then ask for a **new note in the same voice** about a **delayed delivery of jackets**.

Sample 1:
> ${WRITING_SAMPLE_1}

Sample 2:
> ${WRITING_SAMPLE_2}

If the result sounds generic, tell it what to fix and get a second version.`,
    deliverable: "A new note that reads like the samples.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "samples", label: "Both samples were given to the assistant" },
      { id: "voice", label: "The new note matches the samples: short sentences, direct, no corporate filler, ends with a next step" },
    ],
    hints: [{ text: "Paste both samples in one message and say 'Write like this.'" }, { text: "Point at specifics: 'Shorter sentences. Start with the news. End with what happens next.'" }],
  },
  {
    slug: "reply-to-this",
    order: 12,
    title: "Reply to this",
    hook: "Say no without sounding like a robot.",
    teaches: "Drafting: brief the assistant with the message and the outcome",
    badges: ["drafting", "constraints"],
    minutes: 4,
    points: 40,
    brief: `A colleague sent this:

> ${FAVOUR_REQUEST}

Draft a reply that **says no**, **offers one alternative** (a different day, or finding someone else), and is **under 80 words**.`,
    deliverable: "A reply under 80 words that declines and offers an alternative.",
    behaviors: [{ id: "sent", label: "Sent a message", event: "message_sent" }],
    checks: [
      { id: "no", label: "The reply clearly declines the Saturday shift" },
      { id: "alt", label: "It offers one concrete alternative" },
      { id: "length", label: "It is under 80 words" },
    ],
    hints: [{ text: "Paste the message, then say what you want: 'Reply, say no, offer an alternative, under 80 words.'" }],
  },
  {
    slug: "there-and-back",
    order: 13,
    title: "There and back",
    hook: "Translation is easy. Knowing what got lost is the skill.",
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
    hook: "Nobody reads the whole policy. Make them not need to.",
    teaches: "File upload and summarizing: attach, then ask for the shape you want",
    badges: ["file-upload", "summarizing"],
    minutes: 5,
    points: 45,
    brief: `Download the expense policy from this brief and **attach it** to the chat.

Ask for **five bullets** a new starter must know, plus **one line** on what happens if a claim is late.`,
    deliverable: "Five bullets and a one-line answer on late claims.",
    behaviors: [{ id: "file", label: "Attached the file", event: "file_attached" }],
    checks: [
      { id: "five", label: "Five bullets drawn from the document" },
      { id: "late", label: "One line stating the late-claim rule correctly" },
    ],
    fixtures: [{ filename: "expense-policy.txt", title: "Expense policy", body: LONG_DOC }],
    hints: [{ text: "Use the + button or drag the file onto the chat. Then ask." }],
  },
  {
    slug: "pull-the-table",
    order: 15,
    title: "Pull the table",
    hook: "Messy notes in, clean table out.",
    teaches: "Data extraction from a file: name the columns you want",
    badges: ["extraction", "file-upload"],
    minutes: 6,
    points: 55,
    brief: `Download the trade show expense notes and **attach** them.

Get a **clean table** with exactly these columns: **item, quantity, unit price, total**. Then a **grand total** at the bottom.`,
    deliverable: "A four-column table and a grand total.",
    behaviors: [{ id: "file", label: "Attached the file", event: "file_attached" }],
    checks: [
      { id: "table", label: "A table with the four named columns" },
      { id: "total", label: "The grand total is correct" },
    ],
    fixtures: [{ filename: "trade-show-expenses.txt", title: "Trade show expense notes", body: MESSY_LINES }],
    hints: [{ text: "Name the four columns in your message. Say 'one row per line item'." }, { text: "Ask it to show the arithmetic for the total so you can check it." }],
  },
  {
    slug: "read-the-pdf",
    order: 16,
    title: "Read the PDF",
    hook: "PDFs are not walls. Ask them questions.",
    teaches: "PDF reading and extraction: attach the PDF, ask precise questions",
    badges: ["pdf", "extraction"],
    minutes: 6,
    points: 55,
    brief: `Download the supply agreement PDF and **attach it**.

Ask three things: the **price per metre**, the **minimum order per colour**, and the **maximum late-delivery credit**.`,
    deliverable: "Three correct figures from the PDF.",
    behaviors: [{ id: "file", label: "Attached the PDF", event: "file_attached" }],
    checks: [
      { id: "price", label: "Price per metre is correct" },
      { id: "minimum", label: "Minimum order per colour is correct" },
      { id: "credit", label: "Maximum late-delivery credit is correct" },
    ],
    fixtures: [{ filename: "supply-agreement.pdf", title: "Supply agreement (PDF)", url: "/fixtures/supply-agreement.pdf", mediaType: "application/pdf" }],
    hints: [{ text: "Attach the PDF with + and ask all three questions in one message." }],
  },
  {
    slug: "show-dont-tell",
    order: 17,
    title: "Show, don't tell",
    hook: "A photo is a prompt.",
    teaches: "Camera input: send a picture and ask about it",
    badges: ["camera"],
    minutes: 4,
    points: 35,
    brief: `Download the photo of the care label and **attach it**.

Ask for the **washing instructions as a checklist** and **one thing a customer should never do** with this jacket.`,
    deliverable: "A checklist from the label and one 'never'.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [
      { id: "checklist", label: "The care steps from the label are listed" },
      { id: "never", label: "One prohibited action from the label is named" },
    ],
    fixtures: [{ filename: "care-label.png", title: "Photo of the care label", url: "/fixtures/care-label.png", mediaType: "image/png" }],
    hints: [{ text: "Use the image button in the composer, or drag the picture in." }],
  },
  {
    slug: "picture-to-text",
    order: 18,
    title: "Picture to text",
    hook: "Handwriting, whiteboards, receipts. All readable.",
    teaches: "Image to text: transcribe first, then work with it",
    badges: ["ocr", "screenshot"],
    minutes: 4,
    points: 40,
    brief: `Download the handwritten note and **attach it**.

Get the text **transcribed exactly**, then turned into a **time-ordered checklist** for the day.`,
    deliverable: "A transcription and an ordered checklist.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [
      { id: "transcribed", label: "The note's lines are transcribed accurately" },
      { id: "ordered", label: "A checklist in time order follows" },
    ],
    fixtures: [{ filename: "handwritten-note.png", title: "Handwritten note", url: "/fixtures/handwritten-note.png", mediaType: "image/png" }],
    hints: [{ text: "Ask for 'the exact text first, then a checklist in the order things happen'." }],
  },
  {
    slug: "picture-math",
    order: 19,
    title: "Picture math",
    hook: "A screenshot of a table is still a table.",
    teaches: "Screenshot input and extraction: pull numbers out of a picture",
    badges: ["screenshot", "extraction"],
    minutes: 5,
    points: 50,
    brief: `Download the screenshot of the regional sales table and **attach it**.

Ask for the **total of the June column** and **which region grew most from April to June**.`,
    deliverable: "The June total and the fastest-growing region.",
    behaviors: [{ id: "image", label: "Attached an image", event: "image_attached" }],
    checks: [
      { id: "june", label: "The June total is correct" },
      { id: "growth", label: "The region with the largest April-to-June increase is correct" },
    ],
    fixtures: [{ filename: "regional-sales-q2.png", title: "Screenshot of the sales table", url: "/fixtures/regional-sales-q2.png", mediaType: "image/png" }],
    hints: [{ text: "Ask it to read the table out first, then do the sums. Errors show up in the read-out." }],
  },

  /* ------------------------------------------------------------ search and research */
  {
    slug: "fresh-news",
    order: 20,
    title: "Fresh news",
    hook: "The model's memory has a cutoff. The web doesn't.",
    teaches: "Live search: turn it on when the question is about now",
    badges: ["web-search"],
    minutes: 5,
    points: 45,
    brief: `Get **two news items about the outdoor gear industry from the last seven days**, each with the **date** and a **link**.

Old news does not count. Neither does anything made up.`,
    deliverable: "Two dated, linked items from the past week.",
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
    hook: "Confident is not the same as correct.",
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
    hook: "Some questions deserve a report, not a reply.",
    teaches: "Deep research: many searches, then a structured report",
    badges: ["deep-research"],
    minutes: 10,
    points: 70,
    brief: `Turn on **Research** and ask: **how are outdoor apparel brands handling supplier delays and near-shoring in 2026?**

You want a **report** with a title, at least **three headed sections**, and **four or more cited sources**.`,
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
    hook: "Paste the URL. Let it do the reading.",
    teaches: "Link reading: hand over a page and ask about it",
    badges: ["url-reading", "summarizing"],
    minutes: 4,
    points: 40,
    brief: `Paste this link and ask for **three bullets** on what the page says and **one sentence quoted directly** from it:

https://en.wikipedia.org/wiki/Ultralight_backpacking`,
    deliverable: "Three bullets and one direct quote from the page.",
    behaviors: [{ id: "link", label: "The assistant fetched the link", event: "link_read" }],
    checks: [
      { id: "bullets", label: "Three bullets that reflect the fetched page" },
      { id: "quote", label: "One sentence quoted from the page text" },
    ],
    hints: [{ text: "Just paste the URL with your request. The assistant fetches it." }],
  },

  /* ------------------------------------------------------------ tools and setup */
  {
    slug: "pick-the-brain",
    order: 24,
    title: "Pick the right brain",
    hook: "Fast for most things. Not for this.",
    teaches: "Model choice: pick Smart and High effort for hard reasoning",
    badges: ["model-choice"],
    minutes: 6,
    points: 55,
    brief: `A jacket sells for **$249**. It costs **$92** to make. Retail partners buy it at **45 percent off** the price. Wholesale orders cost **$11** per unit to fulfil, direct online orders cost **$19**.

Switch to the **Smart** model and **High** effort, then ask: **profit per unit on wholesale versus direct, and how many wholesale units equal the profit of 1,000 direct units?**`,
    deliverable: "Three correct numbers, asked with Smart and High.",
    behaviors: [
      { id: "smart", label: "Selected the Smart model", event: "model_selected", detail: "smart" },
      { id: "high", label: "Set effort to High", event: "effort_selected", detail: "high" },
    ],
    checks: [
      { id: "wholesale", label: "Wholesale profit per unit is correct" },
      { id: "direct", label: "Direct profit per unit is correct" },
      { id: "equiv", label: "The wholesale-unit equivalent of 1,000 direct units is correct" },
    ],
    hints: [{ text: "The model picker is at the bottom right of the composer. Change both the model and the effort." }],
  },
  {
    slug: "connect-and-ask",
    order: 25,
    title: "Connect and ask",
    hook: "The number is not in your head. It is in the data.",
    teaches: "Connectors: plug in a data source and ask it directly",
    badges: ["connectors", "extraction"],
    minutes: 6,
    points: 60,
    brief: `Connect the **data warehouse** (Connectors, in the sidebar).

Ask for the company's **revenue in the most recent month on record**, and make the assistant say **which table** it read.`,
    deliverable: "The latest month's revenue, with its table named.",
    behaviors: [{ id: "used", label: "Used the warehouse connector", event: "connector_used", detail: "warehouse" }],
    checks: [
      { id: "number", label: "The latest month's revenue is correct" },
      { id: "source", label: "The table it came from is named" },
    ],
    hints: [{ text: "Connectors in the sidebar. Connect the warehouse, then ask." }, { text: "If it guesses, say 'Read it from the warehouse, and tell me the table.'" }],
  },
  {
    slug: "inbox-to-reply",
    order: 26,
    title: "Inbox to reply",
    hook: "Find it, read it, answer it. Without opening your mail.",
    teaches: "Connectors and drafting: work an inbox through the assistant",
    badges: ["connectors", "drafting", "summarizing"],
    minutes: 7,
    points: 60,
    brief: `Connect **Gmail**.

Ask the assistant to find the **newest unread email** in your inbox, tell you **what it asks for** in one line, and **draft a reply** under 100 words that confirms you will do it by the date it names.`,
    deliverable: "The ask in one line and a reply under 100 words.",
    behaviors: [{ id: "gmail", label: "Used the Gmail connector", event: "connector_used", detail: "gmail" }],
    checks: [
      { id: "found", label: "The newest unread email was identified correctly" },
      { id: "reply", label: "The draft confirms the request by its date and is under 100 words" },
    ],
    hints: [{ text: "Connect Gmail in the sidebar, then say 'Find my newest unread email.'" }],
  },
  {
    slug: "skill-up",
    order: 27,
    title: "Skill up",
    hook: "Someone already wrote the instructions. Reuse them.",
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
    hook: "Anything you ask for twice deserves a slash command.",
    teaches: "Skills: write your own and run it",
    badges: ["skills", "custom-instructions"],
    minutes: 7,
    points: 60,
    brief: `Create a skill called **/three-lines** (Skills, in the sidebar). Its instruction: turn any text into **exactly three lines under 100 characters each**, no hashtags.

Then run it on this:

> ${BACK_TRANSLATE}`,
    deliverable: "A saved skill, invoked once, producing three short lines.",
    behaviors: [
      { id: "created", label: "Created a skill", event: "skill_created" },
      { id: "invoked", label: "Invoked it with /", event: "skill_invoked", detail: "three-lines" },
    ],
    checks: [{ id: "three", label: "The output is three lines, each under 100 characters, no hashtags" }],
    hints: [{ text: "Skills in the sidebar, then New skill. Name it three-lines and paste the instruction." }, { text: "In the chat, type /three-lines, then paste the paragraph." }],
  },
  {
    slug: "set-up-shop",
    order: 29,
    title: "Set up shop",
    hook: "Say the rules once. Never again.",
    teaches: "Projects: instructions that every chat inside inherits",
    badges: ["projects", "custom-instructions"],
    minutes: 6,
    points: 55,
    brief: `Create a **project** for a weekly summary. Put these rules in its **instructions**: *what shipped, what slipped, one number, one ask; under 120 words*.

Start a chat **inside the project** and ask for a summary of "this week" using anything it likes. Do not repeat the rules in the chat.`,
    deliverable: "A summary that follows the rules you never typed in the chat.",
    behaviors: [
      { id: "project", label: "Created a project", event: "project_created" },
      { id: "inside", label: "Started a chat inside it", event: "chat_in_project" },
    ],
    checks: [
      { id: "format", label: "The summary has the four parts and is under 120 words" },
      { id: "no-repeat", label: "The chat message did not restate the rules" },
    ],
    hints: [{ text: "Projects in the sidebar, then New project. Paste the rules into Instructions." }, { text: "Open the project and start a chat from there." }],
  },
  {
    slug: "call-me",
    order: 30,
    title: "Call me",
    hook: "Tell it once how you like things.",
    teaches: "Personalization: custom instructions the assistant always follows",
    badges: ["personalization", "custom-instructions"],
    minutes: 4,
    points: 40,
    brief: `Open **Customize** (the gear, top right) and set two custom instructions: **call me "Captain"**, and **end every reply with one question**.

Start a **new chat** and ask anything. The reply should do both without you asking.`,
    deliverable: "A reply that uses the name and ends with a question, unprompted.",
    behaviors: [{ id: "set", label: "Saved custom instructions", event: "instructions_set" }],
    checks: [{ id: "honoured", label: "The reply addresses the user as Captain and ends with a question, with neither asked for in the chat" }],
    hints: [{ text: "Customize is behind the gear at the top right, or your name at the bottom of the sidebar. Save after typing." }],
  },
  {
    slug: "remember-this",
    order: 31,
    title: "Remember this",
    hook: "Chats end. Memory doesn't have to.",
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
];

export const TOTAL_POINTS = CHALLENGES.reduce((s, c) => s + c.points, 0);

/** Feature challenges count toward Tool sense. */
export const FEATURE_SLUGS = new Set(["one-page", "pull-the-table", "read-the-pdf", "show-dont-tell", "picture-to-text", "picture-math", "fresh-news", "check-it", "deep-dive", "read-the-link", "pick-the-brain", "connect-and-ask", "inbox-to-reply", "skill-up", "make-a-skill", "set-up-shop", "call-me", "remember-this"]);

export function getChallenge(slug: string) {
  return CHALLENGES.find((c) => c.slug === slug) ?? null;
}
