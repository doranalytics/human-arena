import { CircleAPI } from "../src/lib/circle/api";
import { syncCircleMembers } from "../src/lib/circle/service";
async function main() {
  if (process.argv.includes("--inspect")) {
    if (!process.env.CIRCLE_API_TOKEN) throw new Error("Set CIRCLE_API_TOKEN first");
    console.log(await new CircleAPI({ token: process.env.CIRCLE_API_TOKEN, communityId: 0 }).community());
  } else console.log(await syncCircleMembers());
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "Circle import failed"); process.exitCode = 1; });
