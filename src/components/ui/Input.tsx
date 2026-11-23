import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, leadingIcon, className = '', id, ...props },
  ref,
) {
  const generatedId = useId().replace(/:/g, '');
  const inputId = id ?? `bandup-input-${generatedId}`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="input-field">
      {label ? (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="input-control-wrap">
        {leadingIcon ? <span className="input-leading-icon">{leadingIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={['inp', leadingIcon ? 'inp-with-icon' : '', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperText || error ? helperId : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p id={helperId} className="input-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="input-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
