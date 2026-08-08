import type { Metadata } from "next"
import "./globals.css"
export const metadata: Metadata = {
  title: "FaceCheck.id — Find People Online by Photo | Reverse Face Search Engine",
  description: "Upload a photo and find someone online instantly. Search across 1.4+ billion faces indexed from social media, news, mugshots, and public websites. Free.",
  openGraph: { title: "FaceCheck.id — Find People Online by Photo", description: "Upload a photo and find someone online instantly with AI.", type: "website" },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="dark"><body className="min-h-screen bg-[#0a0a0c] text-zinc-200 antialiased">{children}</body></html>
}
