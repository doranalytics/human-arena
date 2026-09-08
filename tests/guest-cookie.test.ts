import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { guestCookie, guestId, guestEmail, GUEST_MAX_AGE } from "../src/lib/guest-cookie";

const secret = "a-test-only-signing-key-never-used-in-production";
const now = Date.UTC(2026, 8, 8);

test("a guest cookie restores only its signed member until its expiry", () => {
  const id = randomUUID(), cookie = guestCookie(id, secret, now);
  assert.equal(guestId(cookie, secret, now), id);
  assert.equal(guestId(cookie, secret, now + (GUEST_MAX_AGE - 1) * 1000), id);
  assert.equal(guestId(cookie, secret, now + GUEST_MAX_AGE * 1000), null);
});

test("public IDs, modified expiry, forged signatures and other secrets cannot claim a guest", () => {
  const id = randomUUID(), cookie = guestCookie(id, secret, now);
  const [member, expiry, mac] = cookie.split(".");
  for (const value of [undefined, "", id, `${randomUUID()}.${expiry}.${mac}`, `${member}.${Number(expiry) + 1}.${mac}`, `${member}.${expiry}.${mac}x`, `${cookie}.extra`, "x".repeat(200)]) {
    assert.equal(guestId(value, secret, now), null);
  }
  assert.equal(guestId(cookie, "a-different-secret", now), null);
  assert.equal(guestId(cookie, "", now), null);
});

test("guest identities never use or claim a real email address", () => {
  const id = randomUUID();
  assert.equal(guestEmail(id), `guest-${id}@guests.howto-ai.invalid`);
  assert.throws(() => guestCookie("a-public-name", secret, now));
  assert.throws(() => guestCookie(id, "", now));
});
