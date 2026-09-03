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

## The 32 challenges (as built, 2 Sep 2026)

Brian's notes folded in: more than two skills per challenge where natural; briefs may mention the company but carry as few non-AI variables as possible; the learner brings nothing, every challenge ships its own material; tiers unchanged.

| # | Challenge | Skills | Teaches | Min | Pts |
|---|---|---|---|---|---|
| 1 | Ten words | chat, constraints | Constraints: tell it exactly how long, and it obeys | 3 | 25 |
| 2 | Interview me | interviewing | Make it ask first: get the questions before the plan | 5 | 40 |
| 3 | Grade yourself | iteration, verification | Iteration and verification: make it critique and redo its own work | 6 | 45 |
| 4 | Three audiences | audience | Audience switching: change the reader, change the writing | 5 | 40 |
| 5 | The other side | steelman | Steelman: get the strongest case against your view | 5 | 45 |
| 6 | Rehearsal | roleplay, iteration | Roleplay: make it play the other person, then coach you | 6 | 50 |
| 7 | Twenty then three | brainstorming, constraints | Brainstorming with constraints: go wide, then cut by a rule | 5 | 40 |
| 8 | Side by side | comparisons | Comparisons: force a table and a recommendation | 5 | 40 |
| 9 | Tutor mode | tutoring | Tutor mode: one question at a time, adapts to your answers | 6 | 50 |
| 10 | Deslop | constraints, style-training | Constraints and style: strip the AI voice in one instruction | 4 | 40 |
| 11 | Sound like you | style-training, iteration | Style training: show samples, then get new writing in that voice | 6 | 45 |
| 12 | Reply to this | drafting, constraints | Drafting: brief the assistant with the message and the outcome | 4 | 40 |
| 13 | There and back | translation, verification | Translation with verification: round-trip and diff | 4 | 35 |
| 14 | One page | file-upload, summarizing | File upload and summarizing: attach, then ask for the shape you want | 5 | 45 |
| 15 | Pull the table | extraction, file-upload | Data extraction from a file: name the columns you want | 6 | 55 |
| 16 | Read the PDF | pdf, extraction | PDF reading and extraction: attach the PDF, ask precise questions | 6 | 55 |
| 17 | Show, don't tell | camera | Camera input: send a picture and ask about it | 4 | 35 |
| 18 | Picture to text | ocr, screenshot | Image to text: transcribe first, then work with it | 4 | 40 |
| 19 | Picture math | screenshot, extraction | Screenshot input and extraction: pull numbers out of a picture | 5 | 50 |
| 20 | Fresh news | web-search | Live search: turn it on when the question is about now | 5 | 45 |
| 21 | Check it | verification, web-search | Verification with search: make it check its own answer | 6 | 55 |
| 22 | Deep dive | deep-research | Deep research: many searches, then a structured report | 10 | 70 |
| 23 | Read the link | url-reading, summarizing | Link reading: hand over a page and ask about it | 4 | 40 |
| 24 | Pick the right brain | model-choice | Model choice: pick Smart and High effort for hard reasoning | 6 | 55 |
| 25 | Connect and ask | connectors, extraction | Connectors: plug in a data source and ask it directly | 6 | 60 |
| 26 | Inbox to reply | connectors, drafting, summarizing | Connectors and drafting: work an inbox through the assistant | 7 | 60 |
| 27 | Skill up | skills, connectors | Skills: invoke a saved prompt with a slash command | 6 | 55 |
| 28 | Make a skill | skills, custom-instructions | Skills: write your own and run it | 7 | 60 |
| 29 | Set up shop | projects, custom-instructions | Projects: instructions that every chat inside inherits | 6 | 55 |
| 30 | Call me | personalization, custom-instructions | Personalization: custom instructions the assistant always follows | 4 | 40 |
| 31 | Remember this | memory | Memory: tell it to remember, then use it in a fresh chat | 5 | 40 |
| 32 | Say it out loud | dictation | Voice dictation: speak the prompt instead of typing it | 3 | 35 |

Total: 1485 points over about 169 minutes. Tiers stay at 1 / 150 / 400 / 750 / 1200, so AI-Native needs 81 percent of the points. The speed multiplier floors at 0.6, so a very slow full run can land short of AI-Native; revisit before launch.

Built alongside: link reading (read_link tool), custom instructions (Customize, injected into every chat), memory (remember tool, facts listed in Customize), LinkedIn and X on the profile and leaderboard, voice dictation on the browser's Web Speech API (Chrome, Edge, Safari; no key), the 48-skill wall with the 15 not-yet-gradable skills marked "soon". Tool sense is awarded after five feature-challenge passes.
