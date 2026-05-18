import * as React from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-10 rounded-md border border-neutral-200 bg-neutral-0 px-3 text-sm',
            'text-neutral-900 placeholder:text-neutral-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            'disabled:opacity-50',
            className,
          )}
          {...props}
        />
        {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
