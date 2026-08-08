"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { Upload, Link as LinkIcon, X } from "lucide-react"

export function ImageUploader() {
  const { selectedImage, setSelectedImage } = useStore()
  const [urlInput, setUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
      }
      reader.readAsDataURL(file)
    }
  }, [setSelectedImage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="relative">
      {!selectedImage ? (
        <div {...getRootProps()} className={`upload-zone ${isDragActive ? "dragging" : ""}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-5">
              <Upload className="w-10 h-10 text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold text-surface-200 mb-2">
              Upload a Face Photo
            </h3>
            <p className="text-surface-400 text-sm max-w-md">
              Drag & drop a photo here, or click to browse. Use a clear front-facing photo for best results.
            </p>
            <p className="text-surface-500 text-xs mt-2">JPG, PNG, WebP up to 10MB</p>

            <div className="flex items-center gap-3 mt-6 w-full max-w-xs">
              <div className="flex-1 h-px bg-surface-700" />
              <span className="text-xs text-surface-500">or</span>
              <div className="flex-1 h-px bg-surface-700" />
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowUrlInput(true) }}
              className="mt-4 text-sm text-brand-400 hover:text-brand-300 inline-flex items-center gap-1.5"
            >
              <LinkIcon className="w-4 h-4" />
              Paste image URL
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-surface-900/80 rounded-2xl border border-surface-700/50">
          <div className="relative inline-block">
            <img
              src={selectedImage}
              alt="Search target"
              className="w-56 h-56 object-cover rounded-2xl border-2 border-brand-500/30 shadow-xl shadow-brand-500/10"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-800 border border-surface-600 text-surface-400 hover:text-surface-100 hover:border-surface-500 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-sm text-surface-400">Click Search to find this face online</p>
        </div>
      )}

      {/* URL input modal */}
      {showUrlInput && !selectedImage && (
        <div className="mt-4 p-4 bg-surface-800/50 rounded-xl border border-surface-700 animate-slide-down">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-600 text-surface-200 text-sm placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <Button onClick={() => { if (urlInput) { setSelectedImage(urlInput); setShowUrlInput(false) } }} size="md" disabled={!urlInput}>
              Load
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowUrlInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
