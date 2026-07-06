'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import type { FAQContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

interface FAQProps { content?: FAQContent }

export function FAQ({ content = DEFAULT_CONTENT.faq }: FAQProps) {
  const [open, setOpen] = useState<number | null>(null)
  const FAQS = content.items

  return (
    <section id="faq" className="px-6 py-24 max-w-3xl mx-auto">
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[var(--ava-purple-light)] text-sm font-medium uppercase tracking-widest mb-4">{content.sectionLabel}</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            {content.headline}{' '}
            <span className="text-gradient">{content.headlineAccent}</span>
          </h2>
        </motion.div>
      </div>

      <div className="flex flex-col gap-3">
        {FAQS.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-[var(--ava-surface)] border border-[var(--ava-border)] rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-foreground font-medium text-sm pr-4">{faq.q}</span>
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--ava-purple)]/15 flex items-center justify-center">
                {open === i
                  ? <Minus className="w-3.5 h-3.5 text-[var(--ava-purple-light)]" />
                  : <Plus className="w-3.5 h-3.5 text-[var(--ava-purple-light)]" />
                }
              </span>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="px-5 pb-5 text-[var(--ava-text-muted)] text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
