import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "FindTeacher - Encuentra el mejor profesor",
  description: "Red social universitaria para compartir y descubrir reseñas de profesores",
  authors: [{ name: "JoelDev" }],
   
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
