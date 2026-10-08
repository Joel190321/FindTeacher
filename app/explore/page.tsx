"use client"

import type React from "react"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFirebaseDb } from "@/lib/firebase"
import { CAREERS, normalizeText, type ReviewPost } from "@/lib/reviews"

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [delay, value])
  return debouncedValue
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<ReviewPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [minimumRating, setMinimumRating] = useState("all")
  const [maximumDifficulty, setMaximumDifficulty] = useState("all")
  const [career, setCareer] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const debouncedSearch = useDebounce(searchQuery, 250)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const db = getFirebaseDb()
        if (!db) return
        const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100)))
        setPosts(snapshot.docs.map((post) => ({ id: post.id, ...post.data() }) as ReviewPost))
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    const term = normalizeText(debouncedSearch)
    const result = posts.filter((post) => {
      const searchable = normalizeText(`${post.courseCode} ${post.courseName} ${post.professorName} ${post.career || ""} ${post.academicTerm || ""}`)
      return (!term || searchable.includes(term))
        && (career === "all" || post.career === career)
        && (minimumRating === "all" || post.rating >= Number(minimumRating))
        && (maximumDifficulty === "all" || !post.difficulty || post.difficulty <= Number(maximumDifficulty))
    })

    return [...result].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "useful") return (b.likes || 0) - (a.likes || 0)
      if (sortBy === "difficulty") return (a.difficulty || 0) - (b.difficulty || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [career, debouncedSearch, maximumDifficulty, minimumRating, posts, sortBy])

  const resetFilters = useCallback(() => {
    setSearchQuery("")
    setMinimumRating("all")
    setMaximumDifficulty("all")
    setCareer("all")
    setSortBy("recent")
  }, [])

  const hasFilters = searchQuery || minimumRating !== "all" || maximumDifficulty !== "all" || career !== "all" || sortBy !== "recent"

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8"><h1 className="text-3xl font-bold md:text-4xl">Explorar reseñas</h1><p className="mt-2 text-muted-foreground">Encuentra experiencias por profesor, materia, carrera o período.</p></div>

        <div className="mb-8 space-y-5">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Profesor, materia, código, carrera o período..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11 pl-10" /></div>
          <div className="rounded-xl border-2 border-border bg-card/50 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" /><span className="font-semibold">Filtros avanzados</span></div>{hasFilters && <Button variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" />Limpiar</Button>}</div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Carrera" value={career} onChange={setCareer} options={[{ value: "all", label: "Todas las carreras" }, ...CAREERS.map((item) => ({ value: item, label: item }))]} />
              <FilterSelect label="Calificación mínima" value={minimumRating} onChange={setMinimumRating} options={[{ value: "all", label: "Cualquier calificación" }, ...[5, 4, 3, 2].map((value) => ({ value: String(value), label: `${value}+ estrellas` }))]} />
              <FilterSelect label="Dificultad máxima" value={maximumDifficulty} onChange={setMaximumDifficulty} options={[{ value: "all", label: "Cualquier dificultad" }, ...[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `Hasta ${value}/5` }))]} />
              <FilterSelect label="Ordenar por" value={sortBy} onChange={setSortBy} options={[{ value: "recent", label: "Más recientes" }, { value: "rating", label: "Mejor valoración" }, { value: "useful", label: "Más útiles" }, { value: "difficulty", label: "Menor dificultad" }]} />
            </div>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center"><p className="text-muted-foreground">No encontramos reseñas con esos criterios.</p>{hasFilters && <Button variant="outline" onClick={resetFilters} className="mt-4">Limpiar filtros</Button>}</div>
        ) : <><p className="mb-6 text-sm text-muted-foreground">{filteredPosts.length} {filteredPosts.length === 1 ? "resultado" : "resultados"}</p><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}</div></>}
      </main>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}

export default function ExplorePage() {
  return <Suspense fallback={<div className="min-h-screen"><Header /><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>}><ExploreContent /></Suspense>
}
