'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCurrency } from '@/lib/use-currency'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import {
  Wallet,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Hash,
  Building2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Payout {
  id: string
  ref: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  bank?: string
  account?: string
  accountName?: string
  note?: string
  createdAt: number
  paidAt?: number
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    pill: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    pill: 'bg-[var(--aro-green)]/10 text-[var(--aro-green)] border-[var(--aro-green)]/20',
    dot: 'bg-[var(--aro-green)]',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    pill: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
} as const

type FilterKey = 'all' | Payout['status']

export default function PayoutsPage() {
  const { user } = useAuth()
  const { fmt } = useCurrency()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const unsubscribeRef = useRef<(() => void) | null>(null)

  function subscribe() {
    if (!user) return
    if (unsubscribeRef.current) unsubscribeRef.current()

    const ref = collection(db, 'businesses', user.uid, 'payouts')
    const q = query(ref, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPayouts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payout)))
        setLoading(false)
        setRefreshing(false)
      },
      (err) => {
        console.error('[v0] Payouts snapshot error:', err)
        setLoading(false)
        setRefreshing(false)
      },
    )
    unsubscribeRef.current = unsub
  }

  useEffect(() => {
    if (!user) return
    subscribe()
    return () => { if (unsubscribeRef.current) unsubscribeRef.current() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function reload() {
    setRefreshing(true)
    subscribe()
  }

  const filtered = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter)
  const counts = {
    all: payouts.length,
    pending: payouts.filter((p) => p.status === 'pending').length,
    paid: payouts.filter((p) => p.status === 'paid').length,
    failed: payouts.filter((p) => p.status === 'failed').length,
  }
  const totalPaid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payouts.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="min-h-full bg-background">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your payout history and pending withdrawals</p>
        </div>
        <button
          onClick={reload}
          disabled={refreshing}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-all disabled:opacity-50"
          aria-label="Refresh payouts"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-5 pb-6">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Paid', value: fmt(totalPaid), icon: CheckCircle, color: 'text-[var(--aro-green)]', bg: 'bg-[var(--aro-green)]/10' },
            { label: 'Pending', value: fmt(totalPending), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'All Time', value: counts.all, icon: Wallet, color: 'text-foreground', bg: 'bg-secondary' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg)}>
                <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {(['all', 'pending', 'paid', 'failed'] as FilterKey[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                filter === f
                  ? 'bg-[var(--aro-green)] text-[var(--aro-bg)] border-[var(--aro-green)]'
                  : 'text-muted-foreground border-border hover:text-foreground hover:bg-secondary',
              )}
            >
              {f === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              {f === 'paid' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--aro-green)]" />}
              {f === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                filter === f ? 'bg-[var(--aro-bg)]/20 text-[var(--aro-bg)]' : 'bg-secondary text-muted-foreground',
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-sm">No payouts</p>
              <p className="text-muted-foreground text-xs mt-1">
                {filter === 'all'
                  ? 'Payout records will appear here once processed.'
                  : `No ${filter} payouts found.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((payout) => {
              const cfg = STATUS_CONFIG[payout.status]
              const StatusIcon = cfg.icon
              return (
                <div
                  key={payout.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-[var(--aro-green)]/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-semibold font-mono truncate">{payout.ref}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {payout.bank && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
                              <p className="text-muted-foreground text-xs truncate">{payout.bank}</p>
                            </div>
                          )}
                          {payout.account && (
                            <p className="text-muted-foreground text-xs font-mono">{payout.account}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[var(--aro-green)] font-bold text-sm">
                        {fmt(payout.amount)}
                      </span>
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', cfg.pill)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    <p className="text-muted-foreground text-[11px]">
                      {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                    </p>
                    {payout.note && (
                      <>
                        <span className="text-muted-foreground/40 text-[11px]">·</span>
                        <p className="text-muted-foreground text-[11px] truncate">{payout.note}</p>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
