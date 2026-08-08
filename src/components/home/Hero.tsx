"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { Upload, Link, Image, Search, ArrowRight, Shield, Zap, Globe } from "lucide-react"

export function Hero() {
  const router = useRouter()
  const { setSelectedImage, setIsSearching } = useStore()
  const [preview, setPreview] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
        setSelectedImage(result)
      }
      reader.readAsDataURL(file)
    }
  }, [setSelectedImage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPreview(urlInput)
      setSelectedImage(urlInput)
    }
  }

  const handleSearch = () => {
    if (!preview || !agreed) return
    setIsSearching(true)
    router.push("/search")
  }

  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Powered by Advanced AI Face Recognition</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-surface-100 leading-[1.1]">
              Find Anyone Online{" "}
              <span className="gradient-text">by Photo</span>
            </h1>

            <p className="mt-6 text-lg text-surface-400 leading-relaxed max-w-xl">
              Upload a face and instantly search across{" "}
              <span className="text-brand-400 font-semibold">1.4+ billion faces</span>{" "}
              indexed from social media, news sites, mugshot databases, and public websites.
              Verify identities, avoid scammers, and protect your family.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-surface-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-500" />
                Private & Secure
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-400" />
                850M+ Social Profiles
              </span>
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-purple-400" />
                2.5M Searches Daily
              </span>
            </div>

            {/* Media badge */}
            <div className="mt-6 flex items-center gap-3 text-xs text-surface-500">
              <span>As seen on:</span>
              {["FOX", "USA Today", "Market Watch"].map((name) => (
                <span key={name} className="px-2 py-1 rounded bg-surface-800/50 border border-surface-700/50 text-surface-400 font-medium">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Upload Zone */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-2xl blur-xl" />

              <div className="relative bg-surface-900/80 backdrop-blur-xl border border-surface-700/50 rounded-2xl p-6 sm:p-8">
                {!preview ? (
                  <div
                    {...getRootProps()}
                    className={`upload-zone ${isDragActive ? "dragging" : ""}`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-brand-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-surface-200 mb-2">
                        Upload a photo of a person
                      </h3>
                      <p className="text-surface-400 text-sm mb-1">
                        Drag & drop your image here, or click to browse
                      </p>
                      <p className="text-surface-500 text-xs">
                        Supports JPG, PNG, WebP (max 10MB)
                      </p>

                      <div className="flex items-center gap-3 mt-6 w-full">
                        <div className="flex-1 h-px bg-surface-700" />
                        <span className="text-xs text-surface-500 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-surface-700" />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowUrlInput(true)
                        }}
                        className="mt-4 inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Link className="w-4 h-4" />
                        Paste image URL instead
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-xl border-2 border-brand-500/30 shadow-lg shadow-brand-500/10"
                      />
                      <button
                        onClick={() => {
                          setPreview(null)
                          setSelectedImage(null)
                        }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-800 border border-surface-600 text-surface-400 hover:text-surface-200 text-sm flex items-center justify-center transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-surface-400">Photo ready for search</p>
                  </div>
                )}

                {/* URL input */}
                {showUrlInput && !preview && (
                  <div className="mt-4 animate-slide-down">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-600 text-surface-200 text-sm placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
                      />
                      <Button onClick={handleUrlSubmit} size="md" disabled={!urlInput}>
                        Load
                      </Button>
                    </div>
                  </div>
                )}

                {/* Agreement + Search */}
                <div className="mt-6 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-surface-400 group-hover:text-surface-300 transition-colors leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="text-brand-400 hover:underline">Terms of Use</a>{" "}
                      and confirm this search is for a lawful purpose. I will not use FaceCheck
                      for employment, credit, insurance, or tenant screening decisions.
                    </span>
                  </label>

                  <Button
                    variant="primary"
                    size="xl"
                    className="w-full text-lg gap-2"
                    disabled={!preview || !agreed}
                    onClick={handleSearch}
                  >
                    <Search className="w-5 h-5" />
                    Search This Face
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
