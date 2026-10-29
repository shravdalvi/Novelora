import type { AutoSaveStatus } from '@/hooks/useAutoSave'

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus
  lastSaved: Date | null
}

/**
 * AutoSaveIndicator — small status chip shown in the Writing Studio header.
 * Shows "Saving…", "Saved ✓ at HH:MM", or "Error saving" states.
 */
export default function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null

  const configs: Record<AutoSaveStatus, { label: string; className: string }> = {
    idle: { label: '', className: '' },
    saving: {
      label: '⟳ Saving…',
      className: 'text-muted animate-pulse',
    },
    saved: {
      label: `✓ Saved${lastSaved ? ` at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`,
      className: 'text-cedar',
    },
    error: {
      label: '✕ Error saving',
      className: 'text-soft-coral',
    },
  }

  const { label, className } = configs[status]

  return (
    <span className={`font-grotesk text-sm font-semibold ${className} transition-all duration-300`}>
      {label}
    </span>
  )
}
