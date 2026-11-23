import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate' | 'sky';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'slate', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={['bdg', `bdg-${variant}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  );
}
