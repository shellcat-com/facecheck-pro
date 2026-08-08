import { FEATURES } from "@/lib/mock-data"

export function FeatureSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
            Why Use FaceCheck?
          </h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            Our AI-powered facial recognition helps you verify identities, avoid scams, and stay safe online.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="group relative bg-surface-900/50 border border-surface-800 rounded-2xl p-6 hover:border-brand-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-surface-200 mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
