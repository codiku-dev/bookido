"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/css-utils";

export function SimpleCodeCard(p: {
  title?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-zinc-900/80 overflow-hidden flex flex-col min-h-0",
        p.className,
      )}
    >
      {(p.title != null || p.badge != null) && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            {p.title != null && (
              <span
                className="text-[10px] sm:text-xs text-zinc-400 truncate"
                title={p.title}
              >
                {p.title}
              </span>
            )}
          </div>
          {p.badge}
        </div>
      )}
      <div
        className={cn(
          "p-3 sm:p-4 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed",
          p.bodyClassName,
        )}
      >
        <pre className="whitespace-pre-wrap break-words">
          <code>{p.children}</code>
        </pre>
      </div>
    </div>
  );
}
