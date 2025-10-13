"use client"

import type React from "react"

import { Star, MessageCircle, ThumbsUp, Share2, Bookmark } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { memo, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

interface PostCardProps {
  post: {
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
    savedBy?: string[]
  }
}

function PostCardComponent({ post }: PostCardProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const isSaved = user && post.savedBy?.includes(user.uid)

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  })

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const url = `${window.location.origin}/post/${post.id}`

      try {
        if (navigator.share) {
          await navigator.share({
            title: `${post.courseName} - ${post.professorName}`,
            text: post.review.substring(0, 100) + "...",
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
    },
    [post],
  )

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!user) return

      setSaving(true)
      try {
        const db = getFirebaseDb()
        if (!db) return

        const postRef = doc(db, "posts", post.id)

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
    },
    [user, post.id, isSaved],
  )

  return (
    <Link href={`/post/${post.id}`}>
      <article className="group h-full rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {post.courseCode}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < post.rating ? "fill-warning text-warning" : "text-muted"}`} />
                ))}
              </div>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold text-balance group-hover:text-primary transition-colors">
              {post.courseName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Prof. {post.professorName}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{post.review}</p>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <img
              src={post.authorPhoto || "/placeholder.svg?height=32&width=32"}
              alt={post.authorName}
              className="h-8 w-8 rounded-full"
            />
            <div className="text-xs">
              <p className="font-medium">{post.authorName}</p>
              <p className="text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {post.likes || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.commentsCount || 0}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={handleShare}
              title={copied ? "Link copiado!" : "Compartir"}
            >
              <Share2 className={`h-4 w-4 ${copied ? "text-primary" : ""}`} />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={handleSave}
                disabled={saving}
                title={isSaved ? "Guardado" : "Guardar"}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

export const PostCard = memo(PostCardComponent)
