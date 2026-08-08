"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { MOCK_RESULTS, type SearchResult } from "@/lib/mock-data"
import { matchLabel, timeAgo } from "@/lib/utils"

type Category = "all" | "social" | "scammer" | "news" | "mugshot" | "video"

const CAT_ICONS: Record<Category, string> = { all: "🔎", social: "📱", scammer: "🚨", news: "📰", mugshot: "📋", video: "▶️" }
const CAT_LABELS: Record<Category, string> = { all: "All Results", social: "Social Media", scammer: "Scammers", news: "News & Blogs", mugshot: "Mugshots", video: "Videos" }
const CATS: Category[] = ["all", "social", "scammer", "news", "mugshot", "video"]

export default function SearchPage() {
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [searching, setSearching] = useState(true)
  const [results, setResults] = useState<SearchResult[]>([])
  const [category, setCategory] = useState<Category>("all")
  const [sort, setSort] = useState<"score" | "date">("score")

  useEffect(() => {
    const img = sessionStorage.getItem("searchImage")
    if (!img) { router.push("/"); return }
    setImage(img)

    // Simulate search
    const t = setTimeout(() => {
      setResults([...MOCK_RESULTS].sort(() => Math.random() - 0.5))
      setSearching(false)
    }, 3000)
    return () => clearTimeout(t)
  }, [router])

  const filtered = useMemo(() => {
    let r = category === "all" ? results : results.filter(x => x.category === category)
    if (sort === "score") r = [...r].sort((a, b) => b.matchScore - a.matchScore)
    else r = [...r].sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime())
    return r
  }, [results, category, sort])

  const counts = useMemo(() => {
    const c: Record<Category, number> = { all: results.length, social: 0, scammer: 0, news: 0, mugshot: 0, video: 0 }
    results.forEach(r => { if (r.category in c) c[r.category]++ })
    return c
  }, [results])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Searching state */}
          {searching && (
            <div className="flex flex-col items-center justify-center py-24">
              {image && <img src={image} alt="" className="w-28 h-28 object-cover rounded-full border-2 border-blue-500/20 mb-6 animate-[pulse_2s_ease-in-out_infinite]" />}
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <h2 className="text-xl font-bold text-zinc-200 mb-1">Searching for this person...</h2>
              <p className="text-zinc-500 text-sm text-center max-w-md">
                Detecting face, creating faceprint, and searching across social media, news sites, mugshot databases, and public websites.
              </p>
              <div className="mt-8 w-64 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {/* Results */}
          {!searching && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {image && <img src={image} alt="" className="w-16 h-16 object-cover rounded-xl border border-white/[0.06]" />}
                  <div>
                    <h1 className="text-xl font-bold text-zinc-100">Search Results</h1>
                    <p className="text-zinc-500 text-sm">Found {results.length} matching results across {counts.social} social profiles, {counts.news} news articles, and more</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setImage(null); sessionStorage.removeItem("searchImage"); router.push("/") }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-xs hover:text-zinc-200 transition-colors">New Search</button>
                  <select value={sort} onChange={e => setSort(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs focus:outline-none focus:border-blue-500/50">
                    <option value="score">Highest Match</option>
                    <option value="date">Most Recent</option>
                  </select>
                </div>
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {CATS.map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      category === cat ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-zinc-600"
                    }`}>
                    {CAT_ICONS[cat]} {CAT_LABELS[cat]}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${category === cat ? "bg-blue-500/20 text-blue-300" : "bg-white/[0.04] text-zinc-500"}`}>{counts[cat]}</span>
                  </button>
                ))}
              </div>

              {/* Match score legend */}
              <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11px]">
                {[{ s: "90-100", c: "#22c55e", l: "Certain Match" }, { s: "83-89", c: "#4ade80", l: "Confident Match" }, { s: "70-82", c: "#facc15", l: "Uncertain Match" }, { s: "50-69", c: "#fb923c", l: "Weak Match" }].map(x => (
                  <span key={x.s} className="flex items-center gap-1.5 text-zinc-500">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: x.c }} /> {x.s}: <span className="text-zinc-400">{x.l}</span>
                  </span>
                ))}
              </div>

              {/* Results grid */}
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((r, i) => {
                    const m = matchLabel(r.matchScore)
                    return (
                      <div key={r.id} className="group bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/[0.04] transition-all duration-200" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="relative aspect-square overflow-hidden">
                          <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: m.color }}>{r.matchScore}%</span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] border border-white/10">{r.sourceName}</span>
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="block w-full py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold text-center hover:bg-blue-400 transition-colors">View Source →</a>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-medium text-zinc-300 truncate">{r.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
                            <span style={{ color: m.color, fontWeight: 600 }}>{m.text}</span>
                            <span>·</span>
                            <span>{timeAgo(new Date(r.foundAt))}</span>
                          </div>
                          {r.description && <p className="text-[10px] text-zinc-600 mt-1 line-clamp-2">{r.description}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500">
                  <p className="text-lg mb-2">No results in this category</p>
                  <p className="text-sm">Try selecting &quot;All Results&quot; or adjusting filters</p>
                </div>
              )}

              {/* External search links */}
              <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-500/[0.04] to-violet-500/[0.04] border border-blue-500/10 text-center">
                <h3 className="text-lg font-bold text-zinc-200 mb-2">Want to search more sources?</h3>
                <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
                  Try searching this face on other reverse image search engines for additional results.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {image && (
                    <>
                      <a href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(image)}`} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.20] transition-all inline-flex items-center gap-2">
                        🔍 Google Lens
                      </a>
                      <a href={`https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(image)}`} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.20] transition-all inline-flex items-center gap-2">
                        🌐 Yandex Images
                      </a>
                      <a href={`https://www.bing.com/images/search?q=imgurl:${encodeURIComponent(image)}&view=detailv2&iss=sbi`} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.20] transition-all inline-flex items-center gap-2">
                        🔎 Bing Visual Search
                      </a>
                      <a href={`https://tineye.com/search?url=${encodeURIComponent(image)}`} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.20] transition-all inline-flex items-center gap-2">
                        🎯 TinEye
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Important notice */}
              <div className="mt-8 p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                <p className="text-amber-400/70 text-xs leading-relaxed">
                  ⚠️ <strong>IMPORTANT:</strong> Many unrelated people look alike. Never rely solely on a face search alone. Scammers use photos of innocent people. Internet information may be inaccurate or misleading. Always cross-reference multiple sources before making decisions.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {!searching && <Footer />}
    </div>
  )
}
