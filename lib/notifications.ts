import { addDoc, collection, type Firestore } from "firebase/firestore"

export type NotificationType = "answer" | "comment" | "like"

export interface AppNotification {
  id: string
  recipientId: string
  actorId: string
  actorName: string
  type: NotificationType
  title: string
  message: string
  href: string
  read: boolean
  createdAt: string
}

export async function createNotification(
  db: Firestore,
  notification: Omit<AppNotification, "id" | "read" | "createdAt">,
) {
  if (!notification.recipientId || notification.recipientId === notification.actorId) return
  await addDoc(collection(db, "notifications"), {
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  })
}
