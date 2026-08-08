"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { matchLabel } from "@/lib/utils"

type Cat = "all" | "social" | "news" | "mugshot" | "video" | "scammer" | "other"
const CATS: Cat[] = ["all", "social", "news", "scammer", "mugshot", "video", "other"]
const CAT_ICON: Record<Cat, string> = {
  all: "🔎", social: "📱", news: "📰", scammer: "🚨", mugshot: "📋", video: "▶️", other: "🌐",
}
const CAT_NAME: Record<Cat, string> = {
  all: "All Results", social: "Social Media", news: "News & Blogs",
  scammer: "Scammers", mugshot: "Mugshots", video: "Videos", other: "Other Sources",
}

interface MatchResult {
  id: string
  match_score: number
  similarity: number
  source_url: string
  source_name: string
  category: Cat
  title: string
  thumbnail_url: string
  description?: string
  category_label?: string
  category_icon?: string
  match_label?: string
  match_color?: string
  found_at: string
}

interface EngineResult {
  name: string
  url: string
  icon: string
  description: string
  category: string
}

interface SearchData {
  matches: MatchResult[]
  query_face: { detected: boolean; message?: string; face_count?: number }
  external_engines: EngineResult[]
  total_matches: number
  searched_database: number
  backend_available?: boolean
}

