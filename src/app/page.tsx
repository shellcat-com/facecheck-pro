"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { detectFaces, loadImage, type FaceData } from "@/lib/face-detection"

const STATS = [
  { v: "1,436,956,062", l: "Faces Online" },
  { v: "850M+", l: "Social Profiles" },
  { v: "2.5M+", l: "Searches Daily" },
  { v: "99.7%", l: "Accuracy Rate" },
]

function Counter({ v, l }: { v: string; l: string }) {
  const [c, setC] = useState(0); const ref = useRef<HTMLDivElement>(null)
  const n = parseInt(v.replace(/[^0-9]/g, "")); const s = v.replace(/[0-9]/g, "")
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; let x = 0; const inc = n / 125; const t = setInterval(() => { x += inc; if (x >= n) { setC(n); clearInterval(t) } else setC(Math.floor(x)) }, 16); return () => clearInterval(t) }, { threshold: 0.3 })
    if (ref.current) o.observe(ref.current); return () => o.disconnect()
  }, [n])
  return <div ref={ref} className="text-center"><div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">{c.toLocaleString()}{s}</div><div className="text-zinc-500 text-xs mt-1">{l}</div></div>
}

export default function Home() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [urlInp, setUrlInp] = useState(""); const [showUrl, setShowUrl] = useState(false)
  const [loading, setLoading] = useState(false); const [faces, setFaces] = useState<FaceData[]>([])

  const process = useCallback(async (f: File | string) => {
    setLoading(true); setFaces([])
    try {
      const url = typeof f === "string" ? f : URL.createObjectURL(f)
      setPreview(url)
      const img = await loadImage(url)
      await new Promise(r => setTimeout(r, 200))
      const d = await detectFaces(img); setFaces(d)
    } catch { /* ok */ }
    setLoading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (fs) => fs[0] && process(fs[0]),
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const search = () => {
    if (!preview || !agreed) return
    sessionStorage.setItem("face", preview)
    if (faces[0]) sessionStorage.setItem("faceData", JSON.stringify({ score: faces[0].box.score }))
    router.push("/search")
  }

  const CATS = ["Social Media", "Scammers", "Sex Offenders", "Videos", "Mugshots", "News & Blogs"]
  const ICONS: Record<string, string> = { "Social Media": "📱", "Scammers": "🚨", "Sex Offenders": "⚠️", "Videos": "▶️", "Mugshots": "📋", "News & Blogs": "📰" }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">FC</span><span className="font-bold text-zinc-200">Face<span className="text-blue-400">Check</span><span className="text-zinc-500 text-sm font-normal ml-0.5">.id</span></span></a>
          <div className="flex items-center gap-1 text-sm">
            <a href="/search" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04]">New Search</a>
            <a href="#" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">FAQ</a>
            <a href="#" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">Tips</a>
            <a href="#" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">API</a>
            <a href="#" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">Remove Photos</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-8 sm:pt-28 sm:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-zinc-500 text-sm mb-2">Faces Online</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 mb-6">1,436,956,062</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-[1.15] max-w-2xl mx-auto">Reverse Image Search Engine</h1>
          <p className="text-lg sm:text-xl text-zinc-400 mt-3 font-medium">Find People Online by Photo</p>

          {/* Category chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATS.map((c, i) => (
              <span key={c} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border ${i === 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.02] border-white/[0.08] text-zinc-400"}`}>{ICONS[c]} {c}</span>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-5 text-[11px] text-zinc-500">
            As seen on: <span className="font-semibold text-zinc-400">FOX</span> · <span className="font-semibold text-zinc-400">USA Today</span> · <span className="font-semibold text-zinc-400">Market Watch</span>
          </div>

          <p className="mt-4 text-sm text-zinc-500 italic max-w-lg mx-auto">&ldquo;FaceCheck.ID&apos;s facial recognition AI technology is scary good!&rdquo; <span className="text-zinc-600">— Anonymous User</span></p>
        </div>
      </section>

      {/* Upload */}
      <section className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            {!preview ? (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${isDragActive ? "border-blue-400 bg-blue-500/[0.04] scale-[1.01] shadow-[0_0_60px_rgba(59,130,246,0.1)]" : "border-white/[0.08] hover:border-white/[0.15] bg-white/[0.01]"}`}>
                <input {...getInputProps()} />
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                </div>
                <p className="text-lg font-semibold text-zinc-200 mb-1">Upload a photo of a person</p>
                <p className="text-zinc-500 text-sm">Drag & drop here, or click to browse</p>
                <p className="text-zinc-600 text-xs mt-4">PNG, JPG, WebP — up to 10MB</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowUrl(!showUrl) }} className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors">Paste image URL instead</button>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block">
                  <img src={preview} alt="" className="w-52 h-52 object-cover rounded-2xl border-2 border-blue-500/20 shadow-xl" />
                  <button onClick={() => { setPreview(null); setFaces([]) }} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-sm transition-colors">×</button>
                </div>
                {faces.length > 0 && <p className="mt-2 text-xs text-green-400/80">{faces.length} face{faces.length > 1 ? "s" : ""} detected · {faces[0].box.score}% confidence</p>}
                {loading && <p className="mt-2 text-xs text-zinc-500">Analyzing face...</p>}
                {!loading && faces.length === 0 && <p className="mt-2 text-xs text-zinc-500">Photo ready for search</p>}
              </div>
            )}
            {showUrl && !preview && (
              <div className="mt-4 flex gap-2">
                <input type="url" value={urlInp} onChange={e => setUrlInp(e.target.value)} placeholder="https://example.com/photo.jpg" className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50" />
                <button onClick={() => { if (urlInp) { process(urlInp); setShowUrl(false) } }} disabled={!urlInp} className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-30 hover:bg-blue-400">Load</button>
              </div>
            )}
            <label className="flex items-start gap-3 mt-5 cursor-pointer group">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-blue-500" />
              <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors leading-relaxed">I agree to the Terms of Use and confirm this search is for a lawful purpose. I will not use FaceCheck for employment, credit, insurance, or tenant screening decisions.</span>
            </label>
            <button onClick={search} disabled={!preview || !agreed} className="mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]">🔍 Search This Face</button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.04] py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => <Counter key={i} v={s.v} l={s.l} />)}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[{ i: "🔍", t: "Verify if Someone is Real", d: "Upload a face of a person of interest and discover their social media profiles, appearances in blogs, video, and news websites." }, { i: "🛡️", t: "Avoid Dangerous Criminals", d: "As society became soft on crime, criminals are free to walk. Check a person's photo against millions of faces from mugshot, sex offender websites, and suspects that appeared in the news." }, { i: "👨‍👩‍👧", t: "Keep Your Family Safe", d: "FaceCheck works extra hard to find and index faces of violent criminals, child rapists & molesters, sex offenders, kidnappers, abusers, murderers, hate crime perpetrators, and fraudsters." }, { i: "💡", t: "Avoid Becoming a Victim", d: "Uncover catfish, romance scammer, or fake dating profile. Avoid dating a swindler, convict, or deadbeat. Uncover con-artists before doing business with them. Uncover fake video reviews and testimonials." }].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-blue-500/20 transition-colors">
              <div className="text-3xl mb-3">{f.i}</div>
              <h3 className="font-semibold text-zinc-200 mb-2 text-sm">{f.t}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section className="py-16 px-4 bg-white/[0.01] border-y border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Who&apos;s This Guy? Let&apos;s FaceCheck Him!</h2>
          <p className="text-zinc-500 mb-8">Reverse Image Search with Facial Recognition Demo</p>
          <div className="aspect-video rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
            <button onClick={() => router.push("/search")} className="group flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-8 h-8 text-blue-400 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <p className="text-zinc-400 text-sm group-hover:text-zinc-300">Play Demo — Try a Face Search Now</p>
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">FaceCheck helps you answer a simple question:</h2>
          <p className="text-xl text-blue-400 font-semibold mb-12">Who is that?</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[{ s: "01", t: "Upload a Face Photo", d: "Upload a clear front-facing photo of the person. We support JPG, PNG, and WebP formats." }, { s: "02", t: "AI Scans the Internet", d: "Our AI detects the face, creates a unique faceprint, and searches across millions of indexed public web pages from social media, news, and databases." }, { s: "03", t: "Get Detailed Results", d: "Review matched profiles with confidence scores, source links, and categories. Cross-reference results using Google Lens, Yandex, Bing, and TinEye." }].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-center">
                <div className="text-5xl font-extrabold text-white/[0.03] mb-4">{s.s}</div>
                <h3 className="font-semibold text-zinc-200 mb-2">{s.t}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center space-y-3">
          <p className="text-zinc-600 text-xs leading-relaxed max-w-3xl mx-auto"><strong className="text-zinc-500">DISCLAIMER:</strong> For educational purposes only. All images are indexed from public, readily available web pages only. FaceCheck does not store sensitive or personally identifiable data. FaceCheck&apos;s AI is trained not to index children&apos;s faces. You may not use this website to make decisions about consumer credit, employment, insurance, or tenant screening. FaceCheck does not make any representation about the character, integrity, or criminal history of any person. FaceCheck is not responsible for any content on any 3rd party website it links to. FaceCheck is neither a publisher nor a consumer reporting agency. FaceCheck is a face recognition search engine.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-zinc-500 pt-2">
            <a href="#" className="hover:text-zinc-300">Remove my Photos</a><a href="#" className="hover:text-zinc-300">DMCA Takedown</a><a href="#" className="hover:text-zinc-300">Privacy Policy</a><a href="#" className="hover:text-zinc-300">Terms of Use</a><a href="#" className="hover:text-zinc-300">Face Search API</a>
          </div>
          <p className="text-zinc-700 text-xs pt-2">© {new Date().getFullYear()} FaceCheck.ID by Tech Solutions</p>
        </div>
      </footer>
    </div>
  )
}
