interface Props {
  className?: string;
}

// A 2×2 cell grid — the top-right cell "lives" (teal), the watched cell.
export default function BrandMark({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="9" height="9" rx="2" fill="#141A2A" />
      <rect x="13" y="2" width="9" height="9" rx="2" fill="#0FA3A3" />
      <rect x="2" y="13" width="9" height="9" rx="2" fill="#141A2A" />
      <rect x="13" y="13" width="9" height="9" rx="2" fill="#141A2A" opacity="0.35" />
    </svg>
  );
}
