"use client"

import type React from "react"
import { getFirebaseDb } from "@/lib/firebase"
import { useEffect, useState, Suspense, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, SlidersHorizontal } from "lucide-react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const CAREERS = [
  "Medicina",
  "Odontología",
  "Enfermería",
  "Administración de Empresas",
  "Contaduría Pública",
  "Mercadeo",
  "Derecho",
  "Arquitectura",
  "Ingeniería Civil",
  "Ingeniería Industrial",
  "Ingeniería en Sistemas Computacionales",
  "Comunicación Social",
] as const

interface Post {
  id: string
  courseCode: string
  courseName: string
  professorName: string
  career?: string
  rating: number
  review: string
  authorName: string
  authorPhoto: string
  createdAt: string
  likes: number
  commentsCount: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterCareer, setFilterCareer] = useState<string>("all")

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const db = getFirebaseDb()
        if (!db) {
          console.error("Firestore not initialized")
          setLoading(false)
          return
        }

        const postsRef = collection(db, "posts")
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(30))
        const querySnapshot = await getDocs(q)

        const postsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[]

        setPosts(postsData)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    let filtered = posts

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.courseCode.toLowerCase().includes(query) ||
          post.courseName.toLowerCase().includes(query) ||
          post.professorName.toLowerCase().includes(query),
      )
    }

    if (filterRating !== null) {
      filtered = filtered.filter((post) => post.rating === filterRating)
    }

    if (filterCareer !== "all") {
      filtered = filtered.filter((post) => post.career === filterCareer)
    }

    return filtered
  }, [debouncedSearchQuery, filterRating, filterCareer, posts])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
  }, [])

  const handleRatingFilter = useCallback((rating: number | null) => {
    setFilterRating(rating)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance md:text-4xl">Explorar Reseñas</h1>
          <p className="mt-2 text-muted-foreground">Busca por código de materia, nombre o profesor</p>
        </div>

        <div className="mb-8 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por código, materia o profesor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </form>

          <div className="rounded-xl border-2 border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">Filtros</span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-foreground">Carrera</Label>
                <Select value={filterCareer} onValueChange={setFilterCareer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las carreras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las carreras</SelectItem>
                    {CAREERS.map((career) => (
                      <SelectItem key={career} value={career}>
                        {career}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-foreground">Calificación</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={filterRating === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRatingFilter(null)}
                    className="font-medium"
                  >
                    Todas
                  </Button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <Button
                      key={rating}
                      variant={filterRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRatingFilter(rating)}
                      className="font-medium"
                    >
                      {rating} ⭐
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || filterCareer !== "all" || filterRating !== null
                ? "No se encontraron resultados para tu búsqueda"
                : "No hay publicaciones aún"}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {filteredPosts.length} {filteredPosts.length === 1 ? "resultado" : "resultados"}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Header />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  )
}
