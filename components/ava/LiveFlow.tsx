'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Package, Bot, Check } from 'lucide-react'
import Image from 'next/image'
import type { LiveFlowContent } from '@/lib/content'
import { DEFAULT_CONTENT } from '@/lib/content'

// Static visual/icon/accent metadata per step — not editable
const STEP_META = [
  {
    icon: Link2,
    accent: '#25D366',
    phone: {
      header: 'WhatsApp Setup',
      body: (
        <div className="p-4 space-y-3">
          <div className="bg-[#1a2235] rounded-xl p-3">
            <p className="text-[#8892a4] text-xs mb-1">Webhook URL</p>
            <p className="text-[#25D366] text-xs font-mono break-all">https://yourapp.com/api/whatsapp/webhook</p>
          </div>
          <div className="flex items-center gap-2 bg-[#00D1B2]/10 border border-[#00D1B2]/25 rounded-xl px-3 py-2">
            <Check className="w-4 h-4 text-[#00D1B2]" />
            <span className="text-[#00D1B2] text-xs font-medium">Webhook verified</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a2235] rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-[#00D1B2] animate-pulse" />
            <span className="text-[#8892a4] text-xs">AVA is listening...</span>
          </div>
        </div>
      ),
    },
  },
  {
    icon: Package,
    accent: '#00D1B2',
    phone: {
      header: 'Product Catalogue',
      body: (
        <div className="p-4 space-y-2">
          {[
            { name: 'Air Max 270', price: '$129', floor: '$110' },
            { name: 'Jordan 1 Retro', price: '$189', floor: '$160' },
            { name: 'Yeezy 350 V2', price: '$249', floor: '$220' },
          ].map((p) => (
            <div key={p.name} className="bg-[#1a2235] rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-medium">{p.name}</p>
                <p className="text-[#8892a4] text-xs">Floor: {p.floor}</p>
              </div>
              <span className="text-[#00D1B2] text-sm font-bold">{p.price}</span>
            </div>
          ))}
        </div>
      ),
    },
  },
  {
    icon: Bot,
    accent: '#00a884',
    phone: {
      header: 'Live Conversations',
      body: (
        <div className="p-4 space-y-2">
          {[
            { msg: 'Customer asks about Air Max', time: '2s ago', status: 'Replied' },
            { msg: 'Price negotiation: $119 agreed', time: '1m ago', status: 'Order created' },
            { msg: 'New inquiry: Jordan 1 size 44', time: '3m ago', status: 'Replied' },
          ].map((c, i) => (
            <div key={i} className="bg-[#1a2235] rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-white text-xs font-medium">{c.msg}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8892a4] text-xs">{c.time}</span>
                <span className="text-[#00a884] text-xs">{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  },
]

interface LiveFlowProps { content?: LiveFlowContent }

export function LiveFlow({ content = DEFAULT_CONTENT.liveflow }: LiveFlowProps) {
  const [activeStep, setActiveStep] = useState(0)

  const STEPS = content.steps.map((s, i) => ({
    ...STEP_META[i % STEP_META.length],
    n: s.n,
    title: s.title,
    desc: s.desc,
  }))

  const step = STEPS[activeStep]

  return (
    <section id="how-it-works" className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-16">
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
          <p className="text-[var(--ava-text-muted)] text-lg max-w-xl mx-auto">
            {content.subheadline}
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Steps list */}
        <div className="flex flex-col gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = activeStep === i
            return (
              <motion.button
                key={s.n + i}
                onClick={() => setActiveStep(i)}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-[var(--ava-surface)] border-opacity-40'
                    : 'bg-transparent border-[var(--ava-border)] hover:bg-[var(--ava-surface)]/50'
                }`}
                style={{
                  borderColor: isActive ? s.accent : undefined,
                  boxShadow: isActive ? `0 0 20px ${s.accent}20` : undefined,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${s.accent}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: s.accent }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: s.accent }}>{s.n}</span>
                      <h3 className="text-foreground font-semibold">{s.title}</h3>
                    </div>
                    <p className="text-[var(--ava-text-muted)] text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Phone mockup */}
        <div className="flex justify-center">
          <div className="relative w-64">
            <div className="bg-[#0d1424] border border-[var(--ava-border)] rounded-[2rem] overflow-hidden shadow-2xl" style={{ boxShadow: `0 0 60px ${step.accent}20` }}>
              <div className="bg-[var(--ava-surface)] px-4 py-3 border-b border-[var(--ava-border)] flex items-center gap-2">
                <Image src="/logo.png" alt="AVA" width={20} height={16} className="object-contain" />
                <span className="text-foreground text-sm font-semibold">{step.phone.header}</span>
                <div className="ml-auto w-2 h-2 rounded-full" style={{ background: step.accent }} />
              </div>
              <div className="min-h-48">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {step.phone.body}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="absolute inset-0 rounded-[2rem] blur-2xl -z-10 scale-90 opacity-30" style={{ background: step.accent }} />
          </div>
        </div>
      </div>
    </section>
  )
}
