/**
 * Original, hand-authored flat illustrations — no external assets, no
 * stock photography, no third-party IP. Everything renders as inline SVG
 * using currentColor + theme CSS variables, so:
 *   1. There is zero copyright risk (they are original vector shapes).
 *   2. They cost ~1–2kb each, which matters for the <500kb / 2G budget.
 *   3. They automatically re-tint for light/dark mode with no extra work.
 */

export function SupportIllustration({ className = "w-full h-auto" }) {
  return (
    <svg viewBox="0 0 240 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="80" r="72" className="fill-brand-2/10" />
      <circle cx="72" cy="70" r="22" className="fill-dusk/70" />
      <path d="M40 132c2-26 18-40 32-40s30 14 32 40" className="fill-dusk/70" />
      <circle cx="168" cy="70" r="22" className="fill-brand-2/70" />
      <path d="M136 132c2-26 18-40 32-40s30 14 32 40" className="fill-brand-2/70" />
      <path
        d="M120 58c8-10 24-10 28 2 4 11-8 20-28 34-20-14-32-23-28-34 4-12 20-12 28-2z"
        className="fill-risk-red"
      />
    </svg>
  );
}

export function ShieldCheckIllustration({ className = "w-full h-auto" }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M80 12l56 20v40c0 38-24 66-56 76-32-10-56-38-56-76V32z"
        className="fill-brand-2/15"
        stroke="currentColor"
        strokeOpacity="0.15"
      />
      <path
        d="M56 82l16 16 32-34"
        stroke="currentColor"
        className="text-risk-green"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatGreetingIllustration({ className = "w-full h-auto" }) {
  return (
    <svg viewBox="0 0 220 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="18" y="20" width="130" height="70" rx="20" className="fill-dusk/15" />
      <circle cx="46" cy="55" r="6" className="fill-dusk" />
      <circle cx="70" cy="55" r="6" className="fill-dusk" />
      <circle cx="94" cy="55" r="6" className="fill-dusk" />
      <rect x="70" y="66" width="132" height="54" rx="18" className="fill-brand-2/20" />
      <path d="M100 90h72M100 102h48" stroke="currentColor" className="text-brand-2" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function QuizAwardIllustration({ className = "w-full h-auto" }) {
  return (
    <svg viewBox="0 0 160 170" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M52 96l-18 56 26-10 12 24 18-52z" className="fill-brand-2/50" />
      <path d="M108 96l18 56-26-10-12 24-18-52z" className="fill-dusk/50" />
      <circle cx="80" cy="70" r="52" className="fill-risk-yellow-bg text-risk-yellow" stroke="currentColor" strokeWidth="6" />
      <path d="M60 72l14 14 26-30" stroke="currentColor" className="text-risk-yellow" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ResourcesMapIllustration({ className = "w-full h-auto" }) {
  return (
    <svg viewBox="0 0 220 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="16" width="200" height="108" rx="16" className="fill-brand-2/10" />
      <path d="M10 70h200M70 16v108M150 16v108" stroke="currentColor" className="text-brand-2/30" strokeWidth="3" />
      <path
        d="M110 44c-14 0-24 10-24 24 0 18 24 40 24 40s24-22 24-40c0-14-10-24-24-24z"
        className="fill-risk-red"
      />
      <circle cx="110" cy="68" r="9" className="fill-surface" />
    </svg>
  );
}

export function EmptyStateIllustration({ className = "w-full h-auto" }) {
  return (
    <svg viewBox="0 0 180 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="90" cy="110" rx="60" ry="10" className="fill-ink/5" />
      <rect x="50" y="30" width="80" height="60" rx="14" className="fill-dusk/15" />
      <path d="M66 56h48M66 72h30" stroke="currentColor" className="text-dusk/60" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
