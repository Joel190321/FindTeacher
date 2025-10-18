"use client"

import { useAuth } from "@/lib/auth-context"
import { GraduationCap, LogOut, User, Menu, X, UserCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Header() {
  const { user, signInWithGoogle, signInAnonymously, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <GraduationCap className="h-6 w-6 text-primary glow-text" />
          <span className="glow-text">FindTeacher</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Inicio
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Explorar
          </Link>
          {user && (
            <Link
              href="/create"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Publicar
            </Link>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user.isAnonymous ? (
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                  ) : user.photoURL ? (
                    <img
                      src={user.photoURL || "/placeholder.svg"}
                      alt={user.displayName || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              
              <Button
                onClick={signInAnonymously}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 bg-transparent"
              >
                Continuar como Invitado
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/explore"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explorar
            </Link>
            {user && (
              <>
                <Link
                  href="/create"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Publicar
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
              </>
            )}
            <div className="border-t border-border pt-4">
              {user ? (
                <Button variant="outline" onClick={logout} className="w-full bg-transparent">
                  Cerrar Sesión
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  
                  <Button
                    onClick={signInAnonymously}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent"
                  >
                    Continuar como Invitado
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
