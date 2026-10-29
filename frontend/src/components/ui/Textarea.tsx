import React, { forwardRef } from 'react'
import clsx from 'clsx'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-bangers tracking-comic text-base text-ink uppercase"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={clsx(
            'w-full px-4 py-2.5 bg-sand text-ink font-grotesk text-base border-3 border-ink shadow-hard-sm transition-all focus:outline-none focus:ring-2 focus:ring-deep-sky placeholder:text-muted/60 disabled:opacity-50 disabled:cursor-not-allowed resize-y',
            error && 'border-soft-coral ring-soft-coral',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-bold text-soft-coral font-grotesk">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-muted font-grotesk">{helperText}</span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
