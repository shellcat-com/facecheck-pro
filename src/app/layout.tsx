import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "FaceCheck.id — Find People Online by Photo | Reverse Face Search",
  description: "Upload a face photo and find someone online instantly. Search across 1.4+ billion faces indexed from social media, news, mugshots, and public websites. 100% free.",
  keywords: ["face search", "reverse image search", "facial recognition", "find people by photo", "face lookup", "identity search"],
  openGraph: { title: "FaceCheck.id — Find People Online by Photo", description: "Upload a photo and find someone online instantly with AI face recognition. Free.", type: "website" },
  twitter: { card: "summary_large_image", title: "FaceCheck.id — Find People Online by Photo", description: "Upload a photo and find someone online instantly with AI face recognition. Free." },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0c] text-zinc-200 antialiased">{children}</body>
    </html>
  )
}
