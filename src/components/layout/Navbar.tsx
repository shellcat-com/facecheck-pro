"use client"

import { useState } from "react"
import Link from "next/link"
import { useStore } from "@/store/useStore"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { Menu, X, Sun, Moon, Search, CreditCard, User, LogOut } from "lucide-react"

export function Navbar() {
  const { user, darkMode, toggleDarkMode } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
              FC
            </div>
            <span className="text-lg font-bold text-surface-100">
              Face<span className="text-brand-400">Check</span>
              <span className="text-surface-400 text-sm font-normal ml-1">.id</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/search">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4 mr-1.5" />
                New Search
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Pricing
              </Button>
            </Link>
            {user?.credits !== undefined && (
              <span className="text-xs text-surface-400 bg-surface-800 px-3 py-1.5 rounded-full border border-surface-700 ml-2">
                {user.credits} credits
              </span>
            )}
            <button
              onClick={toggleDarkMode}
              className="ml-2 p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    <User className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="primary" size="sm">Buy Credits</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-surface-400 hover:text-surface-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-800 py-4 space-y-2 animate-slide-down">
            <Link href="/search" className="block px-3 py-2 text-surface-300 hover:text-surface-100 rounded-lg hover:bg-surface-800/50" onClick={() => setMobileOpen(false)}>
              🔎 New Search
            </Link>
            <Link href="/pricing" className="block px-3 py-2 text-surface-300 hover:text-surface-100 rounded-lg hover:bg-surface-800/50" onClick={() => setMobileOpen(false)}>
              💳 Pricing
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-surface-300 hover:text-surface-100 rounded-lg hover:bg-surface-800/50" onClick={() => setMobileOpen(false)}>
                  📊 Dashboard
                </Link>
                <Link href="/pricing" className="block px-3 py-2 text-brand-400 font-medium" onClick={() => setMobileOpen(false)}>
                  Buy Credits ({user.credits} left)
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-surface-300 hover:text-surface-100 rounded-lg hover:bg-surface-800/50" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
                <Link href="/signup" className="block px-3 py-2 text-brand-400 font-medium" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
