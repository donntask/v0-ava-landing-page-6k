'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  MessageSquare, Package, ShoppingCart, Zap,
  Bot, Shield, TrendingUp,   Clock,
} from 'lucide-react'
import type { BentoContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

// Fixed visual/icon/size/accent metadata — not editable, only text is editable
const CARD_META = [
  { icon: MessageSquare, size: 'lg', accent: '#25D366', visual: 'chat' },
  { icon: Package, size: 'sm', accent: '#00a884', visual: 'products' },
  { icon: ShoppingCart, size: 'sm', accent: '#4fde82', visual: 'orders' },
  { icon: Shield, size: 'md', accent: '#25D366', visual: 'negotiation' },
  { icon: Zap, size: 'md', accent: '#00a884', visual: 'speed' },
  { icon: Bot, size: 'sm', accent: '#4fde82', visual: 'bot' },
  { icon: TrendingUp, size: 'sm', accent: '#25D366', visual: 'analytics' },
  { icon: Clock, size: 'lg', accent: '#00a884', visual: 'clock' },
]

const BAR_DATA = [40, 65, 45, 80, 55, 90, 70]

function MiniVisual({ visual, accent }: { visual: string; accent: string }) {
  if (visual === 'chat') {
    return (
      <div className="flex flex-col gap-1.5 mt-3">
        {['Can you do $110?', 'Best I can do is $119 — free delivery included!', 'Deal!'].map((t, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[70%] px-2.5 py-1.5 rounded-xl text-xs"
              style={{
                background: i % 2 === 0 ? `${accent}30` : 'rgba(26,34,53,0.8)',
                color: i % 2 === 0 ? accent : '#8892a4',
                border: `1px solid ${accent}20`,
              }}
            >
              {t}
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (visual === 'analytics') {
    return (
      <div className="flex items-end gap-1 mt-3 h-10">
        {BAR_DATA.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: `${accent}50` }}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
          />
        ))}
      </div>
    )
  }
  if (visual === 'speed') {
    return (
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[#1a2235] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            initial={{ width: '0%' }}
            animate={{ width: '95%' }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <span className="text-xs font-bold" style={{ color: accent }}>{'<1s'}</span>
      </div>
    )
  }
  return null
}

interface MergedCard { icon: typeof MessageSquare; title: string; desc: string; size: string; accent: string; visual: string }
function BentoCard({ card, index }: { card: MergedCard; index: number }) {
  const Icon = card.icon
  const cardRef = useRef<HTMLDivElement>(null)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={`relative group bg-[var(--ava-surface)] rounded-2xl p-5 overflow-hidden cursor-default transition-transform duration-300 hover:-translate-y-1 ${
        card.size === 'lg' ? 'md:col-span-2' : card.size === 'md' ? 'md:col-span-1' : ''
      }`}
      style={{ border: '1px solid rgba(37,211,102,0.12)' }}
    >
      {/* Radial border glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(200px circle at ${glowPos.x}% ${glowPos.y}%, ${card.accent}18, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{
          border: `1px solid ${card.accent}35`,
        }}
      />

      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${card.accent}18` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: card.accent, width: 18, height: 18 }} />
      </div>

      <h3 className="text-foreground font-semibold text-sm mb-1.5">{card.title}</h3>
      <p className="text-[var(--ava-text-muted)] text-xs leading-relaxed">{card.desc}</p>

      <MiniVisual visual={card.visual} accent={card.accent} />
    </motion.div>
  )
}

interface BentoGridProps { content?: BentoContent }

export function BentoGrid({ content = DEFAULT_CONTENT.bento }: BentoGridProps) {
  const CARDS: MergedCard[] = content.cards.map((c, i) => ({
    ...CARD_META[i % CARD_META.length],
    title: c.title,
    desc: c.desc,
  }))

  return (
    <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[var(--ava-purple-light)] text-sm font-medium uppercase tracking-widest mb-4">{content.sectionLabel}</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            {content.headline}{' '}
            <span className="text-gradient">{content.headlineAccent}</span>
          </h2>
          <p className="text-[var(--ava-text-muted)] text-lg max-w-xl mx-auto text-pretty">
            {content.subheadline}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARDS.map((card, i) => (
          <BentoCard key={card.title + i} card={card} index={i} />
        ))}
      </div>
    </section>
  )
}
