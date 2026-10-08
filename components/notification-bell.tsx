"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return setUnread(0)
    const db = getFirebaseDb()
    if (!db) return
    return onSnapshot(query(collection(db, "notifications"), where("recipientId", "==", user.uid)), (snapshot) => {
      setUnread(snapshot.docs.filter((item) => !item.data().read).length)
    }, (error) => console.error("Error loading notifications:", error))
  }, [user])

  if (!user) return null

  return (
    <Button asChild variant="ghost" size="icon" className="relative rounded-full">
      <Link href="/notifications" aria-label={`${unread} notificaciones sin leer`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
      </Link>
    </Button>
  )
}
