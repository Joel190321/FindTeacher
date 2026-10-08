"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore"
import { BookOpen, GraduationCap, Loader2, Star, Users } from "lucide-react"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { FavoriteProfessorButton } from "@/components/favorite-professor-button"
import { ProfessorQuestions } from "@/components/professor-questions"
import { Button } from "@/components/ui/button"
import { getFirebaseDb } from "@/lib/firebase"
import { getRatingValue, RATING_CATEGORIES, toProfessorSlug, type ReviewPost } from "@/lib/reviews"

export default function ProfessorProfilePage() {
  const params = useParams()
  const slug = decodeURIComponent(params.slug as string)
  const [reviews, setReviews] = useState<ReviewPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const db = getFirebaseDb()
        if (!db) return
        const posts = collection(db, "posts")
        const [profileSnapshot, legacySnapshot] = await Promise.all([
          getDocs(query(posts, where("professorSlug", "==", slug), limit(100))),
          getDocs(query(posts, orderBy("createdAt", "desc"), limit(150))),
        ])
        const matches = [...profileSnapshot.docs, ...legacySnapshot.docs]
          .map((review) => ({ id: review.id, ...review.data() }) as ReviewPost)
          .filter((review) => (review.professorSlug || toProfessorSlug(review.professorName)) === slug)
        const uniqueReviews = [...new Map(matches.map((review) => [review.id, review])).values()]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setReviews(uniqueReviews)
      } catch (error) {
        console.error("Error fetching professor profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [slug])

  const stats = useMemo(() => {
    const average = (values: number[]) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0
    return {
      rating: average(reviews.map((review) => review.rating)),
      difficulty: average(reviews.map((review) => review.difficulty || 0).filter(Boolean)),
      categories: Object.fromEntries(RATING_CATEGORIES.map(({ key }) => [key, average(reviews.map((review) => getRatingValue(review, key)))])),
      courses: new Set(reviews.map((review) => `${review.courseCode} · ${review.courseName}`)),
    }
  }, [reviews])

  if (loading) {
    return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
  }

  const professorName = reviews[0]?.professorName || slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="rounded-2xl border border-border bg-background p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><GraduationCap className="h-8 w-8 text-primary" /></div>
              <div><p className="text-sm text-primary">Perfil del profesor</p><h1 className="font-display text-3xl font-bold">{professorName}</h1></div>
            </div>
            <div className="flex flex-wrap gap-3"><FavoriteProfessorButton slug={slug} /><Button asChild><Link href="/create">Escribir una reseña</Link></Button></div>
          </div>

          {reviews.length > 0 ? (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-card p-5"><Star className="h-5 w-5 text-warning" /><p className="mt-2 text-3xl font-bold">{stats.rating}</p><p className="text-sm text-muted-foreground">Promedio general</p></div>
                <div className="rounded-xl bg-card p-5"><Users className="h-5 w-5 text-primary" /><p className="mt-2 text-3xl font-bold">{reviews.length}</p><p className="text-sm text-muted-foreground">{reviews.length === 1 ? "Reseña" : "Reseñas"}</p></div>
                <div className="rounded-xl bg-card p-5"><BookOpen className="h-5 w-5 text-primary" /><p className="mt-2 text-3xl font-bold">{stats.courses.size}</p><p className="text-sm text-muted-foreground">Materias evaluadas</p></div>
              </div>

              <div className="mt-6 grid gap-4 rounded-xl border border-border p-5 sm:grid-cols-2 lg:grid-cols-5">
                {RATING_CATEGORIES.map((category) => <div key={category.key}><p className="text-sm text-muted-foreground">{category.label}</p><p className="mt-1 text-xl font-semibold">{stats.categories[category.key]}/5</p></div>)}
                <div><p className="text-sm text-muted-foreground">Dificultad</p><p className="mt-1 text-xl font-semibold">{stats.difficulty || "—"}/5</p></div>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center"><p className="text-muted-foreground">Todavía no hay reseñas para este profesor.</p></div>
          )}
        </section>

        {reviews.length > 0 && (
          <section className="mt-10"><h2 className="mb-6 text-2xl font-bold">Experiencias de estudiantes</h2><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{reviews.map((review) => <PostCard key={review.id} post={review} />)}</div></section>
        )}
        <ProfessorQuestions professorSlug={slug} professorName={professorName} />
      </main>
    </div>
  )
}
