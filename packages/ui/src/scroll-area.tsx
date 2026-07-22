import * as React from 'react';

import { cn } from './cn';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
  children?: React.ReactNode;
}

export function ScrollArea({
  orientation = 'vertical',
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      className={cn(
        'scrollbar-thin overflow-auto',
        orientation === 'vertical' && 'overflow-x-hidden',
        orientation === 'horizontal' && 'overflow-y-hidden',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
