import React, { useEffect } from 'react'
import clsx from 'clsx'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  isConfirm?: boolean
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  confirmLoading?: boolean
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  isConfirm = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmLoading = false,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={clsx(
          'relative w-full max-w-lg bg-parchment border-3 border-ink shadow-hard-lg z-10 overflow-hidden transform transition-all',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-ink bg-hunter">
          <h3 className="font-bangers text-2xl tracking-comic text-bone">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border-2 border-bone bg-bone/20 font-bangers text-lg text-bone shadow-hard-sm hover:bg-bordeaux hover:text-bone transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto text-ink font-grotesk">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-3 border-ink bg-bone/50 flex justify-end gap-3">
          {footer ? (
            footer
          ) : isConfirm ? (
            <>
              <Button variant="secondary" size="sm" onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={onConfirm}
                loading={confirmLoading}
              >
                {confirmText}
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
