"use client"

import { useEffect, useState } from "react"
import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore"
import { Heart, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

export function FavoriteProfessorButton({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadFavorite = async () => {
      if (!user) return setFavorite(false)
      const db = getFirebaseDb()
      if (!db) return
      const snapshot = await getDoc(doc(db, "users", user.uid))
      setFavorite((snapshot.data()?.favoriteProfessors || []).includes(slug))
    }
    loadFavorite().catch((error) => console.error("Error loading favorite professor:", error))
  }, [slug, user])

  const toggleFavorite = async () => {
    if (!user) return alert("Inicia sesión para guardar profesores")
    setLoading(true)
    try {
      const db = getFirebaseDb()
      if (!db) return
      await setDoc(doc(db, "users", user.uid), {
        favoriteProfessors: favorite ? arrayRemove(slug) : arrayUnion(slug),
      }, { merge: true })
      setFavorite((current) => !current)
    } catch (error) {
      console.error("Error updating favorite professor:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={favorite ? "default" : "outline"} onClick={toggleFavorite} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className={`mr-2 h-4 w-4 ${favorite ? "fill-current" : ""}`} />}
      {favorite ? "En favoritos" : "Guardar profesor"}
    </Button>
  )
}
