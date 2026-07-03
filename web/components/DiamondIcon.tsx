interface DiamondIconProps {
  className?: string;
  size?: number;
}

export function DiamondIcon({ className = "", size = 24 }: DiamondIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Top facets */}
      <polygon points="20,4 32,14 20,14" fill="#FDE68A" />
      <polygon points="20,4 8,14 20,14" fill="#FCD34D" />
      {/* Left girdle */}
      <polygon points="4,17 8,14 20,14" fill="#F59E0B" />
      {/* Right girdle */}
      <polygon points="36,17 32,14 20,14" fill="#D97706" />
      {/* Center top */}
      <polygon points="8,14 20,14 32,14 36,17 20,17 4,17" fill="#FBBF24" />
      {/* Bottom pavilion */}
      <polygon points="4,17 20,17 20,36" fill="#F59E0B" />
      <polygon points="36,17 20,17 20,36" fill="#D97706" />
      {/* Inner pavilion split */}
      <polygon points="4,17 20,17 12,26" fill="#FCD34D" opacity="0.6" />
      <polygon points="36,17 20,17 28,26" fill="#B45309" opacity="0.5" />
      {/* Outline */}
      <polyline
        points="4,17 20,4 36,17 20,36 4,17"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="4" y1="17" x2="36" y2="17" stroke="#92400E" strokeWidth="0.8" opacity="0.5" />
      <line x1="8" y1="14" x2="32" y2="14" stroke="#92400E" strokeWidth="0.8" opacity="0.4" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#92400E" strokeWidth="0.6" opacity="0.3" />
    </svg>
  );
}
