"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, doc, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import type { AppNotification } from "@/lib/notifications"

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { if (!authLoading) setLoading(false); return }
    const db = getFirebaseDb()
    if (!db) return setLoading(false)
    return onSnapshot(query(collection(db, "notifications"), where("recipientId", "==", user.uid)), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AppNotification)
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setNotifications(data)
      setLoading(false)
    }, (error) => { console.error("Error loading notifications:", error); setLoading(false) })
  }, [authLoading, user])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const markAsRead = async (notification: AppNotification) => {
    if (notification.read) return
    const db = getFirebaseDb()
    if (db) await updateDoc(doc(db, "notifications", notification.id), { read: true })
  }

  const markAllAsRead = async () => {
    const db = getFirebaseDb()
    if (!db) return
    const batch = writeBatch(db)
    notifications.filter((item) => !item.read).forEach((item) => batch.update(doc(db, "notifications", item.id), { read: true }))
    await batch.commit()
  }

  return (
    <div className="min-h-screen bg-surface"><Header /><main className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Notificaciones</h1><p className="mt-1 text-muted-foreground">Respuestas e interacciones con tus contribuciones.</p></div>{unreadCount > 0 && <Button variant="outline" onClick={markAllAsRead}><CheckCheck className="mr-2 h-4 w-4" />Marcar todas</Button>}</div>
      {loading || authLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : !user ? <div className="rounded-xl border border-border bg-background p-12 text-center">Inicia sesión para ver tus notificaciones.</div> : notifications.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center"><Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="text-muted-foreground">No tienes notificaciones todavía.</p></div> : <div className="space-y-3">{notifications.map((item) => <Link key={item.id} href={item.href} onClick={() => markAsRead(item)} className={`block rounded-xl border p-5 transition-colors hover:border-primary/50 ${item.read ? "border-border bg-background" : "border-primary/30 bg-primary/5"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("es-DO")}</p></div>{!item.read && <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-primary" />}</div></Link>)}</div>}
    </main></div>
  )
}
