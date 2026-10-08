"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { addDoc, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore"
import { HelpCircle, Loader2, MessageCircleQuestion, Send } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFirebaseDb } from "@/lib/firebase"
import { createNotification } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Answer {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

interface Question {
  id: string
  professorSlug: string
  professorName: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  answers?: Answer[]
}

export function ProfessorQuestions({ professorSlug, professorName }: { professorSlug: string; professorName: string }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [question, setQuestion] = useState("")
  const [answering, setAnswering] = useState<string | null>(null)
  const [answer, setAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const db = getFirebaseDb()
    if (!db) return
    const unsubscribe = onSnapshot(query(collection(db, "questions"), where("professorSlug", "==", professorSlug)), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Question)
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setQuestions(data)
    }, (error) => console.error("Error loading questions:", error))
    return unsubscribe
  }, [professorSlug])

  const submitQuestion = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return alert("Inicia sesión para hacer una pregunta")
    if (question.trim().length < 10) return
    setSubmitting(true)
    try {
      const db = getFirebaseDb()
      if (!db) return
      await addDoc(collection(db, "questions"), {
        professorSlug,
        professorName,
        authorId: user.uid,
        authorName: user.displayName || "Usuario",
        content: question.trim(),
        createdAt: new Date().toISOString(),
        answers: [],
      })
      setQuestion("")
    } finally {
      setSubmitting(false)
    }
  }

  const submitAnswer = async (item: Question) => {
    if (!user || answer.trim().length < 2) return
    setSubmitting(true)
    try {
      const db = getFirebaseDb()
      if (!db) return
      const answerData: Answer = {
        id: `${user.uid}-${Date.now()}`,
        authorId: user.uid,
        authorName: user.displayName || "Usuario",
        content: answer.trim(),
        createdAt: new Date().toISOString(),
      }
      await updateDoc(doc(db, "questions", item.id), { answers: arrayUnion(answerData) })
      await createNotification(db, {
        recipientId: item.authorId,
        actorId: user.uid,
        actorName: answerData.authorName,
        type: "answer",
        title: "Respondieron tu pregunta",
        message: `${answerData.authorName} respondió una pregunta sobre ${professorName}.`,
        href: `/professor/${professorSlug}#preguntas`,
      })
      setAnswer("")
      setAnswering(null)
    } catch (error) {
      console.error("Error answering question:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="preguntas" className="mt-10 rounded-2xl border border-border bg-background p-6 md:p-8">
      <div className="flex items-center gap-3"><MessageCircleQuestion className="h-6 w-6 text-primary" /><div><h2 className="text-2xl font-bold">Preguntas y respuestas</h2><p className="text-sm text-muted-foreground">Resuelve dudas concretas con otros estudiantes.</p></div></div>

      <form onSubmit={submitQuestion} className="mt-6 space-y-3">
        <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} minLength={10} maxLength={500} placeholder={`Pregunta sobre clases, evaluaciones o metodología de ${professorName}.`} />
        <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{question.length}/500</span><Button type="submit" disabled={submitting || question.trim().length < 10}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Preguntar</Button></div>
      </form>

      <div className="mt-8 space-y-5">
        {questions.length === 0 ? <div className="py-8 text-center text-muted-foreground"><HelpCircle className="mx-auto mb-3 h-8 w-8" />Aún no hay preguntas.</div> : questions.map((item) => (
          <article key={item.id} className="rounded-xl border border-border p-5">
            <p className="font-medium">{item.content}</p><p className="mt-2 text-xs text-muted-foreground">{item.authorName} · {new Date(item.createdAt).toLocaleDateString("es-DO")}</p>
            {item.answers?.length ? <div className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">{item.answers.map((response) => <div key={response.id}><p className="text-sm">{response.content}</p><p className="mt-1 text-xs text-muted-foreground">{response.authorName}</p></div>)}</div> : null}
            {user && (answering === item.id ? <div className="mt-4 flex gap-2"><Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={500} placeholder="Escribe una respuesta útil" /><div className="flex flex-col gap-2"><Button size="sm" onClick={() => submitAnswer(item)} disabled={submitting || answer.trim().length < 2}>Responder</Button><Button size="sm" variant="ghost" onClick={() => { setAnswering(null); setAnswer("") }}>Cancelar</Button></div></div> : <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAnswering(item.id)}>Responder</Button>)}
          </article>
        ))}
      </div>
    </section>
  )
}
