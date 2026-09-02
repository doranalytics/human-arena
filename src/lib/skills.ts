/**
 * Skills, v0: a named prompt appended to the conversation when invoked with /name.
 * Enough to teach what a skill is. Executable skills come later.
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  builtin?: boolean;
}

export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "summarize",
    name: "summarize",
    description: "Tight summary of anything pasted or attached",
    builtin: true,
    prompt: `Summarize the material the user provides. Output: one sentence headline, then 3 to 6 bullets of the most decision-relevant facts, then a "Watch out" line if anything is risky or unclear. No preamble.`,
  },
  {
    id: "meeting-notes",
    name: "meeting-notes",
    description: "Turn a transcript into decisions, actions and open questions",
    builtin: true,
    prompt: `Turn the meeting transcript or notes the user provides into structured notes with exactly these sections: "Decisions" (bullets), "Action items" (bullets in the form "Owner: task, by date"), "Open questions" (bullets). Keep every name and date from the source; never invent owners or dates.`,
  },
  {
    id: "email-reply",
    name: "email-reply",
    description: "Draft a reply in the user's voice",
    builtin: true,
    prompt: `Draft a reply to the email the user shows you. Match the sender's formality, keep it under 120 words, lead with the answer, and end with one clear next step. Sign off with the user's first name only. Output only the email body.`,
  },
  {
    id: "brief",
    name: "brief",
    description: "One-page brief for a decision maker",
    builtin: true,
    prompt: `Write a one-page brief for a senior decision maker on the topic the user gives you. Sections: Situation, Options (2 to 3, each with cost and risk), Recommendation, What we need from you. Plain language, no jargon, under 300 words.`,
  },
  {
    id: "explain",
    name: "explain",
    description: "Explain it like I'm smart but new",
    builtin: true,
    prompt: `Explain the topic to someone intelligent who is new to the field. Start with a one-line definition, give one concrete example, then the two things people most often get wrong. Under 200 words.`,
  },
];
