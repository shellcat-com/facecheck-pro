"use client"

import type { SearchResult } from "@/types"
import { cn, getMatchLabel, getMatchColor } from "@/lib/utils"
import { ExternalLink, Calendar, Tag } from "lucide-react"

interface ResultCardProps {
  result: SearchResult
  index: number
}

export function ResultCard({ result, index }: ResultCardProps) {
  const matchInfo = getMatchLabel(result.matchScore)

  return (
    <div
      className="group relative bg-surface-900/80 border border-surface-800 rounded-xl overflow-hidden card-hover animate-scale-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={result.imageUrl}
          alt={result.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Match badge */}
        <div className="absolute top-3 left-3">
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1",
            getMatchColor(result.matchScore)
          )}>
            {result.matchScore}%
          </div>
        </div>

        {/* Source badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium border border-white/10">
            {result.sourceName}
          </span>
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="w-full">
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-400 transition-colors w-full justify-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Source
            </a>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-surface-200 truncate mb-1">
          {result.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <span className={cn("font-semibold", matchInfo.color)}>
            {matchInfo.label}
          </span>
          <span>·</span>
          <Calendar className="w-3 h-3" />
          <span>{result.foundAt.toLocaleDateString()}</span>
        </div>
        {result.description && (
          <p className="text-xs text-surface-500 mt-1.5 line-clamp-2">
            {result.description}
          </p>
        )}
      </div>
    </div>
  )
}
