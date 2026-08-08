"use client"

import { useStore } from "@/store/useStore"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/Button"
import { formatRelativeTime } from "@/lib/utils"
import { Search, Clock, CreditCard, History, Settings, LogOut, TrendingUp, Activity, BarChart3, Image, Users } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, searchHistory } = useStore()

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      <main className="pt-20">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-5rem)] bg-surface-900/50 border-r border-surface-800 p-4 gap-1">
            <div className="px-3 py-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-200">{user?.name}</div>
                  <div className="text-xs text-surface-500">{user?.email}</div>
                </div>
              </div>
            </div>

            {[
              { icon: BarChart3, label: "Overview", active: true },
              { icon: History, label: "Search History", active: false },
              { icon: CreditCard, label: "Credits & Billing", active: false },
              { icon: Settings, label: "Settings", active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  item.active
                    ? "bg-brand-500/10 text-brand-400 font-medium"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}

            <div className="mt-auto pt-4 border-t border-surface-800">
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 p-6 lg:p-10">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { icon: CreditCard, label: "Credits Remaining", value: user?.credits || 0, color: "text-brand-400", bg: "bg-brand-500/10" },
                { icon: Search, label: "Searches This Month", value: user?.searchesThisMonth || 0, color: "text-green-400", bg: "bg-green-500/10" },
                { icon: Activity, label: "Total Searches", value: user?.totalSearches || 0, color: "text-purple-400", bg: "bg-purple-500/10" },
                { icon: TrendingUp, label: "Match Accuracy Avg", value: "94.2%", color: "text-yellow-400", bg: "bg-yellow-500/10" },
              ].map((stat, i) => (
                <div key={i} className="bg-surface-900/50 border border-surface-800 rounded-xl p-5 card-hover">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-surface-100">{stat.value}</div>
                  <div className="text-sm text-surface-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/search">
                <Button variant="primary" size="lg">
                  <Search className="w-4 h-4 mr-2" />
                  New Face Search
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Buy More Credits
                </Button>
              </Link>
            </div>

            {/* Search history */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-surface-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-surface-400" />
                  Recent Searches
                </h2>
                <button className="text-sm text-brand-400 hover:text-brand-300">View All</button>
              </div>

              {searchHistory.length === 0 ? (
                <div className="text-center py-16 bg-surface-900/50 border border-surface-800 rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-surface-500" />
                  </div>
                  <h3 className="text-lg font-medium text-surface-300 mb-2">No searches yet</h3>
                  <p className="text-surface-500 text-sm mb-6">Your search history will appear here.</p>
                  <Link href="/search">
                    <Button variant="primary" size="md">Start Your First Search</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-surface-900/50 border border-surface-800 rounded-xl hover:border-surface-700 transition-colors"
                    >
                      <img
                        src={item.queryImageUrl}
                        alt="Search query"
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-surface-200">
                          {item.resultCount} results found
                        </div>
                        <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(new Date(item.searchedAt))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Results
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
