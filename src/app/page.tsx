"use client"

import { useState, useRef, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  detectFaces,
  drawFaceBoxes,
  imageUrlToElement,
  type DetectedFace,
} from "@/lib/face-detection"
import { formatFileSize, getConfidenceColor } from "@/lib/utils"
import Link from "next/link"

export default function HomePage() {
  const [image, setImage] = useState<string | null>(null)
  const [faces, setFaces] = useState<DetectedFace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const processImage = useCallback(async (file: File | string) => {
    setError(null)
    setLoading(true)
    setFaces([])

    try {
      let img: HTMLImageElement
      if (typeof file === "string") {
        img = await imageUrlToElement(file)
        setImage(file)
        setFileName("URL image")
        setFileSize(0)
      } else {
        const dataUrl = URL.createObjectURL(file)
        img = await imageUrlToElement(dataUrl)
        setImage(dataUrl)
        setFileName(file.name)
        setFileSize(file.size)
      }

      // Wait for image to be available in DOM before detection
      await new Promise((r) => setTimeout(r, 100))

      const detected = await detectFaces(img)
      setFaces(detected)

      // Draw on canvas
      await new Promise((r) => setTimeout(r, 50))
      if (canvasRef.current && imgRef.current) {
        drawFaceBoxes(canvasRef.current, img, detected)
      }
    } catch (e: any) {
      setError(e.message || "Failed to process image")
    } finally {
      setLoading(false)
    }
  }, [])

  const onDrop = useCallback(
    (files: File[]) => {
      if (files[0]) processImage(files[0])
    },
    [processImage]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (items) {
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            processImage(item.getAsFile()!)
            break
          }
        }
      }
    },
    [processImage]
  )

  return (
    <div className="min-h-screen" onPaste={handlePaste}>
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">FD</span>
            <span className="font-bold text-base text-zinc-200">Face<span className="text-blue-400">Detect</span></span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tools/compare" className="text-zinc-400 hover:text-zinc-200 transition-colors">Face Compare</Link>
            <a href="https://github.com/shellcat-com/facecheck-pro" target="_blank" rel="noopener" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Powered by TensorFlow.js + face-api.js
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100 leading-[1.08]">
            Detect faces with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI precision
            </span>
          </h1>
          <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            100% free. 100% private. All processing runs locally in your browser — your images never leave your device.
          </p>

          {/* Features row */}
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-xs text-zinc-500">
            {["Face Detection", "Age & Gender", "Expression Analysis", "Face Comparison", "68-Point Landmarks"].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Main tool area */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {!image ? (
            <div {...getRootProps()} className={`drop-zone p-14 sm:p-20 text-center ${isDragActive ? "active" : ""}`}>
              <input {...getInputProps()} />
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-1.5">Drop a photo here</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                Drag & drop, click to browse, or paste from clipboard (Ctrl+V). Works best with clear front-facing photos.
              </p>
              <p className="text-zinc-600 text-xs mt-4">PNG, JPG, WebP — up to 20MB</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Image + Canvas */}
              <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/[0.06]">
                <img
                  ref={imgRef}
                  src={image}
                  alt="Uploaded"
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onLoad={async () => {
                    if (imgRef.current && faces.length > 0 && canvasRef.current) {
                      drawFaceBoxes(canvasRef.current, imgRef.current, faces)
                    }
                  }}
                />
                <canvas ref={canvasRef} className="face-canvas" />

                {/* Loading overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-zinc-300 text-sm font-medium">Analyzing face...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setImage(null); setFaces([]); setError(null) }}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-sm hover:bg-white/10 transition-colors"
                  >
                    New Image
                  </button>
                  {image && (
                    <a
                      href={image}
                      download={fileName || "face-detect-result"}
                      className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 transition-colors"
                    >
                      Download
                    </a>
                  )}
                </div>
                <span className="text-xs text-zinc-600">
                  {fileName}{fileSize > 0 ? ` · ${formatFileSize(fileSize)}` : ""}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Results */}
              {faces.length > 0 && (
                <div className="mt-6 space-y-4 animate-slide-up">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                    Detection Results · {faces.length} face{faces.length > 1 ? "s" : ""} found
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {faces.map((face, i) => (
                      <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Face #{i + 1}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: getConfidenceColor(face.box.score), background: `${getConfidenceColor(face.box.score)}15` }}>
                            {face.box.score}% confidence
                          </span>
                        </div>

                        {/* Demographics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2.5 rounded-lg bg-white/[0.02]">
                            <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Age</div>
                            <div className="text-zinc-200 font-semibold">~{face.age || "?"} yrs</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white/[0.02]">
                            <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Gender</div>
                            <div className="text-zinc-200 font-semibold capitalize">{face.gender || "?"}</div>
                          </div>
                        </div>

                        {/* Expression */}
                        <div className="p-2.5 rounded-lg bg-white/[0.02]">
                          <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Expression</div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 text-sm font-medium capitalize">{face.expression}</span>
                            <span className="text-zinc-500 text-xs">{face.expressionProbability}%</span>
                          </div>
                        </div>

                        {/* Landmarks count */}
                        <div className="text-zinc-600 text-xs">
                          {face.landmarks.length} facial landmarks mapped
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No faces found */}
              {!loading && faces.length === 0 && !error && (
                <div className="mt-6 p-6 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-center">
                  <p className="text-yellow-400/80 text-sm">
                    No faces detected in this image. Try a clearer photo with a front-facing subject.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto pt-20">
          <h2 className="text-2xl font-bold text-zinc-100 text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload or Paste", desc: "Drop a photo, click to browse, or paste from clipboard. All processing is local — your images stay private." },
              { step: "02", title: "AI Detection", desc: "TensorFlow.js + face-api.js detect faces, map 68 landmarks, and analyze age, gender, and expression." },
              { step: "03", title: "Get Results", desc: "See bounding boxes, demographics, and landmarks. Compare faces side by side to check if they match." },
            ].map((s, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                <div className="text-5xl font-extrabold text-white/[0.03] mb-4">{s.step}</div>
                <h3 className="font-semibold text-zinc-200 mb-2">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/[0.04] text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[7px] font-bold">FD</span>
          <span className="text-sm font-semibold text-zinc-400">Face<span className="text-blue-400">Detect</span></span>
        </div>
        <p className="text-zinc-600 text-xs">
          Free & open-source. All face detection runs locally in your browser.{" "}
          <a href="https://github.com/shellcat-com/facecheck-pro" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">GitHub</a>
        </p>
      </footer>
    </div>
  )
}
