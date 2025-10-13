"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Loader2 } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { useRouter } from "next/navigation"

const CAREERS = [
  "Medicina",
  "Odontología",
  "Enfermería",
  "Administración de Empresas",
  "Contaduría Pública",
  "Mercadeo",
  "Derecho",
  "Arquitectura",
  "Ingeniería Civil",
  "Ingeniería Industrial",
  "Ingeniería en Sistemas Computacionales",
  "Comunicación Social",
] as const

export default function CreatePost() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    professorName: "",
    career: "",
    review: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert("Debes iniciar sesión para publicar")
      return
    }

    if (rating === 0) {
      alert("Por favor selecciona una calificación")
      return
    }

    if (!formData.career) {
      alert("Por favor selecciona una carrera")
      return
    }

    setLoading(true)

    try {
      const db = getFirebaseDb()
      if (!db) {
        throw new Error("Firestore not initialized")
      }

      await addDoc(collection(db, "posts"), {
        ...formData,
        rating,
        authorId: user.uid,
        authorName: user.displayName || "Usuario Anónimo",
        authorPhoto: user.photoURL || "",
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        savedBy: [],
      })

      router.push("/")
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Error al crear la publicación")
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
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance md:text-4xl">Comparte tu experiencia</h1>
            <p className="mt-2 text-muted-foreground">Ayuda a otros estudiantes a tomar mejores decisiones</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-6 md:p-8">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Código de Materia *</Label>
                  <Input
                    id="courseCode"
                    placeholder="Ej: MAT101"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseName">Nombre de la Materia *</Label>
                  <Input
                    id="courseName"
                    placeholder="Ej: Cálculo I"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professorName">Nombre del Profesor *</Label>
                <Input
                  id="professorName"
                  placeholder="Ej: Dr. Juan Pérez"
                  value={formData.professorName}
                  onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="career">Carrera *</Label>
                <Select value={formData.career} onValueChange={(value) => setFormData({ ...formData, career: value })}>
                  <SelectTrigger id="career">
                    <SelectValue placeholder="Selecciona tu carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREERS.map((career) => (
                      <SelectItem key={career} value={career}>
                        {career}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Calificación *</Label>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      onMouseEnter={() => setHoveredRating(i + 1)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          i < (hoveredRating || rating) ? "fill-warning text-warning" : "text-muted"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating > 0 ? `${rating} de 5 estrellas` : "Selecciona una calificación"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review">Tu Reseña *</Label>
                <Textarea
                  id="review"
                  placeholder="Comparte tu experiencia con este profesor y materia. ¿Cómo fue su metodología? ¿Qué tan exigente es? ¿Lo recomendarías?"
                  value={formData.review}
                  onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                  rows={6}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Mínimo 50 caracteres</p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.review.length < 50}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  "Publicar Reseña"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
