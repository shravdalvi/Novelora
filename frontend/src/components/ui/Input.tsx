import React, { forwardRef } from 'react'
import clsx from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-bangers tracking-comic text-base text-ink uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2.5 bg-sand text-ink font-grotesk text-base border-3 border-ink shadow-hard-sm transition-all focus:outline-none focus:ring-2 focus:ring-sage placeholder:text-ink/40 disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-bordeaux ring-bordeaux',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-bold text-bordeaux font-grotesk">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-ink/60 font-grotesk">{helperText}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
