import React from 'react'
import clsx from 'clsx'

export interface TabItem {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={clsx('flex border-b-3 border-ink gap-2 overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-5 py-2.5 font-bangers text-lg tracking-comic uppercase border-t-3 border-x-3 border-ink transition-all -mb-[3px] select-none',
              isActive
                ? 'bg-hunter text-bone border-b-3 border-b-hunter shadow-none translate-y-0'
                : 'bg-bone text-ink hover:bg-sage/20 hover:text-ink'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'ml-2 px-1.5 py-0.2 text-xs font-grotesk font-bold rounded-none border border-ink',
                  isActive ? 'bg-bone text-ink' : 'bg-sage/30 text-ink'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
