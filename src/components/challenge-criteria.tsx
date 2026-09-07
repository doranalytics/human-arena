import type { ChallengeDef } from "@/lib/arena/types";
import { criteriaFor } from "@/lib/arena/contract";

export function ChallengeCriteria({ challenge }: { challenge: ChallengeDef }) {
  return <details className="mt-3 text-[13px] text-ink-2">
    <summary className="w-fit cursor-pointer rounded py-1 font-medium focus-visible:outline-2">How it’s checked</summary>
    <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">{criteriaFor(challenge).map((k) => <li key={`${k.kind}:${k.id}`}>{k.label}</li>)}</ul>
  </details>;
}
