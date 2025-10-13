"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Star, ThumbsUp, MessageCircle, Loader2, ArrowLeft, Share2, Bookmark } from "lucide-react"
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { InstagramComments } from "@/components/instagram-comments"

interface Post {
  id: string
  courseCode: string
  courseName: string
  professorName: string
  rating: number
  review: string
  authorId: string
  authorName: string
  authorPhoto: string
  createdAt: string
  likes: number
  likedBy: string[]
  commentsCount: number
  savedBy?: string[]
}

export default function PostDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)

  const postId = params.id as string

  useEffect(() => {
    const db = getFirebaseDb()
    if (!db) {
      console.error("Firestore not initialized")
      setLoading(false)
      return
    }

    const postRef = doc(db, "posts", postId)

    const unsubscribe = onSnapshot(
      postRef,
      (postSnap) => {
        if (postSnap.exists()) {
          setPost({ id: postSnap.id, ...postSnap.data() } as Post)
        } else {
          setPost(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching post:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [postId])

  const handleLike = useCallback(async () => {
    if (!user || !post) return

    setLiking(true)
    try {
      const db = getFirebaseDb()
      if (!db) {
        throw new Error("Firestore not initialized")
      }

      const postRef = doc(db, "posts", postId)
      const isLiked = post.likedBy?.includes(user.uid)

      if (isLiked) {
        await updateDoc(postRef, {
          likes: post.likes - 1,
          likedBy: arrayRemove(user.uid),
        })
      } else {
        await updateDoc(postRef, {
          likes: post.likes + 1,
          likedBy: arrayUnion(user.uid),
        })
      }
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setLiking(false)
    }
  }, [user, post, postId])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: post ? `${post.courseName} - ${post.professorName}` : "FindTeacher",
          text: post?.review.substring(0, 100) + "...",
          url: url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }, [postId, post])

  const handleSave = useCallback(async () => {
    if (!user || !post) return

    setSaving(true)
    try {
      const db = getFirebaseDb()
      if (!db) return

      const postRef = doc(db, "posts", postId)
      const isSaved = post.savedBy?.includes(user.uid)

      if (isSaved) {
        await updateDoc(postRef, {
          savedBy: arrayRemove(user.uid),
        })
      } else {
        await updateDoc(postRef, {
          savedBy: arrayUnion(user.uid),
        })
      }
    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      setSaving(false)
    }
  }, [user, post, postId])

  const timeAgo = useMemo(() => {
    if (!post) return ""
    return formatDistanceToNow(new Date(post.createdAt), {
      addSuffix: true,
      locale: es,
    })
  }, [post])

  const isLiked = useMemo(() => {
    return user && post && post.likedBy?.includes(user.uid)
  }, [user, post])

  const isSaved = useMemo(() => {
    return user && post && post.savedBy?.includes(user.uid)
  }, [user, post])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Publicación no encontrada</h1>
          <Button onClick={() => router.push("/")} className="mt-4">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="mx-auto max-w-3xl">
          <article className="rounded-xl border border-border bg-background p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                    {post.courseCode}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < post.rating ? "fill-warning text-warning" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold text-balance md:text-3xl">{post.courseName}</h1>
                <p className="mt-2 text-lg text-muted-foreground">Profesor: {post.professorName}</p>
              </div>
            </div>

            {/* Author */}
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
              <img
                src={post.authorPhoto || "/placeholder.svg?height=48&width=48"}
                alt={post.authorName}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <p className="font-medium">{post.authorName}</p>
                <p className="text-sm text-muted-foreground">{timeAgo}</p>
              </div>
            </div>

            {/* Review */}
            <div className="mt-6 border-t border-border pt-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed">{post.review}</p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-4 border-t border-border pt-6">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                disabled={!user || liking}
                className="gap-2"
              >
                <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {post.likes || 0}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowComments(!showComments)} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount || 0} comentarios
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2 bg-transparent"
                title={copied ? "Link copiado!" : "Compartir"}
              >
                <Share2 className={`h-4 w-4 ${copied ? "text-primary" : ""}`} />
                {copied ? "Copiado!" : "Compartir"}
              </Button>
              {user && (
                <Button
                  variant={isSaved ? "default" : "outline"}
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Guardado" : "Guardar"}
                </Button>
              )}
            </div>
          </article>

          {/* Comments Section */}
          {showComments && (
            <InstagramComments postId={postId} postAuthorId={post.authorId} onClose={() => setShowComments(false)} />
          )}
        </div>
      </main>
    </div>
  )
}
