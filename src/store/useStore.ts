import { create } from "zustand"
import type { SearchResult, SearchHistory, User, SearchCategory } from "@/types"

interface AppStore {
  // User
  user: User | null
  setUser: (user: User | null) => void

  // Search
  isSearching: boolean
  searchResults: SearchResult[]
  selectedImage: string | null
  activeCategory: SearchCategory
  setIsSearching: (v: boolean) => void
  setSearchResults: (r: SearchResult[]) => void
  setSelectedImage: (img: string | null) => void
  setActiveCategory: (c: SearchCategory) => void

  // History
  searchHistory: SearchHistory[]
  addToHistory: (h: SearchHistory) => void
  clearHistory: () => void

  // Credit display
  showCreditModal: boolean
  setShowCreditModal: (v: boolean) => void

  // Theme
  darkMode: boolean
  toggleDarkMode: () => void
}

export const useStore = create<AppStore>((set) => ({
  user: {
    id: "1",
    name: "Alex Morgan",
    email: "alex@example.com",
    credits: 25,
    searchesThisMonth: 12,
    totalSearches: 89,
  },
  setUser: (user) => set({ user }),

  isSearching: false,
  searchResults: [],
  selectedImage: null,
  activeCategory: "all",
  setIsSearching: (isSearching) => set({ isSearching }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSelectedImage: (selectedImage) => set({ selectedImage }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  searchHistory: [],
  addToHistory: (history) =>
    set((state) => ({
      searchHistory: [history, ...state.searchHistory].slice(0, 50),
    })),
  clearHistory: () => set({ searchHistory: [] }),

  showCreditModal: false,
  setShowCreditModal: (showCreditModal) => set({ showCreditModal }),

  darkMode: true,
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newMode)
      }
      return { darkMode: newMode }
    }),
}))
