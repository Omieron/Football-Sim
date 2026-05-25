export default function BrandMark({ size = 36, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="36" height="36" fill="#111111" />
      <rect x="4" y="4" width="28" height="28" stroke="rgba(237,232,220,0.18)" strokeWidth="1" />
      <line x1="4" y1="18" x2="32" y2="18" stroke="#d4ff00" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="4.5" stroke="rgba(237,232,220,0.22)" strokeWidth="1" />
      <circle cx="18" cy="18" r="2.2" fill="#ff1f5a" />
    </svg>
  )
}
