import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function getMatchLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Certain Match", color: "text-green-500" }
  if (score >= 83) return { label: "Confident Match", color: "text-emerald-400" }
  if (score >= 70) return { label: "Uncertain Match", color: "text-yellow-500" }
  if (score >= 50) return { label: "Weak Match", color: "text-orange-500" }
  return { label: "No Match", color: "text-red-500" }
}

export function getMatchColor(score: number): string {
  if (score >= 90) return "bg-green-500"
  if (score >= 83) return "bg-emerald-400"
  if (score >= 70) return "bg-yellow-500"
  if (score >= 50) return "bg-orange-500"
  return "bg-red-500"
}
