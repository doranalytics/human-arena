import "server-only";
import { cookies } from "next/headers";
import { guestId, GUEST_COOKIE } from "@/lib/guest-cookie";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
/** Call only after Supabase verified the email and claimed its member. */
export async function mergeLearningGuest() {
  const jar = await cookies();
  const id = guestId(
    jar.get(GUEST_COOKIE)?.value,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  if (!id) return;
  const member = await getMember();
  if (!member || member.isGuest) return;
  const { error } = await adminClient().rpc("merge_learning_guest", {
    p_guest: id,
    p_member: member.id,
  });
  if (error)
    throw new Error(
      "Could not transfer your guest progress. Retry verification.",
    );
  jar.delete(GUEST_COOKIE);
}
