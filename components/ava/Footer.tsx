'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FooterContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

// Static SVG icons — only the href is editable via admin
const SOCIAL_ICONS = [
  {
    key: 'twitter',
    label: 'Twitter',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

interface FooterProps { content?: FooterContent }

export function Footer({ content = DEFAULT_CONTENT.footer }: FooterProps) {
  return (
    <footer className="relative overflow-hidden">
      {/* CTA band */}
      <div className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <motion.div
          className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-[var(--ava-purple)]/8 blur-[100px] pointer-events-none"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[var(--ava-teal)]/6 blur-[100px] pointer-events-none"
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 bg-[var(--ava-surface)] border border-[var(--ava-border)] rounded-3xl p-12 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-5 text-balance">
              {content.ctaHeadline}{' '}
              <span className="text-gradient-pink">{content.ctaHeadlineAccent}</span>
            </h2>
            <p className="text-[var(--ava-text-muted)] text-lg mb-8 max-w-xl mx-auto text-pretty">
              {content.ctaSubheadline}
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="shimmer bg-[var(--ava-purple)] hover:bg-[var(--ava-purple-dark)] text-white rounded-xl px-10 h-12 text-base font-semibold gap-2 glow-purple"
              >
                {content.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-8 mt-10 pt-10 border-t border-[var(--ava-border)]">
              {content.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[var(--ava-text-muted)] text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="border-t border-[var(--ava-border)] px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/aromsg-logo.png" alt="AroMsg" width={32} height={32} className="object-contain" />
              <span className="font-bold text-xl">
                <span className="text-[var(--aro-green)]">Aro</span>
                <span className="text-foreground">Msg</span>
              </span>
            </Link>
            <p className="text-[var(--ava-text-muted)] text-sm leading-relaxed max-w-xs">
              {content.brandTagline}
            </p>
            <div className="flex items-center gap-3 mt-5">
              {SOCIAL_ICONS.map((s) => (
                <Link
                  key={s.key}
                  href={content.socialLinks[s.key as keyof typeof content.socialLinks] || '#'}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-[var(--ava-surface-2)] border border-[var(--ava-border)] flex items-center justify-center text-[var(--ava-text-muted)] hover:text-foreground hover:border-[var(--ava-purple)]/40 transition-all"
                >
                  {s.icon}
                </Link>
              ))}
            </div>
            {/* Contact info */}
            {(content.contact.email || content.contact.phone || content.contact.address) && (
              <div className="mt-4 flex flex-col gap-1">
                {content.contact.email && <p className="text-[var(--ava-text-muted)] text-xs">{content.contact.email}</p>}
                {content.contact.phone && <p className="text-[var(--ava-text-muted)] text-xs">{content.contact.phone}</p>}
                {content.contact.address && <p className="text-[var(--ava-text-muted)] text-xs">{content.contact.address}</p>}
              </div>
            )}
          </div>

          {/* Link cols */}
          {content.linkGroups.map((group) => (
            <div key={group.group}>
              <p className="text-foreground font-semibold text-sm mb-4">{group.group}</p>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[var(--ava-text-muted)] hover:text-foreground text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--ava-border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--ava-text-muted)] text-xs">{content.copyright}</p>
          <p className="text-[var(--ava-text-muted)] text-xs">{content.poweredBy}</p>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--ava-surface)]/95 backdrop-blur-xl border-t border-[var(--ava-border)] px-4 py-3">
        <Link href="/auth/signup">
          <Button className="w-full bg-[var(--ava-purple)] hover:bg-[var(--ava-purple-dark)] text-white rounded-xl h-11 font-semibold glow-purple">
            {content.ctaButton}
          </Button>
        </Link>
      </div>
    </footer>
  )
}
