/**
 * FaceCheck Pro — Search API Proxy
 * Forwards image uploads to the Python backend for real face embedding + vector search.
 *
 * The Python backend (FastAPI on port 8000) handles:
 * 1. Face detection (SCRFD)
 * 2. Face embedding (ArcFace 512-dim)
 * 3. Vector similarity search (ChromaDB)
 * 4. Returns matches from: FBI Wanted, Interpol, JailBase mugshots,
 *    scammer databases, news (GDELT), and YouTube thumbnails
 *
 * Falls back gracefully if the Python backend is not running.
 */

import { NextResponse } from "next/server"

const BACKEND_URL = process.env.FACE_API_URL || "http://localhost:8000"

export async function POST(req: Request) {
  try {
    // Try to proxy to Python backend first
    let formData: FormData | null = null

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      // JSON request with imageUrl
      const body = await req.json()
      const { imageUrl } = body

      if (!imageUrl) {
        return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 })
      }

      // Try Python backend with image URL
      try {
        formData = new FormData()
        formData.append("image_url", imageUrl)

        const res = await fetch(`${BACKEND_URL}/api/search-url`, {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(60000),
        })

        if (res.ok) {
          const data = await res.json()
          return NextResponse.json(data)
        }
      } catch {
        console.log("[Search] Python backend not available for URL search")
      }

      // Fallback: external search engines
      return getFallbackResponse(imageUrl)

    } else if (contentType.includes("multipart/form-data")) {
      // Form data request with file upload
      try {
        const formData = await req.formData()

        const res = await fetch(`${BACKEND_URL}/api/search`, {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(60000),
        })

        if (res.ok) {
          const data = await res.json()
          return NextResponse.json(data)
        }
      } catch {
        console.log("[Search] Python backend not available for file search")
      }

      // Fallback: try to extract image from form data
      const formData = await req.formData()
      const file = formData.get("file") as File | null

      if (file) {
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString("base64")
        const dataUrl = `data:${file.type};base64,${base64}`
        return getFallbackResponse(dataUrl)
      }

      return NextResponse.json(
        { error: "Python backend unavailable and no file found" },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 })

  } catch (err) {
    console.error("[Search] Error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

function getFallbackResponse(imageUrl: string) {
  return NextResponse.json({
    matches: [],
    query_face: {
      detected: false,
      message: "Python backend not available. Start it with: cd backend && python -m uvicorn backend.api.main:app --port 8000",
    },
    external_engines: [
      {
        name: "Google Lens",
        url: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`,
        icon: "🔍",
        description: "Most comprehensive — searches Google's entire image index",
        category: "other",
      },
      {
        name: "Yandex Images",
        url: `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imageUrl)}`,
        icon: "🌐",
        description: "Excellent for faces from Eastern Europe, Asia, and social media",
        category: "other",
      },
      {
        name: "Bing Visual Search",
        url: `https://www.bing.com/images/search?q=imgurl:${encodeURIComponent(imageUrl)}&view=detailv2&iss=sbi`,
        icon: "🔎",
        description: "Microsoft's visual search — finds exact and similar images",
        category: "other",
      },
      {
        name: "TinEye",
        url: `https://tineye.com/search?url=${encodeURIComponent(imageUrl)}`,
        icon: "🎯",
        description: "Finds where this exact image appears, including edited versions",
        category: "other",
      },
      {
        name: "PimEyes",
        url: `https://pimeyes.com/en`,
        icon: "👁️",
        description: "Dedicated face search engine — upload this photo for face-specific results",
        category: "other",
      },
      {
        name: "Search4Faces",
        url: `https://search4faces.com/`,
        icon: "👤",
        description: "Search social media profiles (VK, TikTok, ClubHouse) for this face",
        category: "social",
      },
    ],
    total_matches: 6,
    searched_database: 0,
    backend_available: false,
  })
}
