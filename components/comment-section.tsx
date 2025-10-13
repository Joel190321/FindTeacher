"use client"

import type React from "react"
import { getFirebaseDb } from "@/lib/firebase"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageCircle } from "lucide-react"
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Comment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorPhoto: string
  content: string
  createdAt: string
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const db = getFirebaseDb()
        if (!db) {
          console.error("Firestore not initialized")
          setLoading(false)
          return
        }

        const commentsRef = collection(db, "comments")
        const q = query(commentsRef, where("postId", "==", postId))
        const querySnapshot = await getDocs(q)

        const commentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[]

        commentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setComments(commentsData)
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !newComment.trim()) return

    setSubmitting(true)

    try {
      const db = getFirebaseDb()
      if (!db) {
        throw new Error("Firestore not initialized")
      }

      const commentData = {
        postId,
        authorId: user.uid,
        authorName: user.displayName || "Usuario Anónimo",
        authorPhoto: user.photoURL || "",
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, "comments"), commentData)

      // Update post comment count
      const postRef = doc(db, "posts", postId)
      await updateDoc(postRef, {
        commentsCount: increment(1),
      })

      setComments([{ id: docRef.id, ...commentData }, ...comments])
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Error al publicar el comentario")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
        <MessageCircle className="h-5 w-5" />
        Comentarios ({comments.length})
      </h2>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Comparte tu opinión..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={!newComment.trim() || submitting} size="sm">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Comentar"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-lg bg-surface p-4 text-center text-sm text-muted-foreground">
          Inicia sesión para comentar
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No hay comentarios aún. ¡Sé el primero en comentar!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.authorPhoto || "/placeholder.svg?height=40&width=40"}
                alt={comment.authorName}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{comment.authorName}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