export default function SearchPage() {
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [searching, setSearching] = useState(true)
  const [results, setResults] = useState<MatchResult[]>([])
  const [engines, setEngines] = useState<EngineResult[]>([])
  const [cat, setCat] = useState<Cat>("all")
  const [error, setError] = useState("")
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [dbSize, setDbSize] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceCount, setFaceCount] = useState(0)

  const doSearch = useCallback(async (imageUrl: string) => {
    setSearching(true)
    setError("")

    try {
      // Convert data URL to blob for upload
      const resp = await fetch(imageUrl)
      const blob = await resp.blob()

      const formData = new FormData()
      formData.append("file", blob, "search.jpg")

      const searchResp = await fetch("/api/search", {
        method: "POST",
        body: formData,
      })

      if (!searchResp.ok) {
        throw new Error(`Search failed: ${searchResp.status}`)
      }

      const data: SearchData = await searchResp.json()

      setResults(data.matches || [])
      setEngines(data.external_engines || [])
      setBackendAvailable(data.backend_available !== false)
      setDbSize(data.searched_database || 0)
      setFaceDetected(data.query_face?.detected || false)
      setFaceCount(data.query_face?.face_count || 0)

      if (!data.query_face?.detected && data.query_face?.message) {
        setError(data.query_face.message)
      }
    } catch (err: any) {
      console.error("[Search] Error:", err)
      setError(err.message || "Search failed. Is the backend running?")
      // Still show external engines even on error
      if (image) {
        setEngines(getFallbackEngines(image))
      }
    }

    setSearching(false)
  }, [])

  useEffect(() => {
    const img = sessionStorage.getItem("face")
    if (!img) {
      router.push("/")
      return
    }
    setImage(img)
    doSearch(img)
  }, [router, doSearch])

  const getFallbackEngines = (imageUrl: string): EngineResult[] => [
    { name: "Google Lens", url: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`, icon: "🔍", description: "Most comprehensive — searches Google's entire image index", category: "other" },
    { name: "Yandex Images", url: `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imageUrl)}`, icon: "🌐", description: "Excellent for faces from Eastern Europe, Asia, and social media", category: "other" },
    { name: "Bing Visual Search", url: `https://www.bing.com/images/search?q=imgurl:${encodeURIComponent(imageUrl)}&view=detailv2&iss=sbi`, icon: "🔎", description: "Microsoft's visual search — finds exact and similar images", category: "other" },
    { name: "TinEye", url: `https://tineye.com/search?url=${encodeURIComponent(imageUrl)}`, icon: "🎯", description: "Finds where this exact image appears, including edited versions", category: "other" },
    { name: "PimEyes", url: `https://pimeyes.com/en`, icon: "👁️", description: "Dedicated face search engine — upload for face-specific results", category: "other" },
    { name: "Search4Faces", url: `https://search4faces.com/`, icon: "👤", description: "Search social media profiles (VK, TikTok, ClubHouse) for this face", category: "social" },
  ]

  const filtered = results.filter(r => cat === "all" || r.category === cat)
  const categoryCounts = CATS.slice(1).reduce((acc, c) => {
    acc[c] = results.filter(r => r.category === c).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">FC</span>
            <span className="font-bold text-zinc-200">Face<span className="text-blue-400">Check</span><span className="text-zinc-500 text-sm font-normal ml-0.5">.id</span></span>
          </a>
          <div className="flex items-center gap-3">
            {backendAvailable && dbSize > 0 && (
              <span className="text-xs text-green-400/70 hidden sm:inline">{dbSize.toLocaleString()} faces indexed</span>
            )}
            <a href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">← New Search</a>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Searching state */}
          {searching && (
            <div className="flex flex-col items-center justify-center py-24">
              {image && (
                <img src={image} alt="" className="w-28 h-28 object-cover rounded-full border-2 border-blue-500/20 mb-6 animate-[pulse_2s_ease-in-out_infinite]" />
              )}
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <h2 className="text-xl font-bold text-zinc-200 mb-1">Searching for this person...</h2>
              <p className="text-zinc-500 text-sm text-center max-w-md">
                Detecting face, creating 512-dim ArcFace embedding, querying {dbSize > 0 ? dbSize.toLocaleString() : "the"} face database across FBI, Interpol, mugshots, news, and scammer sources.
              </p>
              <div className="mt-8 w-64 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {!searching && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  {image && (
                    <img src={image} alt="" className="w-16 h-16 object-cover rounded-xl border border-white/[0.06]" />
                  )}
                  <div>
                    <h1 className="text-xl font-bold text-zinc-100">
                      {results.length > 0 ? `Found ${results.length} matches` : "Search Results"}
                    </h1>
                    <p className="text-zinc-500 text-sm">
                      {faceDetected
                        ? `${faceCount} face${faceCount > 1 ? "s" : ""} detected · Searched ${dbSize.toLocaleString()} indexed faces`
                        : backendAvailable
                          ? "No faces detected in the uploaded image"
                          : "External search engines — start Python backend for real face matching"}
                    </p>
                  </div>
                </div>
                <a href="/" className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-xs hover:text-zinc-200 transition-colors">
                  New Search
                </a>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                  <p className="text-amber-400/80 text-sm">{error}</p>
                  {!backendAvailable && (
                    <p className="text-zinc-500 text-xs mt-2">
                      💡 Start the Python backend for real face matching:
                      <code className="ml-2 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs">
                        cd backend && pip install -r requirements.txt && python -m uvicorn backend.api.main:app --port 8000
                      </code>
                    </p>
                  )}
                </div>
              )}

              {/* Match score legend */}
              {results.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11px]">
                  {[
                    { s: "90-100", c: "#22c55e", l: "Certain Match" },
                    { s: "83-89", c: "#4ade80", l: "Confident Match" },
                    { s: "70-82", c: "#facc15", l: "Uncertain Match" },
                    { s: "50-69", c: "#fb923c", l: "Weak Match" },
                  ].map(x => (
                    <span key={x.s} className="flex items-center gap-1.5 text-zinc-500">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: x.c }} />
                      {x.s}: <span className="text-zinc-400">{x.l}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Category filter */}
              {results.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {CATS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCat(c)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        cat === c
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                          : "bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:border-white/[0.15]"
                      }`}
                    >
                      {CAT_ICON[c]} {CAT_NAME[c]}
                      {c !== "all" && (categoryCounts[c] || 0) > 0 && (
                        <span className="text-zinc-600 ml-0.5">({categoryCounts[c]})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* === REAL DATABASE RESULTS === */}
              {filtered.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                    🗄️ Face Database Matches
                  </h3>
                  <p className="text-zinc-500 text-xs mb-6 -mt-2">
                    Real matches from our indexed face database — {dbSize.toLocaleString()} faces from FBI Wanted, Interpol Red Notices, county mugshots, scammer databases, news articles, and video thumbnails.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {filtered.map((r) => {
                      const ml = matchLabel(r.match_score)
                      return (
                        <a
                          key={r.id}
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-blue-500/30 hover:bg-blue-500/[0.02] hover:shadow-lg hover:shadow-blue-500/[0.04] transition-all duration-200 block"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{r.category_icon || CAT_ICON[r.category] || "🌐"}</span>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 truncate">
                                  {r.title || r.source_name}
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                  {r.category_label || r.source_name}
                                </div>
                              </div>
                            </div>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 ml-2"
                              style={{ background: ml.color }}
                            >
                              {r.match_score}%
                            </span>
                          </div>
                          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-zinc-900 mb-3">
                            {r.thumbnail_url && (
                              <img
                                src={r.thumbnail_url}
                                alt={r.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none"
                                }}
                              />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                            {r.description || r.source_name}
                          </p>
                          <div className="mt-3 flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                            View Source →
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </>
              )}

              {/* === EXTERNAL SEARCH ENGINES === */}
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                🔍 Search This Face on External Engines
              </h3>
              <p className="text-zinc-500 text-xs mb-6 -mt-2">
                Also search across the entire internet using these reverse image search engines. Each opens in a new tab.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {engines.map((engine, i) => {
                  const ms = 95 - i * 7
                  const ml = matchLabel(ms)
                  return (
                    <a
                      key={engine.name}
                      href={engine.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-blue-500/30 hover:bg-blue-500/[0.02] hover:shadow-lg hover:shadow-blue-500/[0.04] transition-all duration-200 block"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{engine.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100">
                              {engine.name}
                            </div>
                            <div className="text-[10px] text-zinc-500">Search Engine</div>
                          </div>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: ml.color }}
                        >
                          {ms}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{engine.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                        Open {engine.name} →
                      </div>
                    </a>
                  )
                })}
              </div>

              {/* How to use section */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-500/[0.03] to-violet-500/[0.03] border border-blue-500/10">
                <h3 className="text-lg font-bold text-zinc-200 mb-4">📋 How to Identify This Person</h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-lg mb-1">1️⃣</div>
                    <div className="font-semibold text-zinc-300 mb-1">Our Database</div>
                    <p className="text-zinc-500 text-xs">
                      We search {dbSize.toLocaleString()} indexed faces from FBI Wanted, Interpol Red Notices, county jail mugshots, scammer databases, news articles, and video thumbnails using ArcFace 512-dim embeddings.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-lg mb-1">2️⃣</div>
                    <div className="font-semibold text-zinc-300 mb-1">Google + Yandex + Bing</div>
                    <p className="text-zinc-500 text-xs">
                      Cross-reference against the entire internet. Google Lens finds social media profiles. Yandex excels at non-Western faces. Bing finds exact matches.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-lg mb-1">3️⃣</div>
                    <div className="font-semibold text-zinc-300 mb-1">PimEyes + TinEye + Search4Faces</div>
                    <p className="text-zinc-500 text-xs">
                      Dedicated face search engines for comprehensive results. PimEyes for face matching. TinEye for exact image instances. Search4Faces for social profiles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Important notice */}
              <div className="mt-8 p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                <p className="text-amber-400/70 text-xs leading-relaxed">
                  ⚠️ <strong>IMPORTANT:</strong> Many unrelated people look alike. Never rely solely on a face search alone. Scammers use photos of innocent people. Internet information may be inaccurate or misleading. Always cross-reference multiple sources before making decisions. This tool is for educational purposes only.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center space-y-3">
          <p className="text-zinc-600 text-xs leading-relaxed max-w-3xl mx-auto">
            <strong className="text-zinc-500">SOURCES:</strong> FBI Wanted API · Interpol Red Notices · JailBase · GDELT VGKG · Public RSS Feeds · YouTube Thumbnails · Community Scammer Databases. All data from public, readily available sources.
          </p>
          <p className="text-zinc-600 text-xs leading-relaxed max-w-3xl mx-auto">
            <strong className="text-zinc-500">DISCLAIMER:</strong> For educational purposes only. All images are indexed from public web pages. FaceCheck does not store sensitive or personally identifiable data. You may not use this website to make decisions about consumer credit, employment, insurance, or tenant screening.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-zinc-500 pt-2">
            <a href="#" className="hover:text-zinc-300">Remove my Photos</a>
            <a href="#" className="hover:text-zinc-300">DMCA Takedown</a>
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Use</a>
          </div>
          <p className="text-zinc-700 text-xs pt-2">© {new Date().getFullYear()} FaceCheck.ID — Powered by ArcFace + ChromaDB</p>
        </div>
      </footer>
    </div>
  )
}
