interface LogoProps {
  /** `default`/`white` render the full wordmark; `mark` is the icon only. */
  variant?: 'default' | 'white' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = {
  default: { primary: '#2f6f4f', secondary: '#6b6560', text: '#1c1a17' },
  white: { primary: '#ffffff', secondary: '#ffffff', text: '#ffffff' },
};

/**
 * CampAwayDesign brand mark — a mountain over a towable trailer — ported from
 * the Figma Make redesign's Logo. The full variant shows the visible wordmark
 * (so the SVG is decorative); the `mark` variant carries the accessible name.
 */
export function Logo({ variant = 'default', size = 'md', className = '' }: LogoProps) {
  const colors = variant === 'white' ? COLORS.white : COLORS.default;

  const mark = (decorative: boolean) => (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'CampAwayDesign'}
      aria-hidden={decorative ? true : undefined}
    >
      {/* Mountain */}
      <path d="M24 10L34 26H14L24 10Z" fill={colors.primary} opacity="0.15" />
      <path
        d="M24 10L34 26H14L24 10Z"
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trailer body */}
      <rect x="16" y="26" width="16" height="9" rx="1.5" fill={colors.primary} />
      {/* Windows */}
      <rect x="19" y="29" width="4" height="3" rx="0.5" fill="white" opacity="0.4" />
      <rect x="25" y="29" width="4" height="3" rx="0.5" fill="white" opacity="0.4" />
      {/* Wheels */}
      <circle cx="20" cy="36" r="2.5" fill={colors.secondary} />
      <circle cx="28" cy="36" r="2.5" fill={colors.secondary} />
      <circle cx="20" cy="36" r="1" fill="white" opacity="0.6" />
      <circle cx="28" cy="36" r="1" fill="white" opacity="0.6" />
    </svg>
  );

  if (variant === 'mark') {
    const markSizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
    return <div className={`${markSizes[size]} ${className}`}>{mark(false)}</div>;
  }

  const sizeClasses = {
    sm: { container: 'h-8', icon: 'w-8 h-8', text: 'text-lg' },
    md: { container: 'h-12', icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { container: 'h-16', icon: 'w-16 h-16', text: 'text-4xl' },
  };
  const { container, icon, text } = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${container} ${className}`}>
      <div className={icon}>{mark(true)}</div>
      <div className={`flex items-baseline gap-1 ${text} leading-none`}>
        <span className="font-bold" style={{ color: colors.text }}>
          CampAway
        </span>
        <span className="font-normal" style={{ color: colors.secondary }}>
          Design
        </span>
      </div>
    </div>
  );
}
