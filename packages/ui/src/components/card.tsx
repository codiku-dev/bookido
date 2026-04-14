import * as React from 'react';
import { cn } from '../utils/cn';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((p, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow',
      p.className,
    )}
    {...p}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((p, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', p.className)}
    {...p}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((p, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', p.className)}
    {...p}
  />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((p, ref) => <div ref={ref} className={cn('p-6 pt-0', p.className)} {...p} />);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
