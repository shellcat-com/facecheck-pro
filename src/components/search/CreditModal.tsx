"use client"

import { useStore } from "@/store/useStore"
import { Button } from "@/components/ui/Button"
import { CREDIT_PACKAGES } from "@/lib/mock-data"
import { X, Check, Zap, Star } from "lucide-react"

export function CreditModal() {
  const { showCreditModal, setShowCreditModal } = useStore()

  if (!showCreditModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowCreditModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface-900/95 backdrop-blur-xl border-b border-surface-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-surface-100">Buy Credits</h2>
            <p className="text-surface-400 text-sm mt-0.5">Each search costs 1 credit. Credits never expire.</p>
          </div>
          <button
            onClick={() => setShowCreditModal(false)}
            className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Packages */}
        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02] ${
                pkg.popular
                  ? "border-brand-500/50 bg-brand-500/5 shadow-lg shadow-brand-500/10"
                  : "border-surface-700 bg-surface-800/50 hover:border-surface-600"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Most Popular
                </div>
              )}

              <div className="text-center">
                <div className="text-3xl font-bold text-surface-100 mt-2">
                  {pkg.credits.toLocaleString()}
                </div>
                <div className="text-surface-400 text-sm mb-4">credits</div>

                <div className="text-3xl font-extrabold text-surface-100">
                  ${pkg.price}
                </div>
                {pkg.discount && (
                  <div className="mt-1 text-xs text-green-400 font-medium">
                    Save {pkg.discount}%
                  </div>
                )}
                <div className="text-surface-500 text-xs mt-1">
                  ${(pkg.price / pkg.credits).toFixed(3)} per credit
                </div>

                <Button
                  variant={pkg.popular ? "primary" : "outline"}
                  size="lg"
                  className="w-full mt-4"
                >
                  {pkg.popular ? <Zap className="w-4 h-4 mr-1.5" /> : null}
                  Buy {pkg.credits} Credits
                </Button>
              </div>

              <ul className="mt-4 space-y-2">
                {[
                  "Instant delivery",
                  "Never expires",
                  "Premium support",
                  ...(pkg.popular ? ["Priority processing", "API access included"] : []),
                  ...(pkg.id === "pro" || pkg.id === "unlimited" ? ["Bulk search", "Export results"] : []),
                  ...(pkg.id === "unlimited" ? ["Enterprise SLA", "Dedicated account manager"] : []),
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-surface-400">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
