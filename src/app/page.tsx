"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { detectFaces, loadImage, type FaceResult } from "@/lib/face-detection"
import { STATS } from "@/lib/mock-data"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

function Counter({ value, label }: { value: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const num = parseInt(value.replace(/[^0-9]/g, ""))
  const suffix = value.replace(/[0-9]/g, "")

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let s = 0; const dur = 2000; const inc = num / (dur / 16)
      const t = setInterval(() => { s += inc; if (s >= num) { setCount(num); clearInterval(t) } else setCount(Math.floor(s)) }, 16)
      return () => clearInterval(t)
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [num])

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-zinc-500 text-xs mt-1">{label}</div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [showUrl, setShowUrl] = useState(false)
  const [loading, setLoading] = useState(false)
  const [faces, setFaces] = useState<FaceResult[]>([])

  const processImage = useCallback(async (file: File | string) => {
    setLoading(true); setFaces([])
    try {
      let url: string
      if (typeof file === "string") { url = file }
      else { url = URL.createObjectURL(file) }
      setPreview(url)
      const img = await loadImage(url)
      await new Promise(r => setTimeout(r, 200))
      const detected = await detectFaces(img)
      setFaces(detected)
    } catch { /* models might not be loaded */ }
    finally { setLoading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && processImage(files[0]),
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const handleSearch = () => {
    if (!preview || !agreed) return
    sessionStorage.setItem("searchImage", preview)
    if (faces.length > 0) {
      sessionStorage.setItem("searchFaces", JSON.stringify(faces.map(f => ({ score: f.box.score }))))
    }
    router.push("/search")
  }

  const CATEGORIES = [
    { label: "Social Media", icon: "📱", active: true },
    { label: "Scammers", icon: "🚨" },
    { label: "Sex Offenders", icon: "⚠️" },
    { label: "Videos", icon: "▶️" },
    { label: "Mugshots", icon: "📋" },
    { label: "News & Blogs", icon: "📰" },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-20 pb-12 sm:pt-28 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Face count */}
          <p className="text-zinc-500 text-sm mb-2">Faces Online</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 mb-6">
            1,436,956,062
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-[1.15] max-w-2xl mx-auto">
            Reverse Image Search Engine
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 mt-3 font-medium">
            Find People Online by Photo
          </p>

          {/* Category chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.map((c) => (
              <span key={c.label} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${c.active ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.02] border-white/[0.08] text-zinc-400"}`}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>

          {/* Media badge */}
          <div className="flex items-center justify-center gap-3 mt-5 text-[11px] text-zinc-500">
            As seen on: <span className="font-semibold text-zinc-400">FOX</span> · <span className="font-semibold text-zinc-400">USA Today</span> · <span className="font-semibold text-zinc-400">Market Watch</span>
          </div>
        </div>
      </section>

      {/* Upload section */}
      <section className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            {!preview ? (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${isDragActive ? "border-blue-400 bg-blue-500/[0.04] scale-[1.01] shadow-[0_0_60px_rgba(59,130,246,0.1)]" : "border-white/[0.08] hover:border-white/[0.15] bg-white/[0.01]"}`}>
                <input {...getInputProps()} />
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-zinc-200 mb-1">Upload a photo of a person</p>
                <p className="text-zinc-500 text-sm">Drag & drop here, or click to browse</p>
                <p className="text-zinc-600 text-xs mt-4">PNG, JPG, WebP — up to 10MB</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowUrl(!showUrl) }} className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Paste image URL instead
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block">
                  <img src={preview} alt="Preview" className="w-52 h-52 object-cover rounded-2xl border-2 border-blue-500/20 shadow-xl" />
                  <button onClick={() => { setPreview(null); setFaces([]) }} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-sm transition-colors">×</button>
                </div>
                {faces.length > 0 && (
                  <p className="mt-2 text-xs text-green-400/80">{faces.length} face{faces.length > 1 ? "s" : ""} detected · {faces[0].box.score}% confidence</p>
                )}
                {loading && <p className="mt-2 text-xs text-zinc-500">Analyzing...</p>}
                {!loading && faces.length === 0 && <p className="mt-2 text-xs text-zinc-500">Photo ready for search</p>}
              </div>
            )}

            {showUrl && !preview && (
              <div className="mt-4 flex gap-2">
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50" />
                <button onClick={() => { if (urlInput) { processImage(urlInput); setShowUrl(false) } }} disabled={!urlInput}
                  className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-30 hover:bg-blue-400 transition-colors">Load</button>
              </div>
            )}

            <label className="flex items-start gap-3 mt-5 cursor-pointer group">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-blue-500" />
              <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors leading-relaxed">
                I agree to the Terms of Use and confirm this search is for a lawful purpose. I will not use FaceCheck for employment, credit, insurance, or tenant screening decisions.
              </span>
            </label>

            <button onClick={handleSearch} disabled={!preview || !agreed}
              className="mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]">
              🔍 Search This Face
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/[0.04] py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => <Counter key={i} value={s.value} label={s.label} />)}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🔍", title: "Verify if Someone is Real", desc: "Upload a face of a person of interest and discover their social media profiles, appearances in blogs, video, and news websites." },
            { icon: "🛡️", title: "Avoid Dangerous Criminals", desc: "Check a person's photo against millions of faces from mugshot, sex offender websites, and suspects that appeared in the news." },
            { icon: "👨‍👩‍👧", title: "Keep Your Family Safe", desc: "FaceCheck works extra hard to find and index faces of violent criminals, child predators, sex offenders, kidnappers, abusers, murderers, and fraudsters." },
            { icon: "💡", title: "Avoid Becoming a Victim", desc: "Uncover catfish, romance scammers, fake dating profiles. Avoid swindlers and con-artists. Uncover fake video reviews and testimonials." },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-blue-500/20 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-zinc-200 mb-2 text-sm">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo section */}
      <section className="py-16 px-4 bg-white/[0.01] border-y border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Who&apos;s This Guy? Let&apos;s FaceCheck Him!</h2>
          <p className="text-zinc-500 mb-8">Reverse Image Search with Facial Recognition Demo</p>
          <div className="aspect-video rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:bg-blue-500/30 transition-colors" onClick={() => router.push("/search")}>
                <svg className="w-8 h-8 text-blue-400 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <p className="text-zinc-400 text-sm">Play Demo — Try a Face Search Now</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">FaceCheck helps you answer a simple question:</h2>
          <p className="text-xl text-blue-400 font-semibold mb-12">Who is that?</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload a Face Photo", desc: "Upload a clear front-facing photo. We support JPG, PNG, and WebP formats up to 10MB." },
              { step: "02", title: "AI Scans the Internet", desc: "Our AI detects the face, creates a unique faceprint, and searches across millions of indexed public web pages." },
              { step: "03", title: "Get Detailed Results", desc: "Review matched profiles with confidence scores, source links, and categories. Filter by social media, news, mugshots, and more." },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-center">
                <div className="text-5xl font-extrabold text-white/[0.03] mb-4">{s.step}</div>
                <h3 className="font-semibold text-zinc-200 mb-2">{s.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
