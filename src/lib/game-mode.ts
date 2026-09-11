export type GameMode = "playground" | "arena";

export const MODE_COPY = {
  playground: { title: "Playground", description: "Explore AI prompting and features at your own pace." },
  arena: { title: "Arena", description: "Take on timed AI challenges, earn points, and climb the leaderboard." },
} as const;

/** Explicitly curated competition catalogue. Legacy definitions remain for saved work. */
export const ARENA_SLUGS = [
  "pull-the-table", "picture-math", "skill-up", "hand-it-off", "chain-it", "cowork-to-skill",
] as const;
export function isArenaChallenge(slug: string): boolean {
  return (ARENA_SLUGS as readonly string[]).includes(slug);
}
