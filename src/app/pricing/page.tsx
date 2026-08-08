"use client"

import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/Button"
import { CREDIT_PACKAGES } from "@/lib/mock-data"
import { Check, Zap, Star, Shield, Infinity, Headphones } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Simple Credit System
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-surface-100 mb-4">
              Buy Face Search Credits
            </h1>
            <p className="text-surface-400 text-lg max-w-2xl mx-auto">
              1 search = 1 credit. Credits never expire. Unused credits roll over.
              All plans include face detection, match scoring, and source links.
            </p>
          </div>

          {/* Packages */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-6 border transition-all duration-300 card-hover ${
                  pkg.popular
                    ? "border-brand-500/50 bg-brand-500/5 shadow-xl shadow-brand-500/10"
                    : "border-surface-700 bg-surface-900/50"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 fill-white" />
                    Most Popular
                  </div>
                )}

                <div className="text-center">
                  <div className="text-4xl font-extrabold text-surface-100 mt-2">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <div className="text-surface-400 text-sm mb-5">credits</div>

                  <div className="text-4xl font-extrabold gradient-text-blue">
                    ${pkg.price}
                  </div>
                  {pkg.discount && (
                    <div className="mt-1.5 text-sm text-green-400 font-semibold">
                      Save {pkg.discount}%
                    </div>
                  )}
                  <div className="text-surface-500 text-xs mt-1">
                    ${(pkg.price / pkg.credits).toFixed(3)} per credit
                  </div>

                  <Button
                    variant={pkg.popular ? "primary" : "outline"}
                    size="lg"
                    className="w-full mt-5"
                  >
                    {pkg.popular && <Zap className="w-4 h-4 mr-1.5" />}
                    Get Started
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-surface-800 space-y-3">
                  {[
                    `${pkg.credits} face searches`,
                    "Never expires",
                    "Full match scores",
                    "All source links",
                    ...(pkg.popular ? ["Priority processing", "API access", "Bulk search"] : []),
                    ...(pkg.id === "pro" || pkg.id === "unlimited" ? ["Export to CSV", "Advanced filters"] : []),
                    ...(pkg.id === "unlimited" ? ["Enterprise SLA", "Dedicated support"] : []),
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-surface-400">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-surface-100 mb-3">
              Need Enterprise Access?
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto mb-6">
              Custom credit volumes, API access, dedicated support, and SLAs for organizations that need face search at scale.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2 text-surface-400">
                <Infinity className="w-4 h-4 text-brand-400" /> Unlimited API calls
              </div>
              <div className="flex items-center gap-2 text-surface-400">
                <Shield className="w-4 h-4 text-green-400" /> Enterprise SLA
              </div>
              <div className="flex items-center gap-2 text-surface-400">
                <Headphones className="w-4 h-4 text-purple-400" /> Dedicated support
              </div>
            </div>
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </div>

          {/* FAQ quick */}
          <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { q: "Do credits expire?", a: "No. Credits never expire. Buy now, use them whenever you need." },
              { q: "What can I search?", a: "Upload any face photo. We search across public social media, news, and database sources." },
              { q: "How accurate is it?", a: "Our AI achieves 99.7% accuracy on clear front-facing photos. Quality degrades with blurry or angled shots." },
              { q: "Is it private?", a: "Your searches are private. Uploaded photos are deleted after processing. We never share your data." },
              { q: "Can I get a refund?", a: "Yes, if you're not satisfied within 30 days of purchase. Contact support for assistance." },
              { q: "How many photos per search?", a: "Upload up to 5 photos of the same person for better accuracy. Still counts as 1 search." },
            ].map((faq, i) => (
              <div key={i} className="bg-surface-900/50 border border-surface-800 rounded-xl p-5">
                <h3 className="text-surface-200 font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
