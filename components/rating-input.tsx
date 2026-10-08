"use client"

import { Star } from "lucide-react"

interface RatingInputProps {
  label: string
  description?: string
  value: number
  onChange: (value: number) => void
}

export function RatingInput({ label, description, value, onChange }: RatingInputProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: 5 }).map((_, index) => {
          const rating = index + 1
          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={value === rating}
              aria-label={`${rating} de 5`}
              onClick={() => onChange(rating)}
              className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star className={`h-5 w-5 ${rating <= value ? "fill-warning text-warning" : "text-muted"}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
