'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Star, Download, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatDemo } from './ChatDemo'
import type { HeroContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'
import { usePWAInstall } from '@/lib/use-pwa-install'

interface HeroProps { content?: HeroContent }

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const AVATARS = ['#25D366', '#00a884', '#128C7E', '#075E54', '#4fde82']

export function Hero({ content = DEFAULT_CONTENT.hero }: HeroProps) {
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall()

  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-[var(--ava-purple)]/10 border border-[var(--ava-purple)]/25 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--ava-teal)] animate-pulse" />
            <span className="text-[var(--ava-purple-light)] text-sm font-medium">{content.badge}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[1.08] tracking-tight mb-6 text-balance"
          >
            {content.headline}{' '}
            <span className="text-gradient-pink">{content.headlineAccent}</span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp} className="text-[var(--ava-text-muted)] text-lg leading-relaxed mb-10 max-w-lg text-pretty">
            {content.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="shimmer bg-[var(--ava-purple)] hover:bg-[var(--ava-purple-dark)] text-white rounded-xl h-12 px-8 text-base font-semibold gap-2 glow-purple transition-all"
              >
                {content.ctaPrimary}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl h-12 px-8 text-base border-[var(--ava-border)] text-[var(--ava-text-muted)] hover:text-foreground hover:bg-[var(--ava-surface-2)] transition-all"
              >
                {content.ctaSecondary}
              </Button>
            </Link>
            {/* PWA install — only shown on Android when browser fires beforeinstallprompt */}
            {isInstallable && !isInstalled && (
              <Button
                size="lg"
                onClick={triggerInstall}
                className="rounded-xl h-12 px-8 text-base font-semibold gap-2 bg-[var(--aro-teal)] hover:bg-[var(--aro-teal-dark)] text-white transition-all"
              >
                <Download className="w-5 h-5" />
                Download App
              </Button>
            )}
            {isInstalled && (
              <div className="flex items-center gap-2 text-sm text-[var(--ava-text-muted)]">
                <CheckCircle className="w-4 h-4 text-[var(--aro-green)]" />
                App installed
              </div>
            )}
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {AVATARS.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[var(--ava-bg)] flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {['JK', 'AM', 'LB', 'TP', 'SR'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[var(--ava-teal)] text-[var(--ava-teal)]" />
                ))}
              </div>
              <p className="text-[var(--ava-text-muted)] text-xs mt-0.5">
                {content.socialProofText}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — Chat demo */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex justify-center lg:justify-end"
        >
          <ChatDemo />
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--ava-border)] rounded-2xl overflow-hidden border border-[var(--ava-border)]"
      >
        {content.stats.map((s) => (
          <div key={s.label} className="bg-[var(--ava-surface)] px-6 py-5 text-center">
            <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-[var(--ava-text-muted)] text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
