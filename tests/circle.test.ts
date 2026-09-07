import { test } from "node:test";
import assert from "node:assert/strict";
import { CircleAPI } from "../src/lib/circle/api";
const config = { token: "test-token", communityId: 12 };
const member = (id: number, email = `person${id}@example.com`) => ({ id, email, community_id: 12, active: true, name: "Test Member", avatar_url: null });
const page = (number: number, records: unknown[], count: number, next: boolean) => ({ page: number, per_page: 100, count, has_next_page: next, records });
function api(responses: unknown[], statuses: number[] = []) {
  const calls: { url: URL; headers: Headers }[] = [];
  const request: typeof fetch = async (input, init) => {
    calls.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(responses.shift()), { status: statuses.shift() ?? 200 });
  };
  return { client: new CircleAPI(config, request), calls };
}

test("Circle import follows every page, normalizes emails and requests all members", async () => {
  const { client, calls } = api([{ id: 12, name: "How to AI" }, page(1, [member(1, " TEST@example.com ")], 2, true), page(2, [{ ...member(2), active: false }], 2, false)]);
  const people = await client.allMembers();
  assert.equal(people.length, 2); assert.equal(people[0].email, "test@example.com"); assert.equal(people[1].active, false);
  assert.equal(calls[1].url.searchParams.get("status"), "all"); assert.equal(calls[2].url.searchParams.get("page"), "2");
  assert.equal(calls[0].headers.get("authorization"), "Token test-token");
  assert.ok(calls.every((c) => c.url.origin === "https://app.circle.so"));
});
test("partial, duplicate or changing Circle snapshots are rejected before import", async () => {
  for (const pages of [
    [page(1, [member(1)], 2, false)],
    [page(1, [member(1)], 2, true), page(2, [member(1)], 2, false)],
    [page(1, [member(1)], 2, true), page(2, [member(2)], 3, false)],
    [page(1, [], 2, true)],
    [{ page: 1, records: [] }],
  ]) await assert.rejects(api([{ id: 12, name: "How to AI" }, ...pages]).client.allMembers());
});
test("a different community token or member cannot grant access", async () => {
  await assert.rejects(api([{ id: 99, name: "Other" }]).client.allMembers(), /different community/);
  await assert.rejects(api([{ ...member(1), community_id: 99 }]).client.findByEmail("person1@example.com"), /different community/);
  await assert.rejects(api([member(2)]).client.findByEmail("person1@example.com"), /different email/);
});
test("Circle search distinguishes absent membership from API failure", async () => {
  assert.equal(await api([{ error: "missing" }], [404]).client.findByEmail("test@example.com"), null);
  for (const status of [401,403,429,500]) await assert.rejects(api([{ token: "must not leak", email: "private@example.com" }], [status]).client.findByEmail("test@example.com"), new RegExp(`HTTP ${status}$`));
  await assert.rejects(api([{ active: true }]).client.findByEmail("test@example.com"), /invalid member/);
});
test("Circle email lookups are exact and case-normalized", async () => {
  const { client, calls } = api([member(1, "Member@Example.com")]);
  assert.equal((await client.findByEmail(" Member@Example.com "))?.email, "member@example.com");
  assert.equal(calls[0].url.searchParams.get("email"), "member@example.com");
});
