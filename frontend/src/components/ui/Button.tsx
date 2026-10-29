import React from 'react'
import clsx from 'clsx'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'white'
  | 'outline'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bangers uppercase tracking-comic transition-all duration-150 select-none cursor-pointer focus:outline-none'

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 border-2',
    md: 'text-base px-5 py-2.5 border-3',
    lg: 'text-xl px-7 py-3.5 border-3',
  }

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
    secondary:
      'border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
    white:
      'border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
    danger:
      'border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
    ghost:
      'border-2 border-transparent hover:border-ink active:translate-y-0.5 shadow-none',
    outline:
      'border-3 border-ink active:translate-y-0.5 shadow-hard-sm',
  }

  const variantInlineStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: { backgroundColor: '#233126', color: '#D8D0C2' },
    secondary: { backgroundColor: '#D8D0C2', color: '#1A1A1A' },
    white: { backgroundColor: '#EDE8DF', color: '#1A1A1A' },
    danger: { backgroundColor: '#4A1A23', color: '#D8D0C2' },
    ghost: { backgroundColor: 'transparent', color: '#1A1A1A' },
    outline: { backgroundColor: 'transparent', color: '#1A1A1A' },
  }

  const disabledStyles =
    'opacity-60 cursor-not-allowed pointer-events-none transform-none shadow-none'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...variantInlineStyles[variant], ...props.style }}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && disabledStyles,
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  )
}
