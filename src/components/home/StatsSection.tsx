"use client"

import { useEffect, useState, useRef } from "react"
import { STATS } from "@/lib/mock-data"

function Counter({ value, label }: { value: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const numericValue = parseInt(value.replace(/[^0-9.]/g, ""))
  const suffix = value.replace(/[0-9.]/g, "")

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const duration = 2000
          const increment = numericValue / (duration / 16)

          const timer = setInterval(() => {
            start += increment
            if (start >= numericValue) {
              setCount(numericValue)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)

          return () => clearInterval(timer)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [numericValue])

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-bold gradient-text">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-surface-400 text-sm mt-1">{label}</div>
    </div>
  )
}

export function StatsSection() {
  return (
    <section className="py-20 border-t border-b border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <Counter key={i} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
