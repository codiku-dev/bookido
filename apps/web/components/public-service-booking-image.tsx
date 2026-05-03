"use client";

import type { ImgHTMLAttributes } from "react";

/**
 * Service images are exported at 16:9 from the crop dialog; keep the same
 * aspect in layout so object-cover does not re-crop the framed shot.
 */
export function PublicServiceBookingImage(
  p: {
    imageUrl: string;
    alt: string;
    className?: string;
    imgClassName?: string;
  } & Pick<ImgHTMLAttributes<HTMLImageElement>, "loading">,
) {
  const wrapClass = p.className?.trim().length
    ? `aspect-video w-full overflow-hidden bg-slate-100 ${p.className}`
    : "aspect-video w-full overflow-hidden bg-slate-100";

  const imgClass = p.imgClassName?.trim().length
    ? `h-full w-full object-cover object-center ${p.imgClassName}`
    : "h-full w-full object-cover object-center";

  const frame = (
    <div className={wrapClass}>
      <img src={p.imageUrl} alt={p.alt} className={imgClass} loading={p.loading} />
    </div>
  );

  return frame;
}
