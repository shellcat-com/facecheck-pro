"use client"

import { useState, useRef, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  detectFaces,
  drawFaceBoxes,
  compareDescriptors,
  imageUrlToElement,
  type DetectedFace,
} from "@/lib/face-detection"
import { formatFileSize, getConfidenceColor } from "@/lib/utils"
import Link from "next/link"

function UploadPanel({
  label,
  onImage,
  image,
  faces,
  loading,
}: {
  label: string
  onImage: (f: File | string) => void
  image: string | null
  faces: DetectedFace[]
  loading: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onImage(files[0]),
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  return (
    <div>
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{label}</div>
      {!image ? (
        <div {...getRootProps()} className={`drop-zone p-8 text-center ${isDragActive ? "active" : ""}`}>
          <input {...getInputProps()} />
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm text-zinc-400">Drop or click</p>
          <p className="text-zinc-600 text-xs mt-1">Paste also works</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/[0.06]">
          <img ref={imgRef} src={image} className="w-full h-48 object-contain" alt="" />
          <canvas ref={canvasRef} className="face-canvas" />
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          {faces.length > 0 && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-xs text-zinc-300 backdrop-blur-sm">
              {faces.length} face{faces.length > 1 ? "s" : ""}
            </div>
          )}
          <button
            onClick={() => onImage("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-zinc-400 hover:text-zinc-200 text-xs flex items-center justify-center backdrop-blur-sm"
          >
            ×
          </button>
        </div>
      )}
      {faces.length > 0 && (
        <div className="mt-2 space-y-1">
          {faces.map((f, i) => (
            <div key={i} className="text-xs text-zinc-500">
              Face #{i + 1}: {f.gender}, ~{f.age}y, {f.expression} · <span style={{ color: getConfidenceColor(f.box.score) }}>{f.box.score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  const [img1, setImg1] = useState<string | null>(null)
  const [img2, setImg2] = useState<string | null>(null)
  const [faces1, setFaces1] = useState<DetectedFace[]>([])
  const [faces2, setFaces2] = useState<DetectedFace[]>([])
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [result, setResult] = useState<{ score: number; same: boolean } | null>(null)

  const processImage = async (file: File | string, setImage: (s: string) => void, setFaces: (f: DetectedFace[]) => void, setLoading: (l: boolean) => void) => {
    setLoading(true)
    setFaces([])
    setResult(null)
    try {
      let img: HTMLImageElement
      if (typeof file === "string" && file === "") {
        setImage("")
        setFaces([])
        return
      } else if (typeof file === "string") {
        img = await imageUrlToElement(file)
        setImage(file)
      } else {
        const url = URL.createObjectURL(file)
        img = await imageUrlToElement(url)
        setImage(url)
      }
      await new Promise((r) => setTimeout(r, 100))
      const faces = await detectFaces(img)
      setFaces(faces)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = () => {
    if (faces1.length > 0 && faces2.length > 0) {
      const score = compareDescriptors(faces1[0].descriptor!, faces2[0].descriptor!)
      setResult({ score, same: score >= 70 })
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">FD</span>
            <span className="font-bold text-base text-zinc-200">Face<span className="text-blue-400">Detect</span></span>
          </a>
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">← Back</Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100">Face Comparison</h1>
          <p className="text-zinc-500 mt-2 max-w-md mx-auto">Upload two photos to check if they show the same person. Uses facial recognition embeddings.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <UploadPanel label="Photo A" onImage={(f) => processImage(f, setImg1, setFaces1, setLoading1)} image={img1} faces={faces1} loading={loading1} />
          <UploadPanel label="Photo B" onImage={(f) => processImage(f, setImg2, setFaces2, setLoading2)} image={img2} faces={faces2} loading={loading2} />
        </div>

        <div className="text-center">
          <button
            onClick={handleCompare}
            disabled={faces1.length === 0 || faces2.length === 0}
            className="px-8 py-3 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
          >
            Compare Faces
          </button>
        </div>

        {result !== null && (
          <div className="mt-8 text-center animate-scale-in">
            <div className="inline-flex flex-col items-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-5xl font-extrabold mb-2" style={{ color: getConfidenceColor(result.score) }}>
                {result.score}%
              </div>
              <div className="text-lg font-semibold text-zinc-200 mb-1">
                {result.score >= 90 ? "Very likely same person" : result.score >= 80 ? "Likely same person" : result.score >= 70 ? "Possibly same person" : result.score >= 60 ? "Uncertain — could be different" : "Likely different people"}
              </div>
              <p className="text-zinc-500 text-sm max-w-sm">
                {result.score >= 80 ? "High facial similarity detected. The face embeddings are closely matched." : result.score >= 60 ? "Moderate similarity. Use additional evidence to confirm identity." : "Low facial similarity. These are probably different people or the photos need to be clearer."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
