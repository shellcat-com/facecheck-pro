import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "FaceCheck.id — Find People Online by Photo | AI Face Recognition",
  description:
    "Upload a face photo and instantly search across 1.4+ billion faces indexed from social media, news, mugshot databases, and public websites. Verify identities, avoid scammers, and protect your family.",
  keywords: [
    "face search",
    "reverse image search",
    "facial recognition",
    "find people online",
    "face recognition search",
    "identity verification",
    "catfish detection",
    "scammer check",
    "photo search",
  ],
  openGraph: {
    title: "FaceCheck.id — Find People Online by Photo",
    description: "Upload a photo and find someone online instantly with AI face recognition.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FaceCheck.id — Find People Online by Photo",
    description: "Upload a photo and find someone online instantly with AI face recognition.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-950 text-surface-100 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
