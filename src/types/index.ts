export interface SearchResult {
  id: string
  imageUrl: string
  sourceUrl: string
  sourceName: string
  title: string
  matchScore: number
  category: "social" | "news" | "mugshot" | "video" | "scammer" | "other"
  thumbnailUrl: string
  description?: string
  foundAt: Date
}

export interface SearchHistory {
  id: string
  queryImageUrl: string
  searchedAt: Date
  resultCount: number
  topMatch?: SearchResult
}

export interface User {
  id: string
  name: string
  email: string
  credits: number
  avatarUrl?: string
  searchesThisMonth: number
  totalSearches: number
}

export interface CreditPackage {
  id: string
  credits: number
  price: number
  popular?: boolean
  discount?: number
}

export type SearchCategory = "all" | "social" | "scammer" | "news" | "mugshot" | "video"
