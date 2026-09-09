"use client";
import { useState } from "react";
import {
  Check,
  Flame,
  Trophy,
  ArrowRight,
  Mail,
  Users,
  ExternalLink,
} from "lucide-react";
import type { Lesson } from "@/lib/learning/catalog";
import { setLearning } from "@/lib/learning/client";
import { refreshSession, useSession } from "@/lib/session";
import { EmailSignIn } from "../email-signin";
import { SUBSCRIBE_URL } from "@/lib/subscription";
export function LessonFinish({ lesson }: { lesson: Lesson }) {
  const session = useSession();
  const [step, setStep] = useState(0),
    [name, setName] = useState(
      session.me?.guest ? "" : (session.me?.name ?? ""),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState(""),
    [social, setSocial] = useState(session.me?.linkedin ?? session.me?.x ?? ""),
    [consent, setConsent] = useState(false);
  async function saveName() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error("Could not save your name.");
      await refreshSession();
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/membership-review", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setReview(j.status);
      await refreshSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check membership.");
    } finally {
      setBusy(false);
    }
  }
  async function saveSocial() {
    setBusy(true);
    setError("");
    try {
      const value = social.trim();
      if (
        value &&
        !/^https:\/\/(www\.)?(linkedin\.com\/in\/|x\.com\/|twitter\.com\/)/i.test(
          value,
        )
      )
        throw new Error("Use a full LinkedIn profile or X profile URL.");
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(value ? value.includes("linkedin.com") ? { linkedin: value } : { x: value } : {}),
          promotionOptIn: consent,
        }),
      });
      if (!r.ok) throw new Error("Could not save your profile.");
      setLearning({ active: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  const titles = [
    "You put the pieces together.",
    "Your first useful win is in.",
    "Keep what you’ve learned.",
    "Keep learning. Get more with the community.",
    "Choose how to be recognized.",
  ];
  return (
    <div className="h-full overflow-y-auto">
      <section className="relative mx-auto max-w-xl px-5 py-8 md:py-14">
        {step === 0 && (
          <div className="celebration" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
        )}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-clay/10 text-clay">
          {step === 0 ? (
            <Check size={34} />
          ) : step === 1 ? (
            <Flame size={34} />
          ) : step === 2 ? (
            <Mail size={30} />
          ) : (
            <Trophy size={30} />
          )}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {titles[step]}
        </h1>
        {step === 0 && (
          <>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              {lesson.outcome}
            </p>
            <div className="my-6 flex flex-wrap gap-2">
              {lesson.techniques.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line px-3 py-1.5 text-sm"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-4xl tabular-nums">
                +{lesson.points}
              </strong>
              <span className="text-ink-2">
                points · 10 exercises completed
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-2">
              Awarded once. Your score is already saved.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <p className="mt-5 text-lg text-ink-2">
              A completed lesson earns a practice day. Come back tomorrow for
              another useful move, or keep going now.
            </p>
            <div className="my-6 rounded-2xl border border-line p-5">
              <strong className="text-3xl">
                {session.practice?.current ?? 1}
              </strong>
              <span className="ml-2 text-ink-2">day streak</span>
              <p className="mt-2 text-sm text-ink-2">
                Streaks measure practice. Points and capabilities measure your
                achievements.
              </p>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p className="mt-4 text-ink-2">
              Create an account to keep your progress across devices. Already a
              member? Use your subscription email.
            </p>
            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="learner-name"
            >
              Your name
            </label>
            <input
              id="learner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-line-2 bg-bg p-3 text-base"
            />
            {session.me?.guest ? (
              <div className="mt-5">
                <EmailSignIn signup />
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 text-sm text-ok">
                <Check size={18} />
                Email verified: {session.me?.email}
              </p>
            )}
            <button
              onClick={() => void saveName()}
              disabled={busy || !name.trim()}
              className="learn-primary mt-5"
            >
              {busy
                ? "Saving…"
                : session.me?.guest
                  ? "Save name and continue testing"
                  : "Save and continue"}
              <ArrowRight size={17} />
            </button>
            {session.me?.guest && (
              <p className="mt-3 text-xs text-ink-2">
                You can keep testing without email signup. Your guest progress
                stays in this browser.
              </p>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <p className="mt-4 text-ink-2">
              Everyone can learn and earn points. Verified community members are
              eligible for the weekly winner spotlight.
            </p>
            <div className="my-6 space-y-4">
              {[
                [Mail, "Ruben’s subscriber emails"],
                [Users, "Community resources and subscriber benefits"],
                [Trophy, "Eligibility for the weekly promotional reward"],
              ].map(([I, t]) => {
                const Icon = I as typeof Mail;
                return (
                  <div key={String(t)} className="flex items-center gap-3">
                    <Icon size={20} className="shrink-0 text-clay" />
                    {String(t)}
                  </div>
                );
              })}
            </div>
            {session.subscription?.paid ? (
              <div className="rounded-xl border border-ok/30 bg-ok/5 p-4 text-ok">
                Membership verified. You’re eligible for the community reward.
              </div>
            ) : (
              <>
                <a
                  href={SUBSCRIBE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="learn-primary"
                >
                  Join through Substack
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() =>
                    session.me?.guest ? setStep(2) : void verify()
                  }
                  disabled={busy}
                  className="mt-3 min-h-12 w-full rounded-xl border border-line-2 px-4"
                >
                  {busy ? "Checking…" : "Already a subscriber? Verify access"}
                </button>
              </>
            )}
            {review && (
              <p role="status" className="mt-4 rounded-xl bg-bg-2 p-4 text-sm">
                {review === "verified"
                  ? "Membership verified."
                  : review === "pending"
                    ? "Your membership review request is saved and pending. You can continue learning."
                    : "We couldn’t confirm membership for this account email. Use the email associated with your subscription."}
              </p>
            )}
            <p className="mt-4 text-xs text-ink-2">
              Purchases happen on Substack. Joining does not instantly verify
              access here. Weekly winners are ranked by points, not streak
              length.
            </p>
            <button
              onClick={() => setStep(4)}
              className="mt-5 min-h-12 w-full rounded-xl border border-line px-4"
            >
              {session.subscription?.paid ? "Continue" : "Continue free"}
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <p className="mt-4 text-ink-2">
              Optionally add the profile you’d want featured if you win.
              Promotion requires verified membership and your permission.
            </p>
            <label
              htmlFor="social-profile"
              className="mt-6 block text-sm font-medium"
            >
              LinkedIn or X profile URL
            </label>
            <input
              id="social-profile"
              type="url"
              value={social}
              onChange={(e) => setSocial(e.target.value)}
              placeholder="https://www.linkedin.com/in/you"
              className="mt-2 w-full rounded-xl border border-line-2 bg-bg p-3 text-base"
            />
            <label className="mt-5 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              I’d like my profile promoted if I’m an eligible winner.
            </label>
            <button
              onClick={() => void saveSocial()}
              disabled={busy || (consent && !social.trim())}
              className="learn-primary mt-6"
            >
              {busy ? "Saving…" : "See my learning path"}
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => setLearning({ active: null })}
              className="mt-3 min-h-11 w-full text-sm text-ink-2"
            >
              Skip for now
            </button>
          </>
        )}
        {step < 2 && (
          <button
            onClick={() => setStep(step + 1)}
            className="learn-primary mt-7"
          >
            Continue
            <ArrowRight size={17} />
          </button>
        )}
        {error && (
          <p role="alert" className="mt-4 text-bad">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
