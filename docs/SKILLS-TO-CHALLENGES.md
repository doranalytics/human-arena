# Skills first, then challenges

Plan drafted 2 Sep 2026. Replaces the ten Halden-flavoured challenges.

## Rules for every challenge

1. One skill per challenge (two at most). The card says the skill, not a story.
2. The brief is one or two sentences and contains no proper nouns: no company, no products, no colleagues.
3. The learner brings their own material wherever possible (their question, their writing, their photo). Where the arena must supply material it is pasted inline in the brief or is a single sample file, so nothing has to be remembered.
4. The connectors keep their synthetic data as furniture, but a brief only ever says "your inbox", "the data warehouse", "your Drive". The answer is in the tool, not in the learner's head.
5. Points reward doing the skill, not solving a puzzle.

## The 48 skills

The 46 from How to AI Games plus two the arena can watch that the old app could not: Model choice and Skills.

Ready now (graded from the transcript and the event log): constraints, make it ask first, iteration, verify the output, audience switching, steelman, roleplay, brainstorming, comparisons, tutor mode, style training, drafting, translation, summarizing, data extraction, file upload, PDF reading, camera input, image to text, screenshot input, live search, deep research, connectors, projects, custom instructions, model choice, skills, tool sense (meta: awarded on five feature passes).

Small build first: link reading (fetch a pasted URL), personalization (a custom-instructions box in Customize that the chat honours), memory (carry one fact across chats).

Later, the arena cannot observe them yet: voice dictation, voice chat, automations, browser agent, file agent, browser extension, agent building, image generation, image editing, artifacts, charts, diagrams, Claude Design, file export, calendar files, QR codes.

## The 30 challenges

| # | Challenge | Skill(s) | You do | The arena checks | Min | Pts |
|---|---|---|---|---|---|---|
| 1 | Ten words | Constraints | Ask anything. Get the answer in exactly ten words. | Reply is exactly ten words | 3 | 15 |
| 2 | Make it ask first | Make it ask first | Ask for help planning something and tell it to interview you before answering. | Three or more questions before any plan; the plan uses your answers | 5 | 25 |
| 3 | Grade yourself | Iteration, Verify | Get a draft, have it score the draft against three criteria, then rewrite. | Rubric, score, and a rewrite that changed | 6 | 30 |
| 4 | Two audiences | Audience switching | One topic explained for a ten-year-old and for an expert. | Both versions, clearly different register | 5 | 25 |
| 5 | The other side | Steelman | State a view you hold. Get the strongest case against it, then its weakest point. | Real counter-argument, then self-critique | 5 | 30 |
| 6 | Rehearsal | Roleplay | Have it play a tough counterpart for three rounds, then break character and coach you. | Stays in character three turns, then feedback | 6 | 30 |
| 7 | Twenty then three | Brainstorming, Constraints | Twenty ideas, then narrow to three by a criterion you name. | Twenty numbered, criterion applied, three picked | 5 | 25 |
| 8 | Side by side | Comparisons | Compare three options across four criteria you choose, as a table, with a pick. | Three by four table and a recommendation | 5 | 25 |
| 9 | Tutor mode | Tutor mode | Learn something by being quizzed one question at a time, no lecture. | One question per turn, waits, adapts | 6 | 30 |
| 10 | Deslop | Constraints, Style training | The brief includes an AI-sounding paragraph. Make it sound human in one instruction. | Slop markers gone, meaning kept | 4 | 25 |
| 11 | Sound like you | Style training | Paste two samples of your writing. Get a new paragraph in your voice on a new topic. | Two samples given; output mirrors them | 6 | 30 |
| 12 | Reply to this | Drafting | The brief includes a favour request. Draft a reply that says no and offers an alternative, under 80 words. | Declines, alternative, under 80 words | 4 | 25 |
| 13 | There and back | Translation, Verify | Translate a paragraph into another language and back, then ask what changed. | Both directions and a diff | 4 | 20 |
| 14 | One page | Summarizing, File upload | Attach any long document. Five bullets and a one-line so-what. | File attached; five bullets; one line | 5 | 30 |
| 15 | Pull the table | Data extraction, File upload | Attach the sample of messy line items. Get a clean table with four named columns and a total. | Table; total matches the key | 6 | 35 |
| 16 | Read the PDF | PDF reading | Attach the sample PDF. Answer three questions from it. | PDF attached; three correct | 6 | 35 |
| 17 | Show, don't tell | Camera input | Attach any photo. Three bullets and one caption with no exclamation marks. | Image attached; specific description; caption | 4 | 20 |
| 18 | Picture to text | Image to text, Screenshot | Attach a photo or screenshot of text. Get it out verbatim, then one line on what it says. | Image attached; transcription; summary | 4 | 25 |
| 19 | Picture math | Screenshot, Data extraction | Screenshot the sample table image. Ask for one column's total. | Total matches the key | 5 | 30 |
| 20 | Fresh news | Live search | Two news items from the last seven days on a topic you pick, with dates and links. | Search on; two dated, linked items | 5 | 30 |
| 21 | Check it | Verify, Live search | Ask a factual question with search off, then turn search on and make it check its own answer. | Off turn then on turn; corrections listed | 6 | 35 |
| 22 | Deep dive | Deep research | Research mode on a question you pick. Headed report, four or more sources. | Research on; sections; four sources | 10 | 45 |
| 23 | Read the link | Link reading, Summarizing | Paste a URL. Three bullets and one quoted line. Small build. | URL fetched; bullets; quote | 4 | 25 |
| 24 | Pick the right brain | Model choice | A multi-step puzzle from the brief. Switch to Smart and High before asking. | Smart and High selected; answer correct | 6 | 35 |
| 25 | Connect and ask | Connectors, Data extraction | Connect the data warehouse. Get last month's total revenue and where it came from. | Connector used; number matches the key | 6 | 40 |
| 26 | Inbox to reply | Connectors, Drafting | Find the newest email in your inbox and draft a reply under 100 words that answers its question. | Gmail used; right email; answers it | 7 | 40 |
| 27 | Skill up | Skills | Use the meeting-notes skill on the transcript in your Drive. | Skill invoked; Drive used | 6 | 35 |
| 28 | Make a skill | Skills | Create a skill for a task you repeat, then run it. | Skill created and invoked | 7 | 40 |
| 29 | Set up shop | Projects, Custom instructions | Put your format rules in a project's instructions. Ask inside it without restating them. | Project created; chat inside; format followed | 6 | 35 |
| 30 | Call me | Personalization | Set how you want to be addressed in Customize. Start a new chat and prove it stuck. Small build. | Instruction set; new chat honours it | 4 | 25 |

Total: 895 points. Proposed tiers: Tourist 1, Newcomer 150, Resident 350, Citizen 600, AI-Native 800.

## Decisions for Brian

1. Build the three small features (link reading, custom instructions, memory) as part of this pass, or ship the 27 that need nothing?
2. Show the 16 later skills as locked "coming" chips on the badge wall, or hide them until the arena can grade them?
3. Confirm adding Model choice and Skills to the skill list.
4. Tier thresholds above, or keep the current 150 / 400 / 750 / 1200.
