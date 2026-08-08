export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-surface-400 text-sm">Loading FaceCheck...</p>
      </div>
    </div>
  )
}
