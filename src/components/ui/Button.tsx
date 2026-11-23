import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'dark' | 'soft' | 'outline' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'b1',
  dark: 'b2',
  soft: 'b3',
  outline: 'b4',
  destructive: 'b5',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'button-size-sm',
  md: 'button-size-md',
  lg: 'button-size-lg',
  icon: 'ico',
};

export function Button({
  variant = 'primary',
  size = 'md',
  busy = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
