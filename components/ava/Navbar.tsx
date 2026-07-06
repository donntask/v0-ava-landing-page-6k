'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NavbarContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

interface NavbarProps { content?: NavbarContent }

export function Navbar({ content = DEFAULT_CONTENT.navbar }: NavbarProps) {
  const NAV_LINKS = content.links
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-[var(--ava-border)]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/aromsg-logo.png" alt="AroMsg" width={36} height={36} className="object-contain" />
            <span className="font-bold text-xl tracking-tight">
              <span className="text-[var(--aro-green)]">Aro</span>
              <span className="text-foreground">Msg</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[var(--ava-text-muted)] hover:text-foreground text-sm font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-[var(--ava-text-muted)] hover:text-foreground">
                {content.ctaSignIn}
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                size="sm"
                className="shimmer bg-[var(--ava-purple)] hover:bg-[var(--ava-purple-dark)] text-white rounded-xl px-5 font-semibold glow-purple"
              >
                {content.ctaSignUp}
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[var(--ava-text-muted)] hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-[var(--ava-bg)]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 md:hidden"
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-foreground hover:text-[var(--aro-green)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-4 w-56">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-[var(--ava-border)] text-[var(--ava-text-muted)]">
                  {content.ctaSignIn}
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[var(--ava-purple)] hover:bg-[var(--ava-purple-dark)] text-white glow-purple">
                  {content.ctaSignUp}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
