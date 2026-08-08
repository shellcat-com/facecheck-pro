import { Navbar } from "@/components/layout/Navbar"
import { Hero } from "@/components/home/Hero"
import { FeatureSection } from "@/components/home/FeatureSection"
import { StatsSection } from "@/components/home/StatsSection"
import { Footer } from "@/components/layout/Footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <Hero />
      <StatsSection />
      <FeatureSection />

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              How It Works
            </h2>
            <p className="text-surface-400 text-lg max-w-2xl mx-auto">
              Three simple steps to find anyone online by their photo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload a Face Photo",
                desc: "Upload a clear front-facing photo of the person. Drag & drop, paste a URL, or click to browse. We support JPG, PNG, and WebP formats.",
                icon: "📸",
              },
              {
                step: "02",
                title: "AI Analyzes the Face",
                desc: "Our AI instantly detects facial features, landmarks, and creates a unique faceprint. Then it searches across 1.4+ billion indexed faces from public sources.",
                icon: "🤖",
              },
              {
                step: "03",
                title: "Get Detailed Results",
                desc: "Review matched profiles with confidence scores, source links, and categories. Filter by social media, news, mugshots, and more.",
                icon: "📊",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative text-center p-8 bg-surface-900/30 border border-surface-800/50 rounded-2xl hover:border-surface-700 transition-colors"
              >
                <div className="absolute -top-5 left-8 text-6xl font-extrabold text-surface-800 select-none">
                  {item.step}
                </div>
                <div className="text-5xl mb-5 mt-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-surface-200 mb-3">{item.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-brand-600/20 to-purple-600/20 border border-brand-500/20 rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
                Ready to Find Anyone Online?
              </h2>
              <p className="text-surface-400 text-lg mb-8 max-w-lg mx-auto">
                Start your first search now. Get 5 free trial credits when you create an account.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-lg hover:from-brand-500 hover:to-brand-400 shadow-xl shadow-brand-500/30 transition-all hover:scale-105"
                >
                  Start Searching Free
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-surface-600 text-surface-200 font-bold text-lg hover:border-surface-400 transition-all"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
