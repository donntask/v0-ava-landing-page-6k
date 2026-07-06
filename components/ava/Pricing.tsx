'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { PricingContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

const PLAN_ACCENTS = ['#25D366', '#00D1B2', '#00a884']

interface PricingProps { content?: PricingContent }

export function Pricing({ content = DEFAULT_CONTENT.pricing }: PricingProps) {
  const [annual, setAnnual] = useState(false)
  const PLANS = content.plans.map((p, i) => ({ ...p, accent: PLAN_ACCENTS[i % PLAN_ACCENTS.length] }))

  return (
    <section id="pricing" className="px-6 py-24 max-w-6xl mx-auto">
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
            <span className="text-gradient">{content.headlineAccent}</span>{' '}
            pricing
          </h2>
          <p className="text-[var(--ava-text-muted)] text-lg max-w-lg mx-auto mb-8">
            {content.subheadline}
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-[var(--ava-surface)] border border-[var(--ava-border)] rounded-xl px-4 py-2">
            <span className={`text-sm font-medium transition-colors ${!annual ? 'text-foreground' : 'text-[var(--ava-text-muted)]'}`}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${annual ? 'bg-[var(--ava-purple)]' : 'bg-[#1a2235]'}`}
              style={{ height: 22, width: 44 }}
            >
              <motion.div
                className="absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow"
                style={{ width: 18, height: 18 }}
                animate={{ left: annual ? 22 : 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? 'text-foreground' : 'text-[var(--ava-text-muted)]'}`}>
              Annual
              <span className="ml-1.5 text-xs text-[var(--ava-teal)] font-bold">-20%</span>
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 flex flex-col ${
              plan.popular
                ? 'animate-pulse-glow'
                : 'bg-[var(--ava-surface)] border border-[var(--ava-border)]'
            }`}
            style={
              plan.popular
                ? {
                    background: 'linear-gradient(145deg, #0d1728, #111827)',
                    border: `1px solid ${plan.accent}50`,
                  }
                : {}
            }
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: plan.accent, color: '#0B0F1A' }}
                >
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              </div>
            )}

            <div className="mb-5">
              <h3 className="text-foreground font-bold text-lg mb-1">{plan.name}</h3>
              <p className="text-[var(--ava-text-muted)] text-sm">{plan.desc}</p>
            </div>

            <div className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={annual ? 'annual' : 'monthly'}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-4xl font-extrabold text-foreground">
                    ${annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-[var(--ava-text-muted)] text-sm">/mo</span>
                </motion.div>
              </AnimatePresence>
              {annual && (
                <p className="text-xs mt-1" style={{ color: plan.accent }}>
                  Billed annually — save ${(plan.monthlyPrice - plan.annualPrice) * 12}/yr
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-2.5 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--ava-text-muted)]">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.accent }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/auth/signup">
              <Button
                className="w-full h-11 rounded-xl font-semibold transition-all"
                style={
                  plan.popular
                    ? { background: plan.accent, color: '#0B0F1A' }
                    : { background: `${plan.accent}18`, color: plan.accent, border: `1px solid ${plan.accent}30` }
                }
              >
                {plan.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
