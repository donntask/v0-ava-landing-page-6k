'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { Contact, Business } from '@/lib/types'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import {
  Send,
  Loader2,
  SmartphoneNfc,
  Unplug,
  Bot,
  Settings,
  Plus,
  Search,
  Trash2,
  X,
  ArrowLeft,
  Wifi,
  WifiOff,
  Copy,
  CheckCheck,
  MessageSquare,
  Phone,
  Bell,
  BellOff,
  Download,
  Zap,
  Activity,
  ChevronRight,
  Eraser,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'

function resolveGateway(raw?: string): string {
  const url = (raw || 'https://aromsg.up.railway.app').trim().replace(/\/$/, '')
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}
const GATEWAY = resolveGateway(process.env.NEXT_PUBLIC_GATEWAY_URL)

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  ts: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phoneFromJid(jid: string) {
  return jid.replace(/@.*/, '')
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-emerald-500/20 text-emerald-400',
  'bg-teal-500/20 text-teal-400',
  'bg-green-500/20 text-green-400',
  'bg-cyan-500/20 text-cyan-400',
]
function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Status Dot ──────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'idle' | 'loading' | 'qr' | 'connected' }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full shrink-0',
      status === 'connected'
        ? 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)] animate-pulse'
        : status === 'loading' || status === 'qr'
        ? 'bg-yellow-400 shadow-[0_0_6px_2px_rgba(250,204,21,0.5)] animate-pulse'
        : 'bg-red-500 shadow-[0_0_4px_1px_rgba(239,68,68,0.4)]',
    )} />
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ contact, size = 'md' }: { contact: Contact; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold shrink-0', sz, avatarColor(contact.name))}>
      {initials(contact.name)}
    </div>
  )
}

// ─── Modal Overlay ────────────────────────────────────────────────────────────

