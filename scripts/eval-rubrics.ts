/** Local, fixture-based model evaluations; no member data or leaderboard writes. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CHALLENGES, getChallenge } from "../src/lib/arena/challenges";
import { gradeAttempt } from "../src/lib/arena/grader";
import { EMAILS } from "../src/lib/company/gmail";
import { TABLES } from "../src/lib/company/warehouse";
import { DRIVE } from "../src/lib/company/drive";

const U = (s: string) => {
  const match = /^\[Effective settings:(\{.*?\})\]\s*/s.exec(s);
  return match ? `SYSTEM SETTINGS (not user-written text):\n${match[1]}\n\nUSER:\n${s.slice(match[0].length)}\n\n` : `USER:\n${s}\n\n`;
};
const A = (s: string) => `ASSISTANT:\n${s}\n\n`;
const tool = (name: string, output: unknown, input: unknown = {}) => `[tool call: ${name} input=${JSON.stringify(input)}]\n[tool result: ${JSON.stringify(output)}]\n`;
const samples = (slug: string) => getChallenge(slug)!.materials?.map((m) => "body" in m ? m.body : "").join("\n\n") ?? "";
const newest = [...EMAILS].filter((e) => e.unread).sort((a,b) => b.date.localeCompare(a.date))[0];
const fin = TABLES.find((t) => t.name === "monthly_financials")!;
const regional = TABLES.find((t) => t.name === "regional_sales")!;
const foundMail = tool("search_gmail", { emails: [newest] }) + tool("read_email", newest, { id: newest.id });
const meeting = DRIVE.find((d) => /leadership/i.test(d.name));
const cases: Record<string, string> = {
  "ten-words": U("Explain gravity in10words") + A("Gravity attracts masses, causing falling, orbits, tides, and cosmic structure."),
  "make-it-ask-first": U("Help me plan a team offsite; ask3questions before planning") + A("What is the goal? How many people? What is the budget?"),
  "grade-yourself": U("Draft a shipping-delay note") + A("Your order is late. Sorry.") + U("Grade that draft and improve it") + A("4/10: unclear timing and no next step. Rewrite: Your order is delayed. We’re confirming the delivery date and will email you tomorrow with an update. Sorry for the wait."),
  "three-audiences": U("Explain why the sky is blue for5-year-old,high-school graduate,PhD") + A("Age5: Sunlight has lots of colors. Air spreads the blue light around, so you see a blue sky.\nHigh-school graduate: Molecules in the atmosphere scatter short blue wavelengths more strongly than longer red wavelengths. Scattered blue light reaches your eyes from across the sky.\nPhD: In the Rayleigh regime, molecular scattering intensity scales as wavelength to the inverse fourth power. The perceived blue is shaped by the solar spectrum, atmospheric transmission and human spectral sensitivity."),
  "the-other-side": U("Remote work is better. Argue the opposite hard, no both-sides") + A("Office work makes mentorship immediate: a junior colleague can learn by watching decisions and asking questions in the moment. Remote teams have to schedule what an office makes spontaneous, slowing feedback and onboarding."),
  "rehearsal": U("Be a tough customer asking for a discount") + A("Your competitor is cheaper. Give me20%off.") + U("Our price stays the same; it includes setup.") + A("I don’t need setup. Surely you can knock something off?") + U("The price is fixed; I can show you how the setup saves time. Break character and coach me.") + A("You held your price and redirected to value. Next time ask what outcome the customer needs before describing setup."),
  "twenty-then-three": U("Give twenty names for a new tent") + A(Array.from({length:20},(_,i)=>`${i+1}. ${['Dawn','Pine','Peak','Trail','River','Cloud','Moss','Stone','Sky','Grove','Ridge','Vale','Fern','Field','Cove','Dune','Birch','Lark','Nest','Moon'][i]}`).join('\n')) + U("Choose three that have four letters") + A("Dawn, Pine, Peak."),
  "tutor-mode": U("Teach gross margin by quizzing me one question at a time") + A("Revenue is100and cost is60. What is the gross profit?") + U("40") + A("Correct. Given that gross profit of40, what fraction of100is the gross margin?"),
  "deslop": U(samples("deslop") + "\nRewrite plainly, keep meaning") + A("Teams get more done when they communicate clearly, use useful tools, and work together."),
  "sound-like-you": U(samples("sound-like-you") + "\nWrite about a delayed delivery in this voice") + A("Quick one. The delivery slipped to Friday. Not ideal, but we can still make the launch if we pack Monday. I’ve asked for tracking. Shout if that changes your plan."),
  "reply-to-this": U(samples("reply-to-this") + "\nDecline briefly") + A("Sorry, I can’t cover Saturday. Hope you find someone."),
  "there-and-back": U(samples("there-and-back") + "\nFrench,back toEnglish,compare") + A("French: Notre tente la plus légère pèse moins d’un kilo, accueille deux personnes et se monte en trois minutes avec un seul arceau. Elle est conçue pour ceux qui comptent les grammes mais veulent dormir au sec.\nBack: Our lightest tent weighs less than a kilo, fits two people, and sets up in three minutes with one pole. It is designed for people who count grams but want to sleep dry.\nChanges: ‘sleeps two’ became ‘fits two people’;‘pitches’ became‘sets up’. Meaning and measurements remain."),
  "one-page": U('[attached file: expense-policy.txt]\n'+samples("one-page")) + A("- Claim within30days.\n- Receipts are required for amounts over$25.\n- Managers approve up to$500.\n- Hotel caps are$220in major cities and$160elsewhere.\n- Meals while traveling are capped at$65a day."),
  "pull-the-table": U('[attached file: trade-show-expenses.txt]\n'+samples("pull-the-table")) + A("|Expense|USD|\n|---|---:|\n|Booth|2400|\n|Catalogues|126|\n|Shipping|218.50|\n|Lunches|243|\n|Badges|58|\n|Hotel|378|\n|Taxis|51.70|\n|Surcharge|45|\n|Banner|112|\n|Parking|54|\n|Total|3686.20|"),
  "read-the-pdf": U('[attached file: supply-agreement.pdf] Price per metre and minimum?') + A("USD3.85per metre; minimum8000metres per colour."),
  "show-dont-tell": U('[attached file: care-label.png] One prohibited action?') + A("Never use fabric softener."),
  "picture-to-text": U('[attached file: handwritten-note.png] Transcribe') + A("Trade show, Thursday.\nBooth 214, hall B, set up from 7am.\nBring 40 catalogues and the demo tent.\nBuyer meetings 10:30, 1:15 and 3:00.\nCall the freight desk before 4pm.\nDinner with the retail team at 7, Alder Street."),
  "picture-math": U('[attached file: regional-sales-q2.png] Total June?') + A("The June total is $1.789million."),
  "fresh-news": U("Two outdoor gear stories from past7days with links") + tool("web_search", { results: [{title:"New hiking boot released",date:"2026-09-05",url:"https://example.com/boots"},{title:"New rain jacket released",date:"2026-09-04",url:"https://example.com/jacket"}] }) + A("Sep5:New hiking boot released:https://example.com/boots\nSep4:New rain jacket released:https://example.com/jacket"),
  "check-it": U('[Effective settings:{"webSearch":false}] When and by whom was GoreTex invented?') + A("Bob Gore discovered expandedPTFEin1969.") + U('[Effective settings:{"webSearch":true}] Verify that') + tool("web_search", { url:"https://www.gore.com/about/our-history", text:"Bob Gore discovered expandedPTFEin1969." }) + A("The search confirms both claims: Bob Gore,1969. No correction to either fact is needed."),
  "deep-dive": U("Research outdoor apparel brands handling supplier delays in2026") + tool("web_search", {results:[{url:"https://example.com/report-a",text:"2026:brands use multiple suppliers"},{url:"https://example.com/report-b",text:"2026:brands increase buffer inventory"}]}) + A("# Supplier delays in2026\n## Diversify sourcing\nOutdoor apparel brands use more than one supplier to reduce dependence.[Source](https://example.com/report-a)\n## Hold buffers\nThey also increase buffer inventory.[Source](https://example.com/report-b)"),
  "read-the-link": U("Read https://en.wikipedia.org/wiki/Ultralight_backpacking") + tool("read_link", {url:"https://en.wikipedia.org/wiki/Ultralight_backpacking",text:"Ultralight backpacking minimizes carried weight through lightweight gear and careful choices. Safety tradeoffs matter."}) + A("The page explains reducing pack weight through lighter gear and careful choices while managing safety tradeoffs."),
  "pick-the-brain": U("Smart:$249jacket,cost92,partner45%off;earnings?") + A("249×0.55−92=$44.95per jacket."),
  "connect-and-ask": U("Latest monthly revenue?") + tool("read_table", fin, {name:fin.name}) + A("August2025:USD2.49million."),
  "inbox-to-reply": U("Find newest unread email and draft a short reply") + foundMail + A("Newest unread: Board deck: what I need from ops. Draft: Thanks, I’ll prepare the supplier-plan slide, FY24 margin trend and Q3 regional sales for your review by10September."),
  "skill-up": U('[Effective settings:{"skill":"meeting-notes"}] /meeting-notes on leadership transcript') + tool("read_drive_file", meeting) + A("## Decisions\n- Request an alternative fabric sample.\n- No air freight yet.\n- Keep the retail partner at net30.\n## Action items\n- Marcus: model options by 3 September.\n## Open questions\n- Will the fabric sample pass testing?"),
  "make-a-skill": U('[Effective settings:{"skill":"three-lines"}] '+samples("make-a-skill")) + A("Under a kilo, with room for two.\nOne pole sets up in three minutes.\nStay dry without extra weight."),
  "set-up-shop": U('[Effective settings:{"projectInstructions":"Always answer in three bullets"}] Name some breakfast foods') + A("- Eggs\n- Oats\n- Toast"),
  "call-me": U('[Effective settings:{"customInstructions":"Call me Captain"}] What is2+2?') + A("Four, Captain."),
  "remember-this": "=== CHAT: First ===\n" + U("Remember my favourite trail is Timberline Trail") + tool("remember",{saved:true,fact:"Favourite trail is Timberline Trail"}) + A("Remembered.") + "=== CHAT: Second ===\n" + U('[Effective settings:{"memories":["Favourite trail is Timberline Trail"]}] Which trail do I like best?') + A("Timberline Trail."),
  "say-it": U("Give3tips for packing a wet tent") + A("1.Shake off water.\n2.Pack the wet fly separately.\n3.Dry it fully at home before storing."),
  "hand-it-off": U("Read newest unread email and pull its numbers from warehouse") + foundMail + tool("read_table",fin,{name:fin.name}) + tool("read_table",regional,{name:regional.name}) + A("For the CFO’s newest unread request: FY24 margins by month:Jan39.2%,Feb38.7%,Mar40.1%,Apr40.6%,May41.0%,Jun41.3%,Jul41.8%,Aug42.4%,Sep41.1%,Oct43.0%,Nov44.2%,Dec43.6%. Q3to-date regional sales:PNW$1.96M,MountainWest$1.39M,Northeast$0.94M,Online$0.51M. These are from monthly_financials and regional_sales. The supplier plan is outside the numerical request."),
  "choose-your-own": U("Write a bio after2clickable questions,one at a time") + tool("ask_user","Friendly",{question:"Tone?",options:["Friendly","Formal"]}) + tool("ask_user","Hiking",{question:"Interest?",options:["Hiking","Music"]}) + A("Hi! I’m happiest out on a trail and always up for a good hiking adventure."),
  "refine-it": U("Three weekend trips") + A("Coast,hills,city.") + U("Expand coast") + A("Stay by the beach, walk the cliffs, and enjoy seafood at sunset.") + U("Cut to2sentences") + A("Stay by the beach. Walk the cliffs at sunset.") + U("Different angle") + A("Try a quiet cabin in the woods instead.") + U("Compare in a table") + A("|Idea|Experience|\n|---|---|\n|Coast|Beach|\n|Hills|Hike|\n|City|Culture|\n|Cabin|Quiet|"),
  "one-paragraph": U(samples("one-paragraph") + "\nOne paragraph") + A("The policy explains how to claim work expenses: managers approve claims up to $500, department heads up to $2,500, and finance above that; submit within 30 days, with receipts for amounts over $25, then follow the travel booking rules and hotel limits."),
  "chain-it": U("3recent ebike stories,3line summary,email me") + tool("web_search",{results:[{url:"https://example.com/a",date:"2026-09-05",text:"New commuter bike"},{url:"https://example.com/b",date:"2026-09-04",text:"Cargo bike launch"},{url:"https://example.com/c",date:"2026-09-03",text:"Battery update"}]}) + A("New commuter bike launched.\nNew cargo bike launched.\nBattery range updated.") + tool("send_email",{sent:true,to:"you"},{to:"me",subject:"Ebikes",body:"New commuter bike launched.\nNew cargo bike launched.\nBattery range updated."}),
  "search-off": U('[Effective settings:{"webSearch":false,"research":false}] Limerick aboutMondays') + A("On Mondays I struggle to rise,\nWith sleep still attached to my eyes.\nI reach for my brew,\nAnd muddle on through,\nTill coffee provides a surprise."),
  "memory-off": U('[Effective settings:{"memoryOff":true,"memories":[],"customInstructions":"Call me Captain"}] What do you remember about me?') + A("Memory is off in this chat, Captain, so I’m not using saved facts about you."),
};
async function main() {
  const only = new Set(process.argv.slice(2));
  const queue = CHALLENGES.filter((c) => c.checks.length && (!only.size || only.has(c.slug)));
  const results: unknown[] = [];
  let failures = 0;
  async function worker() {
    while (queue.length) {
      const c = queue.shift()!;
      if (!cases[c.slug]) throw new Error(`Missing positive fixture:${c.slug}`);
      for (const positive of [true,false]) {
        const g = await gradeAttempt(c, positive ? cases[c.slug] : U("Say hello") + A("Hello."), "2026-09-06", undefined, positive ? cases[c.slug].split("ASSISTANT:\n").at(-1)?.trim() : "Hello.");
        const pass = g.checks.every((k) => k.verdict === "pass");
        const ok = pass === positive;
        if (!ok) failures++;
        results.push({slug:c.slug,positive,ok,...g});
        console.log(`${ok ? "PASS" : "FAIL"} ${c.slug} ${positive ? "valid" : "invalid"}${ok ? "" : " "+JSON.stringify(g.checks)}`);
      }
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  const previous: {slug: string}[] = only.size && existsSync("verify/rubric-evals.json") ? JSON.parse(readFileSync("verify/rubric-evals.json", "utf8")) : [];
  writeFileSync("verify/rubric-evals.json", JSON.stringify([...previous.filter((x) => !only.has(x.slug)), ...results],null,2));
  if (failures) process.exitCode=1;
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "Evaluation failed"); process.exitCode=1; });
