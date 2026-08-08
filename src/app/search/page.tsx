"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import { Navbar } from "@/components/layout/Navbar"
import { ImageUploader } from "@/components/search/ImageUploader"
import { SearchResults } from "@/components/search/SearchResults"
import { CreditModal } from "@/components/search/CreditModal"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function SearchPage() {
  const { selectedImage, isSearching, setIsSearching, searchResults, setSearchResults } = useStore()
  const router = useRouter()

  // Simulate search on mount if there's a selected image
  useEffect(() => {
    if (!selectedImage) return

    let cancelled = false
    const runSearch = async () => {
      setIsSearching(true)
      // Simulate face detection + search delay
      await new Promise((resolve) => setTimeout(resolve, 2500))

      if (cancelled) return

      // Simulate face being detected
      const { MOCK_RESULTS } = await import("@/lib/mock-data")
      if (!cancelled) {
        setSearchResults(MOCK_RESULTS)
        setIsSearching(false)
      }
    }

    runSearch()
    return () => { cancelled = true }
  }, [selectedImage, setIsSearching, setSearchResults])

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-surface-400 hover:text-surface-200 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Search target"
                    className="w-32 h-32 object-cover rounded-full border-4 border-brand-500/30 mb-8 animate-pulse-glow"
                  />
                )}
                <Loader2 className="w-12 h-12 text-brand-400 animate-spin absolute -bottom-2 -right-2" />
              </div>
              <h2 className="text-2xl font-bold text-surface-100 mb-2">Searching...</h2>
              <p className="text-surface-400 text-sm max-w-md text-center">
                Detecting faces and searching across 1.4+ billion indexed faces from social media,
                news sites, mugshot databases, and public websites.
              </p>
              <div className="mt-8 w-64 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full animate-shimmer shimmer-bg" />
              </div>
            </div>
          ) : selectedImage ? (
            <>
              {/* Search target + controls */}
              <div className="flex flex-col lg:flex-row gap-8 mb-10">
                <div className="lg:w-80 shrink-0">
                  <ImageUploader />
                </div>
                <div className="flex-1">
                  <SearchResults />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 rounded-full bg-surface-800 flex items-center justify-center mb-6">
                <span className="text-4xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold text-surface-100 mb-2">Start a New Search</h2>
              <p className="text-surface-400 text-sm mb-8 max-w-md text-center">
                Upload a photo of a person's face to search across our database of indexed public images.
              </p>
              <div className="w-full max-w-lg">
                <ImageUploader />
              </div>
            </div>
          )}
        </div>
      </main>

      <CreditModal />
    </div>
  )
}
