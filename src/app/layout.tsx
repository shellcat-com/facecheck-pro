import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "FaceDetect — Free AI Face Detection & Recognition",
  description: "Detect faces, analyze age & gender, read expressions, and compare faces. All processing happens locally in your browser — your images never leave your device.",
  openGraph: {
    title: "FaceDetect — Free AI Face Detection",
    description: "Privacy-first face detection running entirely in your browser.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0b] text-zinc-200 antialiased">{children}</body>
    </html>
  )
}
