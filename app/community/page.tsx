"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { Award, Loader2, Medal, Trophy } from "lucide-react"
import { Header } from "@/components/header"
import { getFirebaseDb } from "@/lib/firebase"
import type { ReviewPost } from "@/lib/reviews"

interface Contributor {
  id: string
  name: string
  photo: string
  reviews: number
  likes: number
  discussions: number
  points: number
}

function getLevel(points: number) {
  if (points >= 150) return "Referente"
  if (points >= 75) return "Mentor"
  if (points >= 30) return "Colaborador"
  return "Explorador"
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const db = getFirebaseDb()
      if (!db) return setLoading(false)
      const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(300)))
      setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ReviewPost))
      setLoading(false)
    }
    load().catch((error) => { console.error("Error loading community:", error); setLoading(false) })
  }, [])

  const contributors = useMemo(() => {
    const people = new Map<string, Contributor>()
    posts.forEach((post) => {
      const id = post.authorId || post.authorName
      const current = people.get(id) || { id, name: post.authorName, photo: post.authorPhoto, reviews: 0, likes: 0, discussions: 0, points: 0 }
      current.reviews += 1
      current.likes += post.likes || 0
      current.discussions += post.commentsCount || 0
      current.points = current.reviews * 10 + current.likes * 3 + current.discussions
      people.set(id, current)
    })
    return [...people.values()].sort((a, b) => b.points - a.points).slice(0, 25)
  }, [posts])

  return (
    <div className="min-h-screen bg-surface"><Header /><main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8"><div className="flex items-center gap-3"><Trophy className="h-8 w-8 text-warning" /><h1 className="text-3xl font-bold">Comunidad</h1></div><p className="mt-2 text-muted-foreground">Reconocemos las contribuciones que ayudan a otros estudiantes.</p></div>
      <div className="mb-8 grid gap-4 sm:grid-cols-4">{[["Explorador", "0 pts"], ["Colaborador", "30 pts"], ["Mentor", "75 pts"], ["Referente", "150 pts"]].map(([level, points]) => <div key={level} className="rounded-xl border border-border bg-background p-4"><Award className="h-5 w-5 text-primary" /><p className="mt-2 font-semibold">{level}</p><p className="text-xs text-muted-foreground">Desde {points}</p></div>)}</div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : contributors.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Aún no hay contribuciones.</div> : <div className="overflow-hidden rounded-xl border border-border bg-background">{contributors.map((person, index) => <div key={person.id} className="flex items-center gap-4 border-b border-border p-5 last:border-0"><div className="flex w-8 justify-center font-bold text-muted-foreground">{index < 3 ? <Medal className={`h-6 w-6 ${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : "text-amber-600"}`} /> : index + 1}</div><img src={person.photo || "/placeholder.svg?height=44&width=44"} alt={person.name} className="h-11 w-11 rounded-full" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{person.name}</p><p className="text-xs text-primary">{getLevel(person.points)}</p></div><div className="hidden gap-6 text-center sm:flex"><div><p className="font-semibold">{person.reviews}</p><p className="text-xs text-muted-foreground">Reseñas</p></div><div><p className="font-semibold">{person.likes}</p><p className="text-xs text-muted-foreground">Útiles</p></div></div><div className="min-w-16 text-right"><p className="text-lg font-bold text-primary">{person.points}</p><p className="text-xs text-muted-foreground">puntos</p></div></div>)}</div>}
    </main></div>
  )
}
