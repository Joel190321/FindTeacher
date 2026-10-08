"use client"

import type React from "react"
import { memo, useCallback, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore"
import { Bookmark, MessageCircle, Share2, Star, ThumbsUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import { toProfessorSlug, type ReviewPost } from "@/lib/reviews"
import { Button } from "@/components/ui/button"

interface PostCardProps {
  post: ReviewPost
}

function PostCardComponent({ post }: PostCardProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const isSaved = Boolean(user && post.savedBy?.includes(user.uid))
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })
  const professorSlug = post.professorSlug || toProfessorSlug(post.professorName)

  const handleShare = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault()
    const url = `${window.location.origin}/post/${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.courseName} - ${post.professorName}`, text: `${post.review.substring(0, 100)}...`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }, [post])

  const handleSave = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const db = getFirebaseDb()
      if (!db) return
      await updateDoc(doc(db, "posts", post.id), {
        savedBy: isSaved ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      setSaving(false)
    }
  }, [isSaved, post.id, user])

  return (
    <article className="group h-full rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.courseCode}</span>
            {post.academicTerm && <span className="text-xs text-muted-foreground">{post.academicTerm}</span>}
            <div className="flex items-center gap-1" aria-label={`${post.rating} de 5 estrellas`}>
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < Math.round(post.rating) ? "fill-warning text-warning" : "text-muted"}`} />)}
            </div>
          </div>
          <Link href={`/post/${post.id}`} className="mt-3 block font-display text-lg font-semibold text-balance transition-colors group-hover:text-primary">
            {post.courseName}
          </Link>
          <Link href={`/professor/${professorSlug}`} className="mt-1 inline-block text-sm text-muted-foreground hover:text-primary hover:underline">
            Prof. {post.professorName}
          </Link>
          {post.difficulty && <p className="mt-1 text-xs text-muted-foreground">Dificultad: {post.difficulty}/5</p>}
        </div>
      </div>

      <Link href={`/post/${post.id}`} className="mt-4 block text-sm text-muted-foreground line-clamp-3 hover:text-foreground">{post.review}</Link>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <img src={post.authorPhoto || "/placeholder.svg?height=32&width=32"} alt={post.authorName} className="h-8 w-8 rounded-full" />
          <div className="text-xs"><p className="font-medium">{post.authorName}</p><p className="text-muted-foreground">{timeAgo}</p></div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" />{post.likes || 0}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{post.commentsCount || 0}</span>
          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent" onClick={handleShare} title={copied ? "Enlace copiado" : "Compartir"}><Share2 className={`h-4 w-4 ${copied ? "text-primary" : ""}`} /></Button>
          {user && <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent" onClick={handleSave} disabled={saving} title={isSaved ? "Guardado" : "Guardar"}><Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} /></Button>}
        </div>
      </div>
    </article>
  )
}

export const PostCard = memo(PostCardComponent)
