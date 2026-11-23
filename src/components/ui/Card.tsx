import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  children: ReactNode;
  interactive?: boolean;
}

export function Card({
  as: Element = 'div',
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const classes = ['card', interactive ? 'is-link' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Element className={classes} {...props}>
      {children}
    </Element>
  );
}