function Modal({
  open, onClose, title, children, size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full flex flex-col shadow-2xl',
        'max-h-[94vh] sm:max-h-[88vh] overflow-hidden',
        widths[size],
      )}>
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="text-base font-semibold text-foreground">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-hide">{children}</div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { user } = useAuth()

  // Connection
  const [status, setStatus] = useState<'idle' | 'loading' | 'qr' | 'connected'>('idle')
  const [qrSrc, setQrSrc] = useState('')
  const [phone, setPhone] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCheckedRef = useRef(false)
  const [initialising, setInitialising] = useState(true)

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)

  // Webhook + copy
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [deletingContact, setDeletingContact] = useState<string | null>(null)

  // Chat — sourced from Firestore, not in-memory
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // AI settings
  const [business, setBusiness] = useState<Business | null>(null)
  const [togglingUAI, setTogglingUAI] = useState(false)

  // Mobile view
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  // PWA install
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [pwaInstalled, setPwaInstalled] = useState(false)

  // Unread badge map
  const [unread, setUnread] = useState<Record<string, number>>({})

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)

    // Notification permission
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }

    // PWA install prompt
    const handleInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true)
    }
    window.addEventListener('appinstalled', () => setPwaInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handleInstall)
  }, [])

  // Single source of truth for session check on mount
  useEffect(() => {
    if (!user || hasCheckedRef.current) return
    hasCheckedRef.current = true
    checkExistingSession()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selected])

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (msgPollRef.current) msgPollRef.current()
  }, [])

  // ── Notifications ─────────────────────────────────────────────────────────

  async function requestNotifications() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === 'granted') toast.success('Notifications enabled')
    else toast.error('Notifications blocked')
  }

  function sendNotification(title: string, body: string, icon?: string) {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    new Notification(title, { body, icon: icon || '/aromsg-logo.png' })
  }

  // ── PWA ───────────────────────────────────────────────────────────────────

  async function handleInstallPWA() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setPwaInstalled(true); setDeferredPrompt(null) }
  }

  // ── Contacts ──────────────────────────────────────────────────────────────

  async function loadContacts() {
    if (!user) return
    setContactsLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/contacts?userId=${user.uid}`)
      const data = await res.json()
      if (data.contacts) {
        console.log('[v0] Loaded contacts from API:', data.contacts.length)
        setContacts(data.contacts)
      } else {
        toast.error('Failed to load contacts')
      }
    } catch (err) {
      console.error('[v0] Error loading contacts:', err)
      toast.error('Failed to load contacts')
    } finally {
      setContactsLoading(false)
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newPhone.trim()) return
    const rawPhone = newPhone.trim().replace(/\D/g, '')
    const jid = `${rawPhone}@s.whatsapp.net`
    if (contacts.find((c) => c.jid === jid)) {
      toast.error('Contact already exists')
      return
    }
    setAddingContact(true)
    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          phone: rawPhone,
          name: newName.trim() || rawPhone,
          aiEnabled: false,
        }),
      })
      const data = await res.json()
      if (data.contact) {
        console.log('[v0] Contact created:', data.contact)
        setContacts((prev) => [data.contact, ...prev])
        setNewPhone('')
        setNewName('')
        setShowAddModal(false)
        setSelected(data.contact)
        setMobileView('chat')
        toast.success('Contact saved')
      }
    } catch (err) {
      console.error('[v0] Error adding contact:', err)
      toast.error('Failed to save contact')
    } finally {
      setAddingContact(false)
    }
  }

  async function handleUpdateContact(id: string, patch: Partial<Contact>) {
    if (!user) return
    try {
      const target = contacts.find((c) => c.id === id)
      if (!target) return
      
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          phone: target.phone,
          name: patch.name || target.name,
          aiEnabled: patch.aiEnabled !== undefined ? patch.aiEnabled : target.aiEnabled,
        }),
      })
      const data = await res.json()
      if (data.contact) {
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
        if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...patch } : prev)
      }
    } catch (err) {
      console.error('[v0] Error updating contact:', err)
      toast.error('Failed to update contact')
    }
  }

  async function handleDeleteContact(id: string) {
    if (!user) return
    setDeletingContact(id)
    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, contactId: id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setContacts((prev) => prev.filter((c) => c.id !== id))
      if (selected?.id === id) { setSelected(null); setMobileView('list') }
      toast.success('Contact removed')
    } catch (err) {
      console.error('[v0] Error deleting contact:', err)
      toast.error('Failed to delete contact')
    } finally {
      setDeletingContact(null)
    }
  }

  // ── Gateway ───────────────────────────────────────────────────────────────

  async function checkExistingSession() {
    if (!user) return
    setInitialising(true)
    try {
      // 1. Check DB for whatsappConnected flag and business settings
      const businessRes = await fetch(`/api/business/${user.uid}`)
      const businessData = await businessRes.json() as { business?: Business }
      if (businessData.business) {
        setBusiness(businessData.business)
        if (businessData.business.whatsappConnected === true) {
          setStatus('connected')
          setPhone(businessData.business.whatsappPhone || 'Connected')
          console.log('[v0] Auto-connected via DB flag')
        }
      }

      // 2. Also check gateway for real-time status
      const res = await fetch(`${GATEWAY}/status/${user.uid}`)
      const data = await res.json() as { connected: boolean; phoneNumber?: string | null }
      if (data.connected === true) {
        setStatus('connected')
        setPhone(data.phoneNumber || 'Connected')
      }
    } catch (err) {
      // Gateway offline or unreachable — session is idle
      console.error('[v0] checkExistingSession error:', err)
    } finally {
      // Always load contacts regardless of session state
      await loadContacts()
      setInitialising(false)
    }
  }

  async function handleConnect() {
    if (!user) return
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setQrSrc('')
    setStatus('loading')

    try {
      await fetch(`${GATEWAY}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      let qrAttempts = 0, statusAttempts = 0
      let done = false, qrShowing = false, lastQr = ''

      pollRef.current = setInterval(async () => {
        if (done) return
        try {
          if (!qrShowing) {
            qrAttempts++
            const qrRes = await fetch(`${GATEWAY}/qr/${user.uid}`)
            const qrData = await qrRes.json() as { qr?: string | null; connected: boolean }

            if (qrData.connected === true) {
              done = true; clearInterval(pollRef.current!); pollRef.current = null
              const sRes = await fetch(`${GATEWAY}/status/${user.uid}`)
              const sData = await sRes.json() as { connected: boolean; phoneNumber?: string | null }
              const num = sData.phoneNumber || 'Connected'
              setStatus('connected'); setPhone(num); setQrSrc('')
              setShowConnectModal(false)
              sendNotification('WhatsApp Connected', `Linked to ${num}`)
              toast.success('WhatsApp connected!')
              return
            }

            if (qrData.qr) {
              lastQr = qrData.qr; setQrSrc(qrData.qr); setStatus('qr'); qrShowing = true
            } else if (qrAttempts >= 20) {
              done = true; clearInterval(pollRef.current!); pollRef.current = null
              setStatus('idle')
              toast.error('No QR returned. Check your gateway.')
            }
          } else {
            statusAttempts++
            if (statusAttempts % 3 === 0) {
              const fq = await fetch(`${GATEWAY}/qr/${user.uid}`)
              const fqd = await fq.json() as { qr?: string | null }
              if (fqd.qr && fqd.qr !== lastQr) { lastQr = fqd.qr; setQrSrc(fqd.qr) }
            }
            const sRes = await fetch(`${GATEWAY}/status/${user.uid}`)
            const sData = await sRes.json() as { connected: boolean; phoneNumber?: string | null }
            if (sData.connected === true) {
              done = true; clearInterval(pollRef.current!); pollRef.current = null
              const num = sData.phoneNumber || 'Connected'
              setStatus('connected'); setPhone(num); setQrSrc('')
              setShowConnectModal(false)
              sendNotification('WhatsApp Connected', `Linked to ${num}`)
              toast.success('WhatsApp connected!')
            } else if (statusAttempts >= 90) {
              done = true; clearInterval(pollRef.current!); pollRef.current = null
              setStatus('idle'); setQrSrc('')
              toast.error('Timed out. Please try again.')
            }
          }
        } catch { /* keep polling */ }
      }, 1000)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg); setStatus('idle')
    }
  }

  async function handleDisconnect() {
    if (!user) return
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    try {
      await fetch(`${GATEWAY}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
    } catch { /* best effort */ }
    setStatus('idle'); setQrSrc(''); setPhone('')
    setShowSettingsModal(false)
    toast.info('Disconnected from WhatsApp')
  }

  // ── Chat — Firestore source of truth ─────────────────────────────────────

  async function loadInitialMessages(contact: Contact) {
    if (!user) return
    setMessagesLoading(true)
    // Pass bare JID (phone only) so the server query matches contactJid field
    const bareJid = contact.jid.replace('@s.whatsapp.net', '').replace('@lid', '')
    try {
      const res = await fetch(
        `/api/whatsapp/messages?userId=${user.uid}&from=${encodeURIComponent(bareJid)}`,
      )
      const data = await res.json()
      if (data.messages) {
        const mapped: ChatMessage[] = (data.messages as Record<string, unknown>[])
          .map((m) => ({
            id:   (m.id as string) || `${m.messageId}`,
            role: (m.role as string) === 'assistant' ? 'assistant' : 'user',
            text: (m.text as string) || '',
            ts:   (m.timestamp as number) || Date.now(),
          }))
          .sort((a, b) => a.ts - b.ts)
        setMessages(mapped)
      }
    } catch (err) {
      console.error('[v0] loadInitialMessages error:', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  function listenToMessagesSnapshot(contact: Contact) {
    if (!user) return

    // Unsubscribe from any previous listener
    if (msgPollRef.current) msgPollRef.current()

    // Normalise JID to bare phone number — matches what the webhook stores as contactJid
    const bareJid = contact.jid.replace('@s.whatsapp.net', '').replace('@lid', '')

    const messagesRef = collection(db, 'businesses', user.uid, 'whatsapp_messages')
    const q = query(
      messagesRef,
      where('contactJid', '==', bareJid),
      orderBy('timestamp', 'asc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapped: ChatMessage[] = snapshot.docs.map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          role: (d.role as string) === 'assistant' ? 'assistant' : 'user',
          text: (d.text as string) || '',
          ts: (d.timestamp as number) || Date.now(),
        }
      })
      // Sort by timestamp in case Firestore returns out of order
      mapped.sort((a, b) => a.ts - b.ts)
      setMessages(mapped)
    }, (err) => {
      console.error('[v0] Snapshot listener error:', err)
    })

    msgPollRef.current = unsubscribe
  }

  async function handleClearHistory() {
    if (!user || !selected) return
    setClearingHistory(true)
    try {
      const res = await fetch('/api/whatsapp/clear-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, contactJid: selected.jid }),
      })
      if (!res.ok) throw new Error('Failed to clear')
      setMessages([])
      toast.success('Chat history cleared')
    } catch (err) {
      toast.error('Failed to clear history')
    } finally {
      setClearingHistory(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selected || !user) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, to: selected.jid, text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data as Record<string, string>).error || 'Failed to send')
      // Message will appear automatically via snapshot listener
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handleToggleUniversalAI() {
    if (!user || !business) return
    setTogglingUAI(true)
    try {
      const res = await fetch(`/api/business/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universalAIResponse: business.universalAIResponse !== false }),
      })
      const data = await res.json() as { business?: Business }
      if (data.business) {
        setBusiness(data.business)
        toast.success(`AI auto-response ${data.business.universalAIResponse === false ? 'disabled' : 'enabled'}`)
      }
    } catch (err) {
      console.error('[v0] Error toggling AI auto-response:', err)
      toast.error('Failed to update setting')
    } finally {
      setTogglingUAI(false)
    }
  }

  function selectContact(contact: Contact) {
    setSelected(contact)
    setMobileView('chat')
    setUnread((prev) => ({ ...prev, [contact.id]: 0 }))
    setMessages([])
    loadInitialMessages(contact)
    listenToMessagesSnapshot(contact)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isConnected = status === 'connected'
  const connectBusy = status === 'loading' || status === 'qr'
  const filteredContacts = contacts.filter(
    (c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch),
  )
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0)

  // ── Loading ───────────────────────────────────────────────────────────────

  if (!user || initialising) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-112px)] lg:h-screen gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[var(--aro-green)] animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">Checking session…</p>
      </div>
    )
  }

  // ── Not Connected Screen ──────────────────────────────────────────────────

  if (!isConnected && !connectBusy) {
    return (
      <div className="flex flex-col h-[calc(100vh-112px)] lg:h-screen bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 lg:px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[var(--aro-green)]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">WhatsApp</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusDot status={status} />
                <span className="text-xs text-muted-foreground">Not connected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* PWA download */}
            {!pwaInstalled && deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Install App</span>
              </button>
            )}
            {/* Notifications */}
            <button
              onClick={requestNotifications}
              className={cn(
                'p-2 rounded-xl border transition-colors',
                notifPermission === 'granted'
                  ? 'bg-[var(--aro-green)]/10 border-[var(--aro-green)]/20 text-[var(--aro-green)]'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
              )}
              aria-label="Notification settings"
            >
              {notifPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-[var(--aro-green)]/10 border-2 border-[var(--aro-green)]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-14 h-14 fill-[var(--aro-green)]/60">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">!</span>
            </span>
          </div>

          <div className="text-center space-y-2 max-w-xs">
            <h2 className="text-xl font-bold text-foreground">Connect WhatsApp</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Link your WhatsApp number to start receiving messages and let your AI agent handle conversations.
            </p>
          </div>

          <Button
            onClick={() => { setShowConnectModal(true); handleConnect() }}
            className="h-14 px-8 text-base font-bold bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-2xl shadow-lg shadow-[var(--aro-green)]/20 gap-3"
          >
            <SmartphoneNfc className="w-5 h-5" />
            Connect WhatsApp
          </Button>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--aro-green)]" />
              End-to-end encrypted
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--aro-green)]" />
              AI-powered replies
            </div>
          </div>
        </div>

        {/* Connect Modal */}
        <Modal
          open={showConnectModal}
          onClose={() => { if (status !== 'qr') setShowConnectModal(false) }}
          title={
            <div className="flex items-center gap-2">
              <StatusDot status={status} />
              <span>{status === 'qr' ? 'Scan QR Code' : status === 'loading' ? 'Initialising…' : 'Connect WhatsApp'}</span>
            </div>
          }
          size="sm"
        >
          <div className="p-6 space-y-6">
            {status === 'loading' && !qrSrc && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-[var(--aro-green)] animate-spin" />
                <p className="text-sm text-muted-foreground">Starting gateway session…</p>
              </div>
            )}

            {status === 'qr' && qrSrc && (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-3xl shadow-md">
                    <img src={qrSrc} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-foreground">Scan with WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Open WhatsApp → Settings → Linked Devices → Link a Device
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    Waiting for scan — QR refreshes automatically
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How to scan</p>
                  {[
                    'Open WhatsApp on your phone',
                    'Go to Settings → Linked Devices',
                    'Tap "Link a Device"',
                    'Point your camera at the QR code',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-[var(--aro-green)]/15 text-[var(--aro-green)] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    )
  }

  // ── Connecting spinner ────────────────────────────────────────────────────

  if (connectBusy && showConnectModal) {
    return (
      <div className="flex flex-col h-[calc(100vh-112px)] lg:h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--aro-green)] animate-spin" />
        <p className="text-muted-foreground text-sm mt-3">Connecting…</p>
        <Modal
          open={showConnectModal}
          onClose={() => {}}
          title={<div className="flex items-center gap-2"><StatusDot status={status} /><span>Connecting…</span></div>}
          size="sm"
        >
          <div className="p-6 space-y-6">
            {!qrSrc ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-[var(--aro-green)] animate-spin" />
                <p className="text-sm text-muted-foreground">Starting gateway session…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-3xl shadow-md">
                  <img src={qrSrc} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Scan with WhatsApp</p>
                  <p className="text-xs text-muted-foreground mt-1">Open WhatsApp → Settings → Linked Devices</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" /> Waiting for scan…
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    )
  }

  // ── Connected: Chat Interface ─────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] lg:h-screen bg-background overflow-hidden">

      {/* ── Global top bar ── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        {/* Back button (mobile, chat view) */}
        {mobileView === 'chat' && (
          <button
            onClick={() => { setSelected(null); setMobileView('list') }}
            className="lg:hidden p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* App identity */}
        {mobileView === 'list' && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-[var(--aro-green)]" style={{ width: 18, height: 18 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.527a.75.75 0 0 0 .916.916l5.672-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.145-1.428l-.369-.218-3.827.995.999-3.793-.236-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
              </div>
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--aro-green)] rounded-full text-[var(--aro-bg)] text-[9px] font-bold flex items-center justify-center border border-card">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-foreground">WhatsApp</h1>
                <StatusDot status={status} />
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{phone}</p>
            </div>
          </div>
        )}

        {/* Chat header content (mobile) */}
        {mobileView === 'chat' && selected && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar contact={selected} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{selected.name}</p>
              <p className="text-xs text-muted-foreground font-mono">+{phoneFromJid(selected.jid)}</p>
            </div>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* PWA install */}
          {!pwaInstalled && deferredPrompt && (
            <button
              onClick={handleInstallPWA}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Install app"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Install</span>
            </button>
          )}

          {/* Notifications toggle */}
          <button
            onClick={requestNotifications}
            className={cn(
              'p-2 rounded-xl border transition-colors',
              notifPermission === 'granted'
                ? 'bg-[var(--aro-green)]/10 border-[var(--aro-green)]/20 text-[var(--aro-green)]'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
            )}
            aria-label="Toggle notifications"
          >
            {notifPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Contacts sidebar (desktop always / mobile list view) */}
        <aside className={cn(
          'flex flex-col border-r border-border overflow-hidden bg-background',
          'lg:flex lg:w-80 lg:shrink-0',
          mobileView === 'list' ? 'flex w-full' : 'hidden',
        )}>
          {/* Search + add */}
          <div className="px-4 py-3 border-b border-border shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 flex-1 bg-secondary border border-border rounded-2xl px-3 py-2.5">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-2xl bg-[var(--aro-green)] text-[var(--aro-bg)] hover:bg-[var(--aro-green-dark)] transition-colors shadow-md shadow-[var(--aro-green)]/20"
                aria-label="Add contact"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-medium">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
              {totalUnread > 0 && (
                <span className="bg-[var(--aro-green)]/10 text-[var(--aro-green)] border border-[var(--aro-green)]/20 px-2 py-0.5 rounded-full font-semibold">
                  {totalUnread} unread
                </span>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {contactsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 text-[var(--aro-green)] animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                  <Phone className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {contacts.length === 0 ? 'No contacts yet' : 'No matches'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contacts.length === 0 ? 'Tap + to add your first contact' : 'Try a different search'}
                  </p>
                </div>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const badge = unread[contact.id] ?? 0
                const active = selected?.id === contact.id
                const isUnknown = (contact as Contact & { unknown?: boolean }).unknown === true
                return (
                  <button
                    key={contact.id}
                    onClick={() => selectContact(contact)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-4 border-b border-border/50 text-left transition-all duration-150',
                      active
                        ? 'bg-[var(--aro-green)]/8 border-l-[3px] border-l-[var(--aro-green)] pl-[13px]'
                        : 'hover:bg-secondary/60',
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar contact={contact} size="md" />
                      {contact.aiEnabled && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--aro-green)] rounded-full flex items-center justify-center border-2 border-background">
                          <Bot className="w-2 h-2 text-[var(--aro-bg)]" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={cn('text-sm font-semibold truncate', badge > 0 ? 'text-foreground' : 'text-foreground/90')}>
                            {isUnknown ? `+${contact.phone}` : contact.name}
                          </p>
                          {isUnknown && (
                            <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                              Unknown
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                          {contact.lastTs ? fmtTime(contact.lastTs) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-xs truncate', badge > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {contact.lastMessage || `+${contact.phone}`}
                        </p>
                        {badge > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--aro-green)] text-[var(--aro-bg)] text-[10px] font-bold flex items-center justify-center">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Chat panel (desktop always / mobile chat view) */}
        <main className={cn(
          'flex-1 min-w-0 flex flex-col overflow-hidden bg-background',
          'lg:flex',
          mobileView === 'chat' ? 'flex' : 'hidden',
        )}>
          {!selected ? (
            /* Empty state on desktop */
            <div className="hidden lg:flex flex-col items-center justify-center h-full gap-5 text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/15 flex items-center justify-center">
                <MessageSquare className="w-9 h-9 text-[var(--aro-green)]/50" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-2">Select a conversation</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Choose a contact from the list to view their AI-monitored conversation.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop chat header */}
              <div className="hidden lg:flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card shrink-0">
                <Avatar contact={selected} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                      {(selected as Contact & { unknown?: boolean }).unknown ? `+${phoneFromJid(selected.jid)}` : selected.name}
                    </p>
                    {(selected as Contact & { unknown?: boolean }).unknown && (
                      <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                        Unknown
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">+{phoneFromJid(selected.jid)}</p>
                </div>
                {/* Save contact button for unknown JIDs */}
                {(selected as Contact & { unknown?: boolean }).unknown && (
                  <button
                    onClick={() => { setNewPhone(phoneFromJid(selected.jid)); setNewName(''); setShowAddModal(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--aro-green)]/10 border border-[var(--aro-green)]/20 text-[var(--aro-green)] text-xs font-medium hover:bg-[var(--aro-green)]/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save contact
                  </button>
                )}
                {/* AI quick toggle — only for saved contacts */}
                {!(selected as Contact & { unknown?: boolean }).unknown && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground">AI</span>
                      <button
                        onClick={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                        disabled={!isConnected}
                        className={cn(
                          'relative w-10 h-5 rounded-full transition-colors focus:outline-none disabled:opacity-40',
                          selected.aiEnabled ? 'bg-[var(--aro-green)]' : 'bg-border',
                        )}
                        aria-label="Toggle AI for contact"
                      >
                        <span className={cn(
                          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
                          selected.aiEnabled ? 'translate-x-5' : 'translate-x-0',
                        )} />
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAiModal(true)}
                      className={cn(
                        'p-2 rounded-xl border transition-colors',
                        selected.aiEnabled
                          ? 'bg-[var(--aro-green)]/10 border-[var(--aro-green)]/20 text-[var(--aro-green)]'
                          : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
                      )}
                      aria-label="AI settings"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(selected.id)}
                      disabled={deletingContact === selected.id}
                      className="p-2 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/8 hover:border-destructive/30 transition-colors disabled:opacity-50"
                      aria-label="Delete contact"
                    >
                      {deletingContact === selected.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>

              {/* Mobile chat action bar */}
              <div className="flex lg:hidden items-center gap-2 px-4 py-2.5 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">AI replies</span>
                  <Toggle
                    checked={selected.aiEnabled}
                    onChange={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                    disabled={!isConnected}
                  />
                  {selected.aiEnabled && (
                    <span className="text-xs font-medium text-[var(--aro-green)] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAiModal(true)}
                  className="p-2 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bot className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteContact(selected.id)}
                  disabled={deletingContact === selected.id}
                  className="p-2 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  {deletingContact === selected.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 text-[var(--aro-green)] animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      {isConnected ? 'No messages yet. Send the first one.' : 'Connect WhatsApp to send messages.'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.role === 'assistant' ? 'justify-start' : 'justify-end')}
                    >
                      {msg.role === 'system' ? (
                        <div className="w-full text-center">
                          <span className="inline-block px-3 py-1.5 bg-secondary border border-border rounded-xl text-[11px] text-muted-foreground font-mono">
                            {msg.text}
                          </span>
                        </div>
                      ) : (
                        <div className={cn(
                          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          msg.role === 'assistant'
                            ? 'bg-card text-foreground border border-border rounded-bl-sm'
                            : 'bg-[var(--aro-green)] text-[var(--aro-bg)] rounded-br-sm',
                        )}>
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-1 mb-1.5 opacity-60">
                              <Bot className="w-3 h-3" />
                              <span className="text-[10px] font-medium uppercase tracking-wide">AI</span>
                            </div>
                          )}
                          <p>{msg.text}</p>
                          <p className="text-[10px] opacity-50 mt-1 text-right">{fmtTime(msg.ts)}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar — shown when AI auto-response is disabled (manual mode) */}
              {business?.universalAIResponse !== false && (
                <div className="px-4 py-3 border-t border-border bg-card/50 shrink-0 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[var(--aro-green)]" />
                    <span>AI Auto-Response: AI replies to all messages</span>
                  </p>
                </div>
              )}

              {/* Input bar — shown when AI auto-response is disabled (manual mode) */}
              {business?.universalAIResponse === false && (
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2.5 px-4 py-3 border-t border-border bg-card shrink-0"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!isConnected || sending}
                    placeholder={isConnected ? `Message ${selected.name}…` : 'Connect WhatsApp first…'}
                    className="flex-1 bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--aro-green)]/30 disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !input.trim() || sending}
                    className="flex items-center justify-center w-10 h-10 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] disabled:opacity-40 text-[var(--aro-bg)] rounded-2xl transition-colors shrink-0 shadow-md shadow-[var(--aro-green)]/20"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Settings Modal ── */}
      <Modal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title={<div className="flex items-center gap-2"><Settings className="w-4 h-4 text-[var(--aro-green)]" /><span>Chat Settings</span></div>}
        size="md"
      >
        <div className="p-5 space-y-5">
          {/* Connection status */}
          <div className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border',
            'bg-emerald-500/8 border-emerald-500/20',
          )}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot status={status} />
                <p className="text-sm font-semibold text-emerald-400">Connected</p>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{phone}</p>
            </div>
          </div>

          {/* Global AI */}
          <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--aro-green)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">AI Auto-Response</p>
                <p className="text-xs text-muted-foreground">{business?.universalAIResponse === false ? 'Disabled (manual mode)' : 'Enabled (AI replies to all)'}</p>
              </div>
            </div>
            <button
              onClick={handleToggleUniversalAI}
              disabled={togglingUAI}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50',
                business?.universalAIResponse === false ? 'bg-red-500' : 'bg-[var(--aro-green)]'
              )}
              aria-label="Toggle AI auto-response"
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                business?.universalAIResponse === false ? 'translate-x-0' : 'translate-x-6'
              )} />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border">
                {notifPermission === 'granted' ? <Bell className="w-4 h-4 text-[var(--aro-green)]" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground capitalize">{notifPermission === 'granted' ? 'Enabled' : notifPermission === 'denied' ? 'Blocked by browser' : 'Not enabled'}</p>
              </div>
            </div>
            {notifPermission !== 'granted' && notifPermission !== 'denied' && (
              <Button size="sm" onClick={requestNotifications} className="text-xs h-8 bg-[var(--aro-green)] text-[var(--aro-bg)] rounded-xl">
                Enable
              </Button>
            )}
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Webhook URL
            </p>
            <div className="flex gap-2">
              <code className="flex-1 min-w-0 bg-secondary border border-border rounded-xl px-3 py-2.5 text-[var(--aro-green)] text-xs font-mono truncate">
                {webhookUrl}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-10 h-10 bg-secondary hover:bg-card border border-border rounded-xl transition-colors shrink-0"
                aria-label="Copy webhook URL"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-[var(--aro-green)]" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* PWA install */}
          {!pwaInstalled && deferredPrompt && (
            <button
              onClick={handleInstallPWA}
              className="w-full flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-[var(--aro-green)]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Install App</p>
                  <p className="text-xs text-muted-foreground">Download as a native app</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Clear chat history */}
          {selected && (
            <Button
              onClick={handleClearHistory}
              disabled={clearingHistory}
              variant="outline"
              className="w-full h-11 border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-2xl font-semibold gap-2"
            >
              {clearingHistory
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Eraser className="w-4 h-4" />}
              Clear Chat History ({selected.name})
            </Button>
          )}

          {/* Disconnect */}
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/8 hover:border-destructive/50 rounded-2xl font-semibold gap-2"
          >
            <Unplug className="w-4 h-4" /> Disconnect WhatsApp
          </Button>
        </div>
      </Modal>

      {/* ── Add Contact Modal ── */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={<div className="flex items-center gap-2"><Plus className="w-4 h-4 text-[var(--aro-green)]" /><span>Add Contact</span></div>}
        size="sm"
      >
        <form onSubmit={handleAddContact} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone Number *</label>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. 2348012345678"
              className="h-11 bg-secondary border-border rounded-2xl"
              required
            />
            <p className="text-xs text-muted-foreground">Include country code, no + or spaces</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Name (optional)</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. John Doe"
              className="h-11 bg-secondary border-border rounded-2xl"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-11 rounded-2xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addingContact}
              className="flex-1 h-11 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-2xl font-semibold"
            >
              {addingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── AI Settings Modal ── */}
      <Modal
        open={showAiModal && !!selected}
        onClose={() => setShowAiModal(false)}
        title={<div className="flex items-center gap-2"><Bot className="w-4 h-4 text-[var(--aro-green)]" /><span>AI Settings — {selected?.name}</span></div>}
        size="sm"
      >
        {selected && (
          <div className="p-5 space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[var(--aro-green)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Replies</p>
                  <p className="text-xs text-muted-foreground">Auto-respond to this contact</p>
                </div>
              </div>
              <Toggle
                checked={selected.aiEnabled}
                onChange={() => handleUpdateContact(selected.id, { aiEnabled: !selected.aiEnabled })}
                disabled={!isConnected}
              />
            </div>

            {selected.aiEnabled && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--aro-green)]/8 border border-[var(--aro-green)]/20 rounded-xl">
                <Zap className="w-3.5 h-3.5 text-[var(--aro-green)] shrink-0" />
                <p className="text-xs text-[var(--aro-green)] font-medium">AI is active for this contact</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Custom Personality</label>
              <textarea
                value={selected.aiPersonality || ''}
                onChange={(e) => handleUpdateContact(selected.id, { aiPersonality: e.target.value })}
                placeholder="e.g. Reply formally in English. Focus on product inquiries only."
                rows={4}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--aro-green)]/40 resize-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Model</label>
              <select
                value={selected.aiModel || 'default'}
                onChange={(e) => handleUpdateContact(selected.id, { aiModel: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--aro-green)]/40"
              >
                <option value="default">Default (Business Config)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-opus-4.6">Claude Opus</option>
                <option value="gemini-3-flash">Gemini Flash</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
