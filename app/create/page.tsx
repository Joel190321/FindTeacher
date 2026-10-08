"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import {
  averageRatings,
  buildReviewId,
  FACULTIES,
  RATING_CATEGORIES,
  toProfessorSlug,
  type CategoryRatings,
  type ReviewPost,
} from "@/lib/reviews"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { RatingInput } from "@/components/rating-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

const EMPTY_RATINGS: CategoryRatings = { clarity: 0, methodology: 0, fairness: 0, punctuality: 0 }

function getCurrentTerm() {
  const date = new Date()
  return `${date.getFullYear()}-${date.getMonth() < 6 ? "1" : "2"}`
}

export default function CreatePost() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [existingPost, setExistingPost] = useState<ReviewPost | null>(null)
  const [ratings, setRatings] = useState<CategoryRatings>(EMPTY_RATINGS)
  const [difficulty, setDifficulty] = useState(0)
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    professorName: "",
    career: "",
    academicTerm: getCurrentTerm(),
    review: "",
  })

  const rating = useMemo(() => averageRatings(ratings), [ratings])
  const ratingsComplete = Object.values(ratings).every((value) => value > 0) && difficulty > 0

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!user || formData.courseCode.trim().length < 3 || formData.professorName.trim().length < 3) {
        setExistingPost(null)
        return
      }

      setCheckingDuplicate(true)
      try {
        const db = getFirebaseDb()
        if (!db) return
        const reviewId = buildReviewId(user.uid, formData.professorName, formData.courseCode, formData.academicTerm)
        const reviewSnapshot = await getDoc(doc(db, "posts", reviewId))
        setExistingPost(reviewSnapshot.exists() ? ({ id: reviewSnapshot.id, ...reviewSnapshot.data() } as ReviewPost) : null)
      } catch (error) {
        console.error("Error checking duplicate review:", error)
      } finally {
        setCheckingDuplicate(false)
      }
    }

    const timer = setTimeout(checkDuplicate, 400)
    return () => clearTimeout(timer)
  }, [formData.academicTerm, formData.courseCode, formData.professorName, user])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return alert("Debes iniciar sesión para publicar")
    if (!ratingsComplete) return alert("Completa todas las calificaciones")
    if (!formData.career) return alert("Selecciona una carrera")
    if (existingPost) return alert("Ya publicaste una reseña para este profesor, materia y período")

    setLoading(true)
    try {
      const db = getFirebaseDb()
      if (!db) throw new Error("Firestore not initialized")

      const professorName = formData.professorName.trim()
      const courseCode = formData.courseCode.trim().toUpperCase()
      const reviewId = buildReviewId(user.uid, professorName, courseCode, formData.academicTerm)

      await setDoc(doc(db, "posts", reviewId), {
        ...formData,
        courseCode,
        courseName: formData.courseName.trim(),
        professorName,
        professorSlug: toProfessorSlug(professorName),
        review: formData.review.trim(),
        rating,
        ratings,
        difficulty,
        reviewKey: reviewId,
        authorId: user.uid,
        authorName: user.displayName || "Usuario Anónimo",
        authorPhoto: user.photoURL || "",
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        savedBy: [],
      })

      router.push(`/professor/${toProfessorSlug(professorName)}`)
    } catch (error) {
      console.error("Error creating review:", error)
      alert("No se pudo publicar la reseña. Inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Debes iniciar sesión para crear una publicación</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance md:text-4xl">Comparte tu experiencia</h1>
            <p className="mt-2 text-muted-foreground">Tu opinión se combinará con la de otros estudiantes.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-6 md:p-8">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Código de materia *</Label>
                  <Input id="courseCode" placeholder="Ej: MAT101" value={formData.courseCode} onChange={(event) => setFormData({ ...formData, courseCode: event.target.value.toUpperCase() })} maxLength={20} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName">Nombre de la materia *</Label>
                  <Input id="courseName" placeholder="Ej: Cálculo I" value={formData.courseName} onChange={(event) => setFormData({ ...formData, courseName: event.target.value })} maxLength={120} required />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="professorName">Nombre del profesor *</Label>
                  <Input id="professorName" placeholder="Ej: Juan Pérez" value={formData.professorName} onChange={(event) => setFormData({ ...formData, professorName: event.target.value })} maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicTerm">Período académico *</Label>
                  <Input id="academicTerm" placeholder="Ej: 2026-1" value={formData.academicTerm} onChange={(event) => setFormData({ ...formData, academicTerm: event.target.value })} maxLength={20} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="career">Carrera *</Label>
                <Select value={formData.career} onValueChange={(career) => setFormData({ ...formData, career })}>
                  <SelectTrigger id="career"><SelectValue placeholder="Selecciona tu carrera" /></SelectTrigger>
                  <SelectContent>
                    {FACULTIES.map((faculty) => (
                      <SelectGroup key={faculty.name}>
                        <SelectLabel>{faculty.name}</SelectLabel>
                        {faculty.careers.map((career) => <SelectItem key={career} value={career}>{career}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Calificación detallada *</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Promedio general: {rating || "—"} de 5</p>
                </div>
                {RATING_CATEGORIES.map((category) => (
                  <RatingInput key={category.key} label={category.label} description={category.description} value={ratings[category.key]} onChange={(value) => setRatings((current) => ({ ...current, [category.key]: value }))} />
                ))}
                <RatingInput label="Nivel de dificultad" description="1 es muy fácil y 5 es muy difícil; no afecta el promedio general" value={difficulty} onChange={setDifficulty} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review">Tu reseña *</Label>
                <Textarea id="review" placeholder="Describe la metodología, las evaluaciones y qué debería saber otro estudiante." value={formData.review} onChange={(event) => setFormData({ ...formData, review: event.target.value })} rows={6} minLength={50} maxLength={2000} required className="resize-none" />
                <p className="text-xs text-muted-foreground">{formData.review.length}/2000 · mínimo 50 caracteres</p>
              </div>
            </div>

            {existingPost && (
              <div className="mt-8 rounded-xl border border-warning/50 bg-warning/5 p-6">
                <div className="mb-4 flex items-center gap-2 text-warning">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">Ya reseñaste esta combinación durante {formData.academicTerm}</p>
                </div>
                <PostCard post={existingPost} />
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={loading || checkingDuplicate || !!existingPost || formData.review.trim().length < 50 || !ratingsComplete} className="flex-1 bg-primary hover:bg-primary-hover">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publicando...</> : "Publicar reseña"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
