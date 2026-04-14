import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 font-medium text-white-200 shrink-0 whitespace-nowrap cursor-default select-none',
  {
    variants: {
      size: {
        default: 'px-3 py-1',
        sm: 'px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge(p: BadgeProps) {
  const { className, size, ...props } = p;
  return <span className={cn(badgeVariants({ size, className }))} {...props} />;
}

export { Badge, badgeVariants };
