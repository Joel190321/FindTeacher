"use client"

import type React from "react"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"

function HeroComponent() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (searchQuery.trim()) {
        router.push(`/explore?q=${encodeURIComponent(searchQuery)}`)
      }
    },
    [searchQuery, router],
  )

  const handleQuickSearch = useCallback(
    (query: string) => {
      router.push(`/explore?q=${query}`)
    },
    [router],
  )

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface to-background py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl lg:text-7xl">
            Encuentra el <span className="text-primary">profesor perfecto</span> para tu materia
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty md:text-xl">
            Descubre reseñas reales de estudiantes. Comparte tu experiencia. Toma mejores decisiones académicas.
          </p>

          <form onSubmit={handleSearch} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por código de materia o nombre del profesor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-primary hover:bg-primary-hover">
              Buscar
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Populares:</span>
            <Button variant="outline" size="sm" onClick={() => handleQuickSearch("MAT101")}>
              MAT101
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSearch("FIS201")}>
              FIS201
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSearch("PROG301")}>
              PROG301
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
    </section>
  )
}

export const Hero = memo(HeroComponent)
