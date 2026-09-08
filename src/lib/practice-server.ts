import "server-only";
import { adminClient } from "./supabase/admin";
import { summarizePractice, type PracticeSummary } from "./practice";

export async function readPractice(member: { id: string; practice_timezone: string | null }): Promise<PracticeSummary | null> {
  try {
    return await loadPractice(member);
  } catch {
    // A history read failure must not turn a successfully saved grade into an
    // apparent submission failure. The client offers a separate history retry.
    return null;
  }
}

async function loadPractice(member: { id: string; practice_timezone: string | null }): Promise<PracticeSummary | null> {
  const dates: string[] = [];
  // Paginate so a long history never silently loses its best streak.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await adminClient().from("practice_days").select("local_date")
      .eq("member_id", member.id).order("local_date").range(offset, offset + 999);
    if (error || !data) return null;
    dates.push(...data.map((r) => r.local_date as string));
    if (data.length < 1000) break;
  }
  return summarizePractice(dates, member.practice_timezone ?? "UTC");
}
