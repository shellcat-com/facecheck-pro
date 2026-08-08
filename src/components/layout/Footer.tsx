import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                FC
              </div>
              <span className="text-lg font-bold text-surface-100">
                Face<span className="text-brand-400">Check</span>
                <span className="text-surface-400 text-sm font-normal ml-1">.id</span>
              </span>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed">
              Find people online by photo. Search across 1.4+ billion faces indexed from public websites.
            </p>
            <p className="text-surface-500 text-xs mt-4">
              © {new Date().getFullYear()} FaceCheck.ID
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-surface-200 font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/search" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">New Search</Link></li>
              <li><Link href="/pricing" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Pricing & Credits</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Face Search API</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Browser Extension</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Comparison</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-surface-200 font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Search Tips</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-surface-200 font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Terms of Use</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Remove My Photos</Link></li>
              <li><Link href="#" className="text-surface-400 hover:text-surface-200 text-sm transition-colors">Removal Request</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-surface-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-surface-500 text-xs">
            For educational purposes only. All images are indexed from public, readily available web pages.
          </p>
          <p className="text-surface-600 text-xs">
            FaceCheck is neither a publisher nor a consumer reporting agency.
          </p>
        </div>
      </div>
    </footer>
  )
}
