"use client"

import type React from "react"
import { getFirebaseDb } from "@/lib/firebase"
import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Heart, Smile, X } from "lucide-react"
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
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
  likes: number
  likedBy: string[]
  parentId?: string
  replies?: Comment[]
}

interface InstagramCommentsProps {
  postId: string
  postAuthorId: string
  onClose: () => void
}

const CommentItem = memo(
  ({
    comment,
    isReply,
    postAuthorId,
    userId,
    onLike,
    onReply,
    onToggleReplies,
    showReplies,
    replyingTo,
    replyText,
    setReplyText,
    handleSubmitReply,
    setReplyingTo,
  }: {
    comment: Comment
    isReply: boolean
    postAuthorId: string
    userId: string | undefined
    onLike: (commentId: string, isLiked: boolean, currentLikes: number) => void
    onReply: (commentId: string) => void
    onToggleReplies: (commentId: string) => void
    showReplies: boolean
    replyingTo: string | null
    replyText: string
    setReplyText: (text: string) => void
    handleSubmitReply: (parentId: string) => void
    setReplyingTo: (id: string | null) => void
  }) => {
    const isLiked = userId && comment.likedBy?.includes(userId)
    const isAuthor = comment.authorId === postAuthorId

    const formatTime = useCallback((date: string) => {
      const distance = formatDistanceToNow(new Date(date), { locale: es })
      return distance.replace("hace ", "").replace("alrededor de ", "")
    }, [])

    return (
      <div className={isReply ? "ml-12 mt-4" : ""}>
        <div className="flex gap-3">
          <div className="relative h-8 w-8 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <img
                src={comment.authorPhoto || "/placeholder.svg?height=32&width=32"}
                alt={comment.authorName}
                className="h-full w-full rounded-full border-2 border-background object-cover"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                  {isAuthor && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      by author
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed">{comment.content}</p>

                <div className="mt-2 flex items-center gap-4">
                  <button
                    onClick={() => onReply(comment.id)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Reply
                  </button>
                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => onToggleReplies(comment.id)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {showReplies ? "Hide" : `View ${comment.replies.length}`}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => onLike(comment.id, !!isLiked, comment.likes)}
                  disabled={!userId}
                  className="transition-transform hover:scale-110"
                >
                  <Heart
                    className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`}
                  />
                </button>
                {comment.likes > 0 && (
                  <span className="text-xs font-semibold text-muted-foreground">{comment.likes}</span>
                )}
              </div>
            </div>

            {replyingTo === comment.id && userId && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={!replyText.trim()}>
                  Post
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply={true}
                postAuthorId={postAuthorId}
                userId={userId}
                onLike={onLike}
                onReply={onReply}
                onToggleReplies={onToggleReplies}
                showReplies={false}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                handleSubmitReply={handleSubmitReply}
                setReplyingTo={setReplyingTo}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
)

CommentItem.displayName = "CommentItem"

export function InstagramComments({ postId, postAuthorId, onClose }: InstagramCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyState, setReplyState] = useState<{
    replyingTo: string | null
    replyText: string
  }>({ replyingTo: null, replyText: "" })
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set())
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const db = getFirebaseDb()
    if (!db) {
      setLoading(false)
      return
    }

    const commentsRef = collection(db, "comments")
    const q = query(commentsRef, where("postId", "==", postId))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        likes: doc.data().likes || 0,
        likedBy: doc.data().likedBy || [],
      })) as Comment[]

      const topLevelComments = commentsData.filter((c) => !c.parentId)
      const repliesMap = new Map<string, Comment[]>()

      commentsData.forEach((comment) => {
        if (comment.parentId) {
          const replies = repliesMap.get(comment.parentId) || []
          replies.push(comment)
          repliesMap.set(comment.parentId, replies)
        }
      })

      topLevelComments.forEach((comment) => {
        comment.replies = repliesMap.get(comment.id) || []
      })

      topLevelComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setComments(topLevelComments)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [postId])

  const handleSubmitComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user || !newComment.trim()) return

      try {
        const db = getFirebaseDb()
        if (!db) return

        const commentData = {
          postId,
          authorId: user.uid,
          authorName: user.displayName || "Usuario",
          authorPhoto: user.photoURL || "",
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
          likes: 0,
          likedBy: [],
        }

        await addDoc(collection(db, "comments"), commentData)

        const postRef = doc(db, "posts", postId)
        await updateDoc(postRef, { commentsCount: increment(1) })

        setNewComment("")
      } catch (error) {
        console.error("Error adding comment:", error)
      }
    },
    [user, newComment, postId],
  )

  const handleSubmitReply = useCallback(
    async (parentId: string) => {
      if (!user || !replyState.replyText.trim()) return

      try {
        const db = getFirebaseDb()
        if (!db) return

        const replyData = {
          postId,
          parentId,
          authorId: user.uid,
          authorName: user.displayName || "Usuario",
          authorPhoto: user.photoURL || "",
          content: replyState.replyText.trim(),
          createdAt: new Date().toISOString(),
          likes: 0,
          likedBy: [],
        }

        await addDoc(collection(db, "comments"), replyData)

        const postRef = doc(db, "posts", postId)
        await updateDoc(postRef, { commentsCount: increment(1) })

        setReplyState({ replyingTo: null, replyText: "" })
      } catch (error) {
        console.error("Error adding reply:", error)
      }
    },
    [user, replyState.replyText, postId],
  )

  const handleLikeComment = useCallback(
    async (commentId: string, isLiked: boolean, currentLikes: number) => {
      if (!user) return

      try {
        const db = getFirebaseDb()
        if (!db) return

        const commentRef = doc(db, "comments", commentId)

        if (isLiked) {
          await updateDoc(commentRef, {
            likes: currentLikes - 1,
            likedBy: arrayRemove(user.uid),
          })
        } else {
          await updateDoc(commentRef, {
            likes: currentLikes + 1,
            likedBy: arrayUnion(user.uid),
          })
        }
      } catch (error) {
        console.error("Error liking comment:", error)
      }
    },
    [user],
  )

  const toggleReplies = useCallback((commentId: string) => {
    setShowReplies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }, [])

  const handleReply = useCallback((commentId: string) => {
    setReplyState({ replyingTo: commentId, replyText: "" })
  }, [])

  const renderedComments = useMemo(() => {
    return comments.map((comment) => (
      <CommentItem
        key={comment.id}
        comment={comment}
        isReply={false}
        postAuthorId={postAuthorId}
        userId={user?.uid}
        onLike={handleLikeComment}
        onReply={handleReply}
        onToggleReplies={toggleReplies}
        showReplies={showReplies.has(comment.id)}
        replyingTo={replyState.replyingTo}
        replyText={replyState.replyText}
        setReplyText={(text) => setReplyState((prev) => ({ ...prev, replyText: text }))}
        handleSubmitReply={handleSubmitReply}
        setReplyingTo={(id) => setReplyState((prev) => ({ ...prev, replyingTo: id }))}
      />
    ))
  }, [
    comments,
    postAuthorId,
    user?.uid,
    handleLikeComment,
    handleReply,
    toggleReplies,
    showReplies,
    replyState,
    handleSubmitReply,
  ])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    isDragging.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0 && containerRef.current) {
      containerRef.current.style.transform = `translateY(${diff}px)`
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return

    const diff = currentY.current - startY.current

    if (diff > 100) {
      setIsClosing(true)
      setTimeout(() => {
        onClose()
      }, 300)
    } else if (containerRef.current) {
      containerRef.current.style.transform = "translateY(0)"
    }

    isDragging.current = false
  }, [onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setIsClosing(true)
        setTimeout(() => {
          onClose()
        }, 300)
      }
    },
    [onClose],
  )

  const handleCloseButton = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  if (loading) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-end transition-all duration-300 ${
          isVisible ? "bg-black/50" : "bg-black/0"
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`w-full rounded-t-3xl bg-background p-6 transition-transform duration-300 ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-4 text-center font-semibold">Comments</div>
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end transition-all duration-300 ${
        isVisible && !isClosing ? "bg-black/50" : "bg-black/0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={containerRef}
        className={`w-full rounded-t-3xl bg-background transition-transform duration-300 ease-out ${
          isVisible && !isClosing ? "translate-y-0" : "translate-y-full"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-4 text-center">
          <div className="mx-auto h-1 w-12 rounded-full bg-muted cursor-grab active:cursor-grabbing" />
          <div className="mt-3 flex items-center justify-between">
            <div className="w-8" />
            <h2 className="font-semibold">Comments</h2>
            <Button variant="ghost" size="sm" onClick={handleCloseButton} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-4">
          {comments.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-6">{renderedComments}</div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="flex gap-3 overflow-x-auto">
            {["💙", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emoji) => (
              <button
                key={emoji}
                className="flex-shrink-0 text-2xl transition-transform hover:scale-125"
                onClick={() => setNewComment(newComment + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {user ? (
          <form onSubmit={handleSubmitComment} className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <img
                    src={user.photoURL || "/placeholder.svg?height=32&width=32"}
                    alt={user.displayName || "User"}
                    className="h-full w-full rounded-full border-2 border-background object-cover"
                  />
                </div>
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What do you think of this?"
                className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" className="text-muted-foreground hover:text-foreground">
                <Smile className="h-5 w-5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">Sign in to comment</div>
        )}
      </div>
    </div>
  )
}
