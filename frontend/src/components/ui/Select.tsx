import React, { forwardRef } from 'react'
import clsx from 'clsx'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helperText?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="font-bangers tracking-comic text-base text-ink uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'w-full px-4 py-2.5 bg-sand text-ink font-grotesk text-base border-3 border-ink shadow-hard-sm transition-all focus:outline-none focus:ring-2 focus:ring-deep-sky appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-soft-coral ring-soft-coral',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-ink font-bold">
            ▼
          </div>
        </div>
        {error && <span className="text-xs font-bold text-soft-coral font-grotesk">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-muted font-grotesk">{helperText}</span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
