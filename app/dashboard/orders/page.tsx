'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCurrency } from '@/lib/use-currency'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import type { Order } from '@/lib/types'
import {
  ShoppingCart,
  Phone,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    pill: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    pill: 'bg-[var(--aro-green)]/10 text-[var(--aro-green)] border-[var(--aro-green)]/20',
    dot: 'bg-[var(--aro-green)]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    pill: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
} as const

type FilterKey = 'all' | Order['status']

export default function OrdersPage() {
  const { user } = useAuth()
  const { fmt } = useCurrency()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [refreshing, setRefreshing] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user) return

    setLoading(true)

    // Setup real-time snapshot listener on Firestore directly
    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef,
      where('businessId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updated: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Order))
        setOrders(updated)
        setLoading(false)
      },
      (err) => {
        console.error('[v0] Orders snapshot error:', err)
        setLoading(false)
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
  }, [user])

  async function handleStatusChange(orderId: string, status: Order['status']) {
    setUpdating(orderId)
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Order ${status}.`)
    } catch (err) {
      console.error('[v0] Error updating order:', err)
      toast.error('Failed to update order.')
    } finally {
      setUpdating(null)
    }
  }

  async function reload() {
    setRefreshing(true)
    try {
      // Force a refresh by triggering a new snapshot listener
      if (unsubscribeRef.current) unsubscribeRef.current()
      
      const ordersRef = collection(db, 'orders')
      const q = query(
        ordersRef,
        where('businessId', '==', user!.uid),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const updated: Order[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Order))
          setOrders(updated)
          setRefreshing(false)
        },
        (err) => {
          console.error('[v0] Orders refresh error:', err)
          setRefreshing(false)
        }
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('[v0] Error refreshing orders:', err)
      setRefreshing(false)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  const totalRevenue = orders
    .filter((o) => o.status === 'confirmed')
    .reduce((s, o) => s + o.amount, 0)

  return (
    <div className="min-h-full bg-background">

      {/* ── Page header ── */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage orders placed through AVA</p>
        </div>
        <button
          onClick={() => reload()}
          disabled={refreshing}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-all disabled:opacity-50"
          aria-label="Refresh orders"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-5 pb-6">

        {/* ── Summary strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Revenue', value: fmt(totalRevenue), icon: TrendingUp, color: 'text-[var(--aro-green)]', bg: 'bg-[var(--aro-green)]/10' },
            { label: 'Pending', value: counts.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Confirmed', value: counts.confirmed, icon: CheckCircle, color: 'text-[var(--aro-green)]', bg: 'bg-[var(--aro-green)]/10' },
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

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-0">
          {(['all', 'pending', 'confirmed', 'cancelled'] as FilterKey[]).map((f) => (
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
              {f === 'confirmed' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--aro-green)]" />}
              {f === 'cancelled' && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
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

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-sm">No orders</p>
              <p className="text-muted-foreground text-xs mt-1">
                {filter === 'all'
                  ? 'Orders will appear here once customers buy through AVA.'
                  : `No ${filter} orders found.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status]
              const StatusIcon = cfg.icon
              const isPending = order.status === 'pending'
              const isUpdating = updating === order.id

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-[var(--aro-green)]/20 transition-all duration-200"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-semibold truncate">{order.productName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-muted-foreground" />
                          <p className="text-muted-foreground text-xs font-mono truncate">{order.userId}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[var(--aro-green)] font-bold text-sm">
                        {fmt(order.amount)}
                      </span>
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', cfg.pill)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Divider + meta */}
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    <p className="text-muted-foreground text-[11px]">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Action bar — pending only */}
                  {isPending && (
                    <div className="flex border-t border-border">
                      <button
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[var(--aro-green)] hover:bg-[var(--aro-green)]/8 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isUpdating ? 'Updating...' : 'Confirm'}
                      </button>
                      <div className="w-px bg-border" />
                      <button
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
