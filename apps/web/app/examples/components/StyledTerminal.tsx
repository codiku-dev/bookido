'use client';

import type { ReactNode } from 'react';
import { cn } from '@repo/ui/utils/cn';

type StyledTerminalProps = {
  title?: string;
  titleTitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md';
  fill?: boolean;
  contentPadding?: 'default' | 'compact';
  variant?: 'code' | 'custom';
  className?: string;
  contentClassName?: string;
  /** e.g. "whitespace-pre" for terminal output */
  preClassName?: string;
};

const sizeClasses = {
  sm: 'text-[11px] sm:text-xs font-mono leading-relaxed text-gray-300',
  md: 'text-xs sm:text-sm font-mono leading-relaxed text-gray-300',
};

export function StyledTerminal(p: StyledTerminalProps) {
  const {
    title,
    titleTitle,
    badge,
    children,
    size = 'md',
    fill = false,
    contentPadding = 'default',
    variant = 'code',
    className,
    contentClassName,
    preClassName,
  } = p;

  return (
    <div
      className={cn(
        'bg-gray-900 rounded-lg overflow-hidden border border-gray-800',
        fill && 'flex-1 flex flex-col min-h-0',
        className,
      )}
    >
      <div className="bg-gray-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 min-w-0 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {title != null && (
            <span
              className="text-[10px] sm:text-xs text-gray-400 truncate"
              title={titleTitle ?? title}
            >
              {title}
            </span>
          )}
        </div>
        {badge}
      </div>
      <div
        className={cn(
          'overflow-x-auto min-h-0',
          contentPadding === 'default' ? 'p-6' : 'p-4',
          fill && 'flex-1',
          contentClassName,
        )}
      >
        {variant === 'code' ? (
          <pre className={cn(sizeClasses[size], preClassName)}>
            <code>{children}</code>
          </pre>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
