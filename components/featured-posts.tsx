"use client"

import { useEffect, useState, memo } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { PostCard } from "@/components/post-card"
import { Loader2 } from "lucide-react"

interface Post {
  id: string
  courseCode: string
  courseName: string
  professorName: string
  rating: number
  review: string
  authorName: string
  authorPhoto: string
  createdAt: string
  likes: number
  commentsCount: number
}

function FeaturedPostsComponent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const db = getFirebaseDb()
        if (!db) {
          setError("Base de datos no disponible")
          setLoading(false)
          return
        }

        const postsRef = collection(db, "posts")
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(6))
        const querySnapshot = await getDocs(q)

        const postsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[]

        setPosts(postsData)
        setError(null)
      } catch (error) {
        console.error("Error fetching posts:", error)
        setError("Error al cargar las publicaciones")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-balance md:text-4xl">Reseñas recientes</h2>
          <p className="mt-2 text-muted-foreground">Descubre lo que otros estudiantes están compartiendo</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay publicaciones aún. ¡Sé el primero en compartir!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export const FeaturedPosts = memo(FeaturedPostsComponent)
