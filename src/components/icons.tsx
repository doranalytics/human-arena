/** Claude's asterisk mark, drawn to match the greeting. */
export function Spark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path
        d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49M21 9.5l22 45M43 9.5l-22 45M9.5 21l45 22M9.5 43l45-22"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
