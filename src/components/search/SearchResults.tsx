"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import { MOCK_RESULTS } from "@/lib/mock-data"
import { ResultCard } from "./ResultCard"
import { CategoryChip } from "@/components/ui/CategoryChip"
import { Button } from "@/components/ui/Button"
import type { SearchCategory } from "@/types"
import { Filter } from "lucide-react"

export function SearchResults() {
  const { searchResults, setSearchResults, activeCategory, setActiveCategory, setShowCreditModal } = useStore()
  const [sortBy, setSortBy] = useState<"score" | "date">("score")
  const [showFilters, setShowFilters] = useState(false)

  const results = searchResults.length > 0 ? searchResults : MOCK_RESULTS
  // Simulate: use mock data for demo, actual search would populate searchResults

  const filtered = useMemo(() => {
    let r = results
    if (activeCategory !== "all") {
      r = r.filter((item) => item.category === activeCategory)
    }
    if (sortBy === "score") {
      r = [...r].sort((a, b) => b.matchScore - a.matchScore)
    } else {
      r = [...r].sort((a, b) => b.foundAt.getTime() - a.foundAt.getTime())
    }
    return r
  }, [results, activeCategory, sortBy])

  const categoryCounts: Record<SearchCategory, number> = {
    all: results.length,
    social: results.filter((r) => r.category === "social").length,
    scammer: results.filter((r) => r.category === "scammer").length,
    news: results.filter((r) => r.category === "news").length,
    mugshot: results.filter((r) => r.category === "mugshot").length,
    video: results.filter((r) => r.category === "video").length,
  }

  const categories: SearchCategory[] = ["all", "social", "scammer", "news", "mugshot", "video"]

  return (
    <div className="animate-fade-in">
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-surface-100">
            Search Results
          </h2>
          <p className="text-surface-400 text-sm mt-1">
            Found {filtered.length} matching results across {categoryCounts.social} social profiles,
            {" "}{categoryCounts.news} news articles, and more
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "date")}
            className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="score">Highest Match</option>
            <option value="date">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <CategoryChip
            key={cat}
            category={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            count={categoryCounts[cat]}
          />
        ))}
      </div>

      {/* Match score legend */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-surface-900/50 rounded-xl border border-surface-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500" />
          <span className="text-surface-400">90-100: <span className="text-surface-300">Certain Match</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-400" />
          <span className="text-surface-400">83-89: <span className="text-surface-300">Confident Match</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-surface-400">70-82: <span className="text-surface-300">Uncertain Match</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-surface-400">50-69: <span className="text-surface-300">Weak Match</span></span>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((result, i) => (
          <ResultCard key={result.id} result={result} index={i} />
        ))}
      </div>

      {/* Credit upsell */}
      <div className="mt-12 p-8 bg-gradient-to-r from-brand-500/10 to-purple-500/10 rounded-2xl border border-brand-500/20 text-center">
        <h3 className="text-xl font-bold text-surface-100 mb-2">
          Want to See More Images?
        </h3>
        <p className="text-surface-400 mb-6 max-w-md mx-auto">
          Buy credits to view up to <span className="text-brand-400 font-semibold">3x more</span> results per search,
          including detailed profiles and source links.
        </p>
        <Button variant="primary" size="lg" onClick={() => setShowCreditModal(true)}>
          Buy Credits
        </Button>
      </div>

      {/* Important disclaimer */}
      <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
        <p className="text-yellow-400/80 text-xs leading-relaxed">
          ⚠️ <strong>IMPORTANT:</strong> Many unrelated people look alike. Never rely solely on a face search alone.
          Scammers use photos of innocent people. Internet information may be inaccurate or misleading.
          Always cross-reference multiple sources before making decisions.
        </p>
      </div>
    </div>
  )
}
