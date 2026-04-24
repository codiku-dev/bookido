import type { ReactElement } from "react";

/** Inline SVG mark matching `apps/web/components/BookidoLogo` — explicit fills for email clients. */
export function BookidoLogoMark(p: { width?: number; height?: number }): ReactElement {
  const w = p.width ?? 44;
  const h = p.height ?? Math.round((w * 85) / 100);
  const blue = "#2563eb";

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: "block" }}
    >
      <rect x="10" y="5" width="80" height="12" rx="2" fill={blue} />
      <rect x="15" y="17" width="11" height="28" rx="2" fill={blue} />
      <rect x="74" y="17" width="11" height="28" rx="2" fill={blue} />
      <rect x="12" y="22" width="76" height="9" rx="2" fill={blue} />
      <rect x="32" y="45" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="46" y="45" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="60" y="45" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="32" y="58" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="46" y="58" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="60" y="58" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="32" y="71" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="46" y="71" width="9" height="9" rx="1.5" fill={blue} />
      <rect x="60" y="71" width="9" height="9" rx="1.5" fill={blue} />
    </svg>
  );
}
