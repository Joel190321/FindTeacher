"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { GitCompareArrows, Loader2, Star, X } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFirebaseDb } from "@/lib/firebase"
import { getRatingValue, RATING_CATEGORIES, toProfessorSlug, type ReviewPost } from "@/lib/reviews"

interface ProfessorSummary {
  slug: string
  name: string
  reviews: number
  rating: number
  difficulty: number
  courses: number
  categories: Record<string, number>
}

const average = (values: number[]) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0

export default function ComparePage() {
  const [posts, setPosts] = useState<ReviewPost[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const db = getFirebaseDb()
        if (!db) return
        const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(250)))
        setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ReviewPost))
      } finally {
        setLoading(false)
      }
    }
    load().catch((error) => console.error("Error loading comparison:", error))
  }, [])

  const professors = useMemo(() => {
    const groups = new Map<string, ReviewPost[]>()
    posts.forEach((post) => {
      const slug = post.professorSlug || toProfessorSlug(post.professorName)
      groups.set(slug, [...(groups.get(slug) || []), post])
    })
    return [...groups.entries()].map(([slug, reviews]): ProfessorSummary => ({
      slug,
      name: reviews[0].professorName,
      reviews: reviews.length,
      rating: average(reviews.map((review) => review.rating)),
      difficulty: average(reviews.map((review) => review.difficulty || 0).filter(Boolean)),
      courses: new Set(reviews.map((review) => review.courseCode)).size,
      categories: Object.fromEntries(RATING_CATEGORIES.map(({ key }) => [key, average(reviews.map((review) => getRatingValue(review, key)))])),
    })).sort((a, b) => b.reviews - a.reviews || b.rating - a.rating)
  }, [posts])

  const compared = selected.map((slug) => professors.find((professor) => professor.slug === slug)).filter(Boolean) as ProfessorSummary[]

  const addProfessor = (slug: string) => {
    if (!selected.includes(slug) && selected.length < 3) setSelected((current) => [...current, slug])
  }

  return (
    <div className="min-h-screen bg-surface"><Header /><main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl"><div className="mb-8"><div className="flex items-center gap-3"><GitCompareArrows className="h-8 w-8 text-primary" /><h1 className="text-3xl font-bold md:text-4xl">Comparar profesores</h1></div><p className="mt-2 text-muted-foreground">Compara hasta tres profesores usando promedios de reseñas reales.</p></div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : professors.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Se necesitan reseñas para generar comparaciones.</div> : <>
        <div className="rounded-xl border border-border bg-background p-5"><p className="mb-3 text-sm font-medium">Añadir profesor ({selected.length}/3)</p><Select onValueChange={addProfessor} disabled={selected.length >= 3}><SelectTrigger><SelectValue placeholder="Selecciona un profesor" /></SelectTrigger><SelectContent>{professors.filter((professor) => !selected.includes(professor.slug)).map((professor) => <SelectItem key={professor.slug} value={professor.slug}>{professor.name} · {professor.rating}/5</SelectItem>)}</SelectContent></Select><div className="mt-4 flex flex-wrap gap-2">{compared.map((professor) => <Button key={professor.slug} variant="secondary" size="sm" onClick={() => setSelected((current) => current.filter((slug) => slug !== professor.slug))}>{professor.name}<X className="ml-2 h-3 w-3" /></Button>)}</div></div>
        {compared.length > 0 ? <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-background"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-border"><th className="p-4 text-left text-muted-foreground">Métrica</th>{compared.map((professor) => <th key={professor.slug} className="p-4 text-left"><Link href={`/professor/${professor.slug}`} className="hover:text-primary hover:underline">{professor.name}</Link></th>)}</tr></thead><tbody>
          <ComparisonRow label="Promedio general" values={compared.map((item) => `${item.rating}/5`)} highlight />
          <ComparisonRow label="Reseñas" values={compared.map((item) => String(item.reviews))} />
          <ComparisonRow label="Materias" values={compared.map((item) => String(item.courses))} />
          {RATING_CATEGORIES.map((category) => <ComparisonRow key={category.key} label={category.label} values={compared.map((item) => `${item.categories[category.key]}/5`)} />)}
          <ComparisonRow label="Dificultad" values={compared.map((item) => item.difficulty ? `${item.difficulty}/5` : "—")} />
        </tbody></table></div> : <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center"><Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">Selecciona profesores para comenzar.</p></div>}
      </>}</div>
    </main></div>
  )
}

function ComparisonRow({ label, values, highlight = false }: { label: string; values: string[]; highlight?: boolean }) {
  return <tr className="border-b border-border last:border-0"><td className="p-4 font-medium">{label}</td>{values.map((value, index) => <td key={`${label}-${index}`} className={`p-4 ${highlight ? "text-lg font-bold text-primary" : ""}`}>{value}</td>)}</tr>
}
