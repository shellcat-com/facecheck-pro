"use client"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs group-hover:scale-105 transition-transform">FC</span>
          <span className="font-bold text-zinc-200">Face<span className="text-blue-400">Check</span><span className="text-zinc-500 text-sm font-normal ml-0.5">.id</span></span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/search" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04]">New Search</Link>
          <a href="#faq" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">FAQ</a>
          <a href="#tips" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">Tips</a>
          <a href="#remove" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.04] hidden sm:inline">Remove Photos</a>
        </div>
      </div>
    </nav>
  )
}
