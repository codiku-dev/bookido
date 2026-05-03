"use client";

import DOMPurify from "isomorphic-dompurify";
import { cn } from "@repo/ui/utils/cn";

const SANITIZE: Parameters<typeof DOMPurify.sanitize>[1] = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "s", "ul", "ol", "li", "h2", "h3", "blockquote", "code", "pre"],
  ALLOWED_ATTR: ["class"],
};

export function SafeHtml(p: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(p.html, SANITIZE);
  if (clean.trim().length === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        "max-w-none break-words text-slate-700 leading-relaxed",
        "[&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_li>p]:mb-0 [&_li>p:last-child]:mb-0 [&_li>p+_p]:mt-2",
        "[&_li_p]:whitespace-pre-line",
        "[&_p:empty]:min-h-[1.25em]",
        "[&_p:has(>br:only-child)]:min-h-[1.25em]",
        "[&_ul]:my-2 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-0.5",
        "[&_strong]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:italic",
        p.className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
