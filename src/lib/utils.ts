export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}
export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d)
}
export function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}
export function matchLabel(s: number) {
  if (s >= 90) return { text: "Certain Match", color: "#22c55e" }
  if (s >= 83) return { text: "Confident Match", color: "#4ade80" }
  if (s >= 70) return { text: "Uncertain Match", color: "#facc15" }
  if (s >= 50) return { text: "Weak Match", color: "#fb923c" }
  return { text: "No Match", color: "#ef4444" }
}
