export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center space-y-3">
        <p className="text-zinc-600 text-xs leading-relaxed max-w-3xl mx-auto">
          <strong className="text-zinc-500">DISCLAIMER:</strong> For educational purposes only. All images are indexed from public, readily available web pages only. FaceCheck does not store sensitive or personally identifiable data. FaceCheck&apos;s AI is trained not to index children&apos;s faces. You may not use this website to make decisions about consumer credit, employment, insurance, or tenant screening. FaceCheck does not make any representation about the character, integrity, or criminal history of any person. FaceCheck is not responsible for any content on any 3rd party website it links to. FaceCheck is neither a publisher nor a consumer reporting agency. FaceCheck is a face recognition search engine.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-zinc-500 pt-2">
          <a href="#remove" className="hover:text-zinc-300 transition-colors">Remove my Photos</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">DMCA Takedown Request</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Use</a>
        </div>
        <p className="text-zinc-700 text-xs pt-2">© {new Date().getFullYear()} FaceCheck.ID — Reverse Image Face Search Engine</p>
      </div>
    </footer>
  )
}
