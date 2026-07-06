'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { TestimonialsContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

const COLORS = ['#25D366', '#00D1B2', '#00a884']

interface TestimonialsProps { content?: TestimonialsContent }

export function Testimonials({ content = DEFAULT_CONTENT.testimonials }: TestimonialsProps) {
  const TESTIMONIALS = content.testimonials.map((t, i) => ({
    ...t,
    color: COLORS[i % COLORS.length],
  }))
  const half = Math.ceil(TESTIMONIALS.length / 2)
  const col1 = TESTIMONIALS.slice(0, half)
  const col2 = TESTIMONIALS.slice(half)

  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
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
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[col1, col2].map((col, ci) => (
          <div key={ci} className="flex flex-col gap-4">
            {col.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (ci * half + i) * 0.07 }}
                className="bg-[var(--ava-surface)] border border-[var(--ava-border)] rounded-2xl p-5 hover:border-opacity-40 transition-all duration-300"
                style={{ '--hover-color': t.color } as React.CSSProperties}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: t.color }} />
                  ))}
                </div>
                <p className="text-[var(--ava-text)] text-sm leading-relaxed mb-4">{'"'}{t.text}{'"'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: `${t.color}30`, border: `1px solid ${t.color}40` }}
                    >
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-foreground text-xs font-semibold">{t.name}</p>
                      <p className="text-[var(--ava-text-muted)] text-xs">{t.role}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: `${t.color}15`, color: t.color }}
                  >
                    {t.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
