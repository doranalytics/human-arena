import type { Email } from "./gmail";

/** Understand the small set of Gmail qualifiers the model naturally uses. */
export function matchesGmailQuery(email: Email, query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const wantsUnread = tokens.some((token) => token === "is:unread" || token === "label:unread");
  const wantsRead = tokens.some((token) => token === "is:read" || token === "label:read");
  if (wantsUnread && !email.unread) return false;
  if (wantsRead && email.unread) return false;

  const words = tokens.filter((token) => !/^(is|label):(un)?read$/.test(token));
  if (!words.length) return true;
  const searchable = `${email.fromName} ${email.from} ${email.subject} ${email.body}`.toLowerCase();
  return words.some((word) => searchable.includes(word));
}
