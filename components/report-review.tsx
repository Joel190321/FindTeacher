"use client"

import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { Flag, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const REPORT_REASONS = [
  { value: "offensive", label: "Lenguaje ofensivo o acoso" },
  { value: "personal_data", label: "Información personal" },
  { value: "spam", label: "Spam o contenido engañoso" },
  { value: "false_review", label: "Reseña posiblemente falsa" },
  { value: "other", label: "Otro motivo" },
]

export function ReportReview({ postId, postAuthorId }: { postId: string; postAuthorId?: string }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitReport = async () => {
    if (!user) return alert("Inicia sesión para reportar contenido")
    if (!reason) return
    setSubmitting(true)
    try {
      const db = getFirebaseDb()
      if (!db) throw new Error("Firestore not initialized")
      await setDoc(doc(db, "reports", `${postId}_${user.uid}`), {
        postId,
        postAuthorId: postAuthorId || null,
        reporterId: user.uid,
        reason,
        details: details.trim().slice(0, 500),
        status: "pending",
        createdAt: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (error) {
      console.error("Error reporting review:", error)
      alert("No se pudo enviar el reporte")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setTimeout(() => setSubmitted(false), 200) }}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"><Flag className="h-4 w-4" />Reportar</Button></DialogTrigger>
      <DialogContent>
        {submitted ? (
          <><DialogHeader><DialogTitle>Reporte recibido</DialogTitle><DialogDescription>Gracias por ayudar a mantener la comunidad segura. El contenido quedó pendiente de revisión.</DialogDescription></DialogHeader><DialogFooter><Button onClick={() => setOpen(false)}>Cerrar</Button></DialogFooter></>
        ) : (
          <>
            <DialogHeader><DialogTitle>Reportar reseña</DialogTitle><DialogDescription>Selecciona el motivo. No uses el reporte solo porque no estás de acuerdo con una opinión.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Motivo</Label><Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger><SelectContent>{REPORT_REASONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="report-details">Detalles opcionales</Label><Textarea id="report-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={500} placeholder="Explica brevemente qué debería revisar el equipo." /><p className="text-right text-xs text-muted-foreground">{details.length}/500</p></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submitReport} disabled={!reason || submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar reporte</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
