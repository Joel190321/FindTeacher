"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post-card"
import { Loader2, User, FileText, MessageCircle, ThumbsUp, Bookmark } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { useRouter } from "next/navigation"

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
  savedBy: string[]
}

interface Comment {
  id: string
  postId: string
  content: string
  createdAt: string
}

interface UserStats {
  postsCount: number
  commentsCount: number
  totalLikes: number
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userComments, setUserComments] = useState<Comment[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      fetchUserData()
    }
  }, [user, authLoading, router])

  const fetchUserData = useCallback(async () => {
    if (!user) return

    try {
      const db = getFirebaseDb()
      if (!db) {
        console.error("Firestore not initialized")
        setLoading(false)
        return
      }

      const [postsSnapshot, commentsSnapshot, allPostsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "posts"), where("authorId", "==", user.uid))),
        getDocs(query(collection(db, "comments"), where("authorId", "==", user.uid))),
        getDocs(query(collection(db, "posts"), where("savedBy", "array-contains", user.uid))),
      ])

      const posts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[]

      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const comments = commentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[]

      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const saved = allPostsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[]

      saved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setUserPosts(posts)
      setUserComments(comments)
      setSavedPosts(saved)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const stats = useMemo<UserStats>(() => {
    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0)
    return {
      postsCount: userPosts.length,
      commentsCount: userComments.length,
      totalLikes,
    }
  }, [userPosts, userComments])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="mb-8 rounded-xl border border-border bg-background p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL || "/placeholder.svg"}
                  alt={user.displayName || "User"}
                  className="h-24 w-24 rounded-full"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{user.displayName || "Usuario"}</h1>
              <p className="mt-1 text-muted-foreground">{user.email}</p>

              <div className="mt-6 grid grid-cols-3 gap-4 md:gap-8">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <FileText className="h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold">{stats.postsCount}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Publicaciones</p>
                </div>

                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold">{stats.commentsCount}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Comentarios</p>
                </div>

                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <ThumbsUp className="h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold">{stats.totalLikes}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Me gusta</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="posts">Mis Publicaciones</TabsTrigger>
            <TabsTrigger value="saved">Guardados</TabsTrigger>
            <TabsTrigger value="comments">Mis Comentarios</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {userPosts.length === 0 ? (
              <div className="rounded-xl border border-border bg-background p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold">No tienes publicaciones</h3>
                <p className="mt-2 text-sm text-muted-foreground">Comparte tu primera experiencia con un profesor</p>
                <Button onClick={() => router.push("/create")} className="mt-4">
                  Crear Publicación
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {savedPosts.length === 0 ? (
              <div className="rounded-xl border border-border bg-background p-12 text-center">
                <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold">No tienes publicaciones guardadas</h3>
                <p className="mt-2 text-sm text-muted-foreground">Guarda publicaciones para verlas más tarde</p>
                <Button onClick={() => router.push("/explore")} className="mt-4">
                  Explorar Publicaciones
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            {userComments.length === 0 ? (
              <div className="rounded-xl border border-border bg-background p-12 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold">No tienes comentarios</h3>
                <p className="mt-2 text-sm text-muted-foreground">Participa en las conversaciones de la comunidad</p>
                <Button onClick={() => router.push("/explore")} className="mt-4">
                  Explorar Publicaciones
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userComments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-border bg-background p-6">
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/post/${comment.postId}`)}>
                        Ver publicación
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
