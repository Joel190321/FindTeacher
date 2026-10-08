"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore"
import { Heart, Loader2, Star } from "lucide-react"
import { Header } from "@/components/header"
import { FavoriteProfessorButton } from "@/components/favorite-professor-button"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import { toProfessorSlug, type ReviewPost } from "@/lib/reviews"

interface FavoriteProfessor {
  slug: string
  name: string
  rating: number
  reviews: number
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProfessor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) { if (!authLoading) setLoading(false); return }
      const db = getFirebaseDb()
      if (!db) return setLoading(false)
      const userSnapshot = await getDoc(doc(db, "users", user.uid))
      const slugs = (userSnapshot.data()?.favoriteProfessors || []) as string[]
      if (!slugs.length) { setFavorites([]); setLoading(false); return }
      const postsSnapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(250)))
      const posts = postsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ReviewPost)
      const summaries = slugs.map((slug) => {
        const reviews = posts.filter((post) => (post.professorSlug || toProfessorSlug(post.professorName)) === slug)
        return {
          slug,
          name: reviews[0]?.professorName || slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
          rating: reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : 0,
          reviews: reviews.length,
        }
      })
      setFavorites(summaries)
      setLoading(false)
    }
    load().catch((error) => { console.error("Error loading favorites:", error); setLoading(false) })
  }, [authLoading, user])

  return (
    <div className="min-h-screen bg-surface"><Header /><main className="container mx-auto px-4 py-12"><div className="mb-8"><h1 className="text-3xl font-bold">Profesores favoritos</h1><p className="mt-2 text-muted-foreground">Accede rápidamente a los profesores que estás considerando.</p></div>
      {loading || authLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : !user ? <div className="rounded-xl border border-border bg-background p-12 text-center">Inicia sesión para guardar profesores.</div> : favorites.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center"><Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="text-muted-foreground">Todavía no has guardado profesores.</p></div> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{favorites.map((professor) => <article key={professor.slug} className="rounded-xl border border-border bg-background p-6"><Link href={`/professor/${professor.slug}`} className="text-xl font-bold hover:text-primary hover:underline">{professor.name}</Link><div className="mt-4 flex items-center gap-2"><Star className="h-5 w-5 fill-warning text-warning" /><span className="font-semibold">{professor.rating || "—"}</span><span className="text-sm text-muted-foreground">· {professor.reviews} reseñas</span></div><div className="mt-5"><FavoriteProfessorButton slug={professor.slug} /></div></article>)}</div>}
    </main></div>
  )
}
