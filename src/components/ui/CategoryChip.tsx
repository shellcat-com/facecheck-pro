"use client"

import { cn } from "@/lib/utils"
import type { SearchCategory } from "@/types"

interface CategoryChipProps {
  category: SearchCategory
  active: boolean
  onClick: () => void
  count?: number
}

const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: string }> = {
  all: { label: "All Results", icon: "🔎" },
  social: { label: "Social Media", icon: "📱" },
  scammer: { label: "Scammers", icon: "🚨" },
  news: { label: "News & Blogs", icon: "📰" },
  mugshot: { label: "Mugshots", icon: "📋" },
  video: { label: "Videos", icon: "▶️" },
}

export function CategoryChip({ category, active, onClick, count }: CategoryChipProps) {
  const config = CATEGORY_CONFIG[category]
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
        active
          ? "bg-brand-500/15 border-brand-500/50 text-brand-400 shadow-sm shadow-brand-500/10"
          : "bg-surface-800/50 border-surface-700 text-surface-300 hover:border-surface-500 hover:text-surface-200"
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {count !== undefined && (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full",
          active ? "bg-brand-500/20 text-brand-300" : "bg-surface-700 text-surface-400"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
