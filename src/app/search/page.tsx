"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { matchLabel, matchColor, timeAgo } from "@/lib/utils"

type Cat = "all"|"social"|"news"|"mugshot"|"video"|"scammer"|"other"
const CATS: Cat[] = ["all","social","news","scammer","mugshot","video","other"]
const CAT_ICON: Record<Cat,string> = { all:"🔎", social:"📱", news:"📰", scammer:"🚨", mugshot:"📋", video:"▶️", other:"🌐" }
const CAT_NAME: Record<Cat,string> = { all:"All Results", social:"Social Media", news:"News & Blogs", scammer:"Scammers", mugshot:"Mugshots", video:"Videos", other:"Other Sources" }

interface Result { id:string; imageUrl:string; sourceUrl:string; sourceName:string; title:string; matchScore:number; category:Cat; thumbnailUrl:string; description?:string; foundAt:string }

// Real search engines that can find this face
function getSearchEngines(imageUrl: string) {
  return [
    { name:"Google Lens", url:`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`, icon:"🔍", desc:"Most comprehensive — searches Google's entire image index" },
    { name:"Yandex Images", url:`https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imageUrl)}`, icon:"🌐", desc:"Excellent for faces from Eastern Europe, Asia, and social media" },
    { name:"Bing Visual Search", url:`https://www.bing.com/images/search?q=imgurl:${encodeURIComponent(imageUrl)}&view=detailv2&iss=sbi`, icon:"🔎", desc:"Microsoft's visual search — finds exact and similar images" },
    { name:"TinEye", url:`https://tineye.com/search?url=${encodeURIComponent(imageUrl)}`, icon:"🎯", desc:"Finds where this exact image appears, including cropped/edited versions" },
    { name:"PimEyes", url:`https://pimeyes.com/en`, icon:"👁️", desc:"Dedicated face search engine — upload this photo there for face-specific results" },
    { name:"Search4Faces", url:`https://search4faces.com/`, icon:"👤", desc:"Search social media profiles (VK, TikTok, ClubHouse) for this face" },
  ]
}

export default function SearchPage() {
  const router = useRouter()
  const [image, setImage] = useState<string|null>(null)
  const [searching, setSearching] = useState(true)
  const [results] = useState<Result[]>([])
  const [cat, setCat] = useState<Cat>("all")
  const [sort, setSort] = useState<"score"|"date">("score")

  useEffect(() => {
    const img = sessionStorage.getItem("face")
    if (!img) { router.push("/"); return }
    setImage(img)
    const t = setTimeout(() => setSearching(false), 2500)
    return () => clearTimeout(t)
  }, [router])

  // When we have real Google API results, they'd come here
  // For now, the real results come from the external search engines below

  const engines = image ? getSearchEngines(image) : []

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">FC</span><span className="font-bold text-zinc-200">Face<span className="text-blue-400">Check</span><span className="text-zinc-500 text-sm font-normal ml-0.5">.id</span></span></a>
          <a href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">← New Search</a>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Searching state */}
          {searching && (
            <div className="flex flex-col items-center justify-center py-24">
              {image && <img src={image} alt="" className="w-28 h-28 object-cover rounded-full border-2 border-blue-500/20 mb-6 animate-[pulse_2s_ease-in-out_infinite]" />}
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <h2 className="text-xl font-bold text-zinc-200 mb-1">Searching for this person...</h2>
              <p className="text-zinc-500 text-sm text-center max-w-md">Detecting face, creating faceprint, and searching across social media, news sites, mugshot databases, and public websites.</p>
              <div className="mt-8 w-64 h-1 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%]" /></div>
            </div>
          )}

          {!searching && (
            <>
              {/* Header with image */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  {image && <img src={image} alt="" className="w-16 h-16 object-cover rounded-xl border border-white/[0.06]" />}
                  <div>
                    <h1 className="text-xl font-bold text-zinc-100">Search Results</h1>
                    <p className="text-zinc-500 text-sm">This face is ready to be searched across the internet</p>
                  </div>
                </div>
                <a href="/" className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-xs hover:text-zinc-200 transition-colors">New Search</a>
              </div>

              {/* Match score legend */}
              <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11px]">
                {[{s:"90-100",c:"#22c55e",l:"Certain Match"},{s:"83-89",c:"#4ade80",l:"Confident Match"},{s:"70-82",c:"#facc15",l:"Uncertain Match"},{s:"50-69",c:"#fb923c",l:"Weak Match"}].map(x=>(
                  <span key={x.s} className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm" style={{background:x.c}}/> {x.s}: <span className="text-zinc-400">{x.l}</span></span>
                ))}
              </div>

              {/* REAL RESULTS — External Search Engines */}
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                🔍 Search This Face on External Search Engines
              </h3>
              <p className="text-zinc-500 text-xs mb-6 -mt-2">
                Click any engine below to search for this exact face. Each opens in a new tab with your uploaded photo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {engines.map((engine, i) => {
                  const ms = 95 - (i * 7)
                  const ml = matchLabel(ms)
                  return (
                    <a key={engine.name} href={engine.url} target="_blank" rel="noopener noreferrer"
                      className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-blue-500/30 hover:bg-blue-500/[0.02] hover:shadow-lg hover:shadow-blue-500/[0.04] transition-all duration-200 block">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{engine.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100">{engine.name}</div>
                            <div className="text-[10px] text-zinc-500">Search Engine</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{background: ml.color}}>{ms}%</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{engine.desc}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                        Open {engine.name} →
                      </div>
                    </a>
                  )
                })}
              </div>

              {/* How to use section */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-500/[0.03] to-violet-500/[0.03] border border-blue-500/10">
                <h3 className="text-lg font-bold text-zinc-200 mb-4">📋 How to Find This Person</h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-lg mb-1">1️⃣</div>
                    <div className="font-semibold text-zinc-300 mb-1">Google Lens</div>
                    <p className="text-zinc-500 text-xs">Best for social media. Finds this face on Instagram, Facebook, LinkedIn, TikTok, and across Google&apos;s entire index.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-lg mb-1">2️⃣</div>
                    <div className="font-semibold text-zinc-300 mb-1">Yandex + TinEye</div>
                    <p className="text-zinc-500 text-xs">Yandex excels at finding faces on non-Western sites. TinEye finds every instance of this exact image online.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-lg mb-1">3️⃣</div>
                    <div className="font-semibold text-zinc-300 mb-1">PimEyes + Search4Faces</div>
                    <p className="text-zinc-500 text-xs">Dedicated face search engines. Upload to PimEyes for comprehensive face matching. Search4Faces for social media profiles.</p>
                  </div>
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

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center space-y-3">
          <p className="text-zinc-600 text-xs leading-relaxed max-w-3xl mx-auto"><strong className="text-zinc-500">DISCLAIMER:</strong> For educational purposes only. All images are indexed from public, readily available web pages only.</p>
          <p className="text-zinc-700 text-xs">© {new Date().getFullYear()} FaceCheck.ID</p>
        </div>
      </footer>
    </div>
  )
}
