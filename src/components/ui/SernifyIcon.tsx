'use client';

interface SernifyIconProps {
  className?: string;
  size?: number;
}

export function SernifyIcon({ className, size = 24 }: SernifyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Diamond shape */}
      <path
        d="M12 3L3 8L12 13L21 8L12 3Z"
        className="fill-blue-500"
        strokeWidth="0.5"
      />
      {/* Left wing */}
      <path
        d="M3 8L2 12L3 16L7 13L3 8Z"
        className="fill-blue-400"
        strokeWidth="0.5"
      />
      {/* Right wing */}
      <path
        d="M21 8L22 12L21 16L17 13L21 8Z"
        className="fill-blue-400"
        strokeWidth="0.5"
      />
      {/* Top facet */}
      <path
        d="M12 3L3 8L12 13L21 8L12 3Z"
        className="fill-blue-600"
        strokeWidth="0.5"
      />
      {/* Bottom point */}
      <path
        d="M12 13L7 18.5L12 22L17 18.5L12 13Z"
        className="fill-blue-500"
        strokeWidth="0.5"
      />
    </svg>
  );
}
