export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function getConfidenceColor(score: number): string {
  if (score >= 90) return "#22c55e"
  if (score >= 80) return "#3b82f6"
  if (score >= 60) return "#eab308"
  return "#ef4444"
}
