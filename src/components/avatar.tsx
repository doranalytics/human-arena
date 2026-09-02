/** Round profile photo, or initials on the dark disc the sidebar already uses. */
export function Avatar({ name, src, size = 28, className = "" }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} width={size} height={size} className={`shrink-0 rounded-full border border-line object-cover ${className}`} style={{ width: size, height: size }} />
    );
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#2c2b28] font-semibold text-bg ${className}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {initials || "?"}
    </span>
  );
}
