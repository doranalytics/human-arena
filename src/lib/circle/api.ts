import { z } from "zod";

const API = "https://app.circle.so/api/admin/v2";
const MemberSchema = z.object({
  id: z.number().int().positive(), community_id: z.number().int().positive(),
  email: z.string().trim().toLowerCase().email(), name: z.string().nullish(),
  avatar_url: z.string().nullish(), active: z.boolean(),
});
const PageSchema = z.object({
  page: z.number().int().positive(), per_page: z.number().int().positive(),
  count: z.number().int().nonnegative(), has_next_page: z.boolean(), records: z.array(MemberSchema),
});
export type CircleMember = z.infer<typeof MemberSchema>;
export type CircleConfig = { token: string; communityId: number };

/** Server-side Admin API only. Never include the token or member payload in errors. */
export class CircleAPI {
  constructor(private config: CircleConfig, private request: typeof fetch = fetch) {}
  private async get(path: string, query: Record<string, string> = {}, missingOK = false) {
    const url = new URL(API + path);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
    const r = await this.request(url, { headers: { Authorization: `Token ${this.config.token}`, Accept: "application/json" }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (r.status === 404 && missingOK) return null;
    if (!r.ok) throw new Error(`Circle API returned HTTP ${r.status}`);
    return r.json();
  }
  async community() {
    const c = z.object({ id: z.number().int().positive(), name: z.string(), slug: z.string().optional() }).safeParse(await this.get("/community"));
    if (!c.success) throw new Error("Circle returned invalid community details");
    if (this.config.communityId && c.data.id !== this.config.communityId) throw new Error("Circle token belongs to a different community");
    return c.data;
  }
  private member(raw: unknown) {
    const parsed = MemberSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Circle returned an invalid member record");
    if (parsed.data.community_id !== this.config.communityId) throw new Error("Circle returned a member from a different community");
    return parsed.data;
  }
  async findByEmail(email: string): Promise<CircleMember | null> {
    const normalized = email.trim().toLowerCase();
    const raw = await this.get("/community_members/search", { email: normalized }, true);
    if (raw === null) return null;
    const member = this.member(raw);
    if (member.email !== normalized) throw new Error("Circle returned a different email");
    return member;
  }
  /** Fetch every page before changing access. An incomplete snapshot never revokes anyone. */
  async allMembers(): Promise<CircleMember[]> {
    await this.community();
    const members: CircleMember[] = [], ids = new Set<number>(), emails = new Set<string>();
    let expected: number | undefined;
    for (let page = 1; page <= 500; page++) {
      // all includes invited members; active is the record's access flag, not recent activity.
      const parsed = PageSchema.safeParse(await this.get("/community_members", { page: String(page), per_page: "100", status: "all" }));
      if (!parsed.success) throw new Error("Circle returned an invalid member page");
      const data = parsed.data;
      if (data.page !== page || (expected !== undefined && expected !== data.count)) throw new Error("Circle membership changed during pagination; retry the sync");
      expected = data.count;
      if (expected > 25000) throw new Error("Circle community exceeds this sync's 25,000-member limit");
      for (const raw of data.records) {
        const member = this.member(raw);
        if (ids.has(member.id) || emails.has(member.email)) throw new Error("Circle returned duplicate members; retry the sync");
        ids.add(member.id); emails.add(member.email); members.push(member);
      }
      if (!data.has_next_page) {
        if (members.length !== expected) throw new Error("Circle member snapshot is incomplete");
        return members;
      }
      if (!data.records.length || members.length >= expected) throw new Error("Circle returned inconsistent pagination");
    }
    throw new Error("Circle pagination exceeded the sync limit");
  }
}
