'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { updateBusiness, changePassword, firebaseErrorMessage } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Bot,
  MessageSquare,
  Shield,
  Globe,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  Bell,
  BadgeCheck,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PERSONALITY =
  'You are a friendly and professional sales agent. Help customers find the right product, answer their questions honestly, and guide them toward a purchase decision. Be concise, warm, and human.'

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
  { code: 'TZS', symbol: 'TSh', label: 'Tanzanian Shilling' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'ar', label: 'Arabic' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
  { code: 'sw', label: 'Swahili' },
  { code: 'pt', label: 'Portuguese' },
]

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'Asia/Dubai',
]

type Tab = 'ai' | 'whatsapp' | 'security' | 'preferences'
type SaveState = 'idle' | 'saving' | 'saved'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'ai',          label: 'AI Agent',    icon: Bot },
  { id: 'whatsapp',    label: 'WhatsApp',    icon: MessageSquare },
  { id: 'security',    label: 'Security',    icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Globe },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveButton({ state, onClick, label = 'Save Changes' }: {
  state: SaveState
  onClick?: () => void
  label?: string
}) {
  return (
    <Button
      type="submit"
      disabled={state === 'saving' || state === 'saved'}
      onClick={onClick}
      className={cn(
        'h-10 px-5 rounded-xl font-semibold text-sm gap-2 transition-all',
        state === 'saved'
          ? 'bg-[var(--aro-green)]/10 text-[var(--aro-green)] border border-[var(--aro-green)]/30 hover:bg-[var(--aro-green)]/10'
          : 'bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]',
      )}
    >
      {state === 'saved' ? (
        <><CheckCircle2 className="w-4 h-4" /> Saved</>
      ) : state === 'saving' ? 'Saving…' : label}
    </Button>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pb-3">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="border-t border-border my-5" />
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
          value ? 'bg-[var(--aro-green)]' : 'bg-secondary border border-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            value ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, business, refreshBusiness } = useAuth()

  // AI Agent
  const [universalAIResponse, setUniversalAIResponse] = useState(true)
  const [aiPersonality, setAiPersonality] = useState(DEFAULT_PERSONALITY)
  const [customPrompt, setCustomPrompt] = useState('')
  const [aiModel, setAiModel] = useState('google/gemini-2.0-flash-exp')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [notifNewOrder, setNotifNewOrder] = useState(true)
  const [notifNewMessage, setNotifNewMessage] = useState(true)
  const [notifDailyReport, setNotifDailyReport] = useState(false)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)

  // Notification number verification
  const [notificationNumber, setNotificationNumber] = useState('')
  const [verifiedNotificationNumber, setVerifiedNotificationNumber] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [pwdStrength, setPwdStrength] = useState<'' | 'weak' | 'fair' | 'strong'>('')

  const [activeTab, setActiveTab] = useState<Tab>('ai')
  const [saveState, setSaveState] = useState<Record<Tab, SaveState>>({
    ai: 'idle', whatsapp: 'idle', security: 'idle', preferences: 'idle',
  })

  // Hydrate from Firestore business doc
  useEffect(() => {
    if (!business) return
    setUniversalAIResponse(business.universalAIResponse ?? true)
    setAiPersonality(business.aiPersonality ?? DEFAULT_PERSONALITY)
    setCustomPrompt(business.customPrompt ?? '')
    setAiModel(business.openrouterModel ?? 'google/gemini-2.0-flash-exp')
    setWhatsappPhone(business.whatsappPhone ?? '')
    setCurrency(business.currency ?? 'NGN')
    setLanguage(business.language ?? 'en')
    setTimezone(business.timezone ?? 'Africa/Lagos')
    setNotifNewOrder(business.notifNewOrder ?? true)
    setNotifNewMessage(business.notifNewMessage ?? true)
    setNotifDailyReport(business.notifDailyReport ?? false)
    setNotifWeeklyReport(business.notifWeeklyReport ?? true)
    if (business.notificationNumber) {
      setVerifiedNotificationNumber(business.notificationNumber)
      setNotificationNumber(business.notificationNumber)
    }
  }, [business])

  // Password strength indicator
  useEffect(() => {
    if (!newPassword) { setPwdStrength(''); return }
    const hasUpper = /[A-Z]/.test(newPassword)
    const hasNum   = /[0-9]/.test(newPassword)
    const hasSpec  = /[^a-zA-Z0-9]/.test(newPassword)
    const long     = newPassword.length >= 12
    const score    = [hasUpper, hasNum, hasSpec, long].filter(Boolean).length
    setPwdStrength(score >= 3 ? 'strong' : score >= 2 ? 'fair' : 'weak')
  }, [newPassword])

  async function handleSendOtp() {
    if (!user) { toast.error('Not authenticated.'); return }
    const normalised = notificationNumber.replace(/\D/g, '')
    if (normalised.length < 7) { toast.error('Enter a valid phone number.'); return }
    setSendingOtp(true)
    try {
      const res = await fetch('/api/notifications/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, phone: normalised }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setOtpSent(true)
      setOtpCode('')
      toast.success(data.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    if (!user) { toast.error('Not authenticated.'); return }
    if (!otpCode.trim()) { toast.error('Enter the verification code.'); return }
    setVerifyingOtp(true)
    try {
      const res = await fetch('/api/notifications/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, otp: otpCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      setVerifiedNotificationNumber(data.phone)
      setOtpSent(false)
      setOtpCode('')
      await refreshBusiness()
      toast.success('Notification number verified and saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  async function save(tab: Tab, data: Record<string, unknown>) {
    if (!user) { toast.error('Not authenticated.'); return }
    setSaveState((s) => ({ ...s, [tab]: 'saving' }))
    try {
      await updateBusiness(user.uid, data)
      await refreshBusiness()
      setSaveState((s) => ({ ...s, [tab]: 'saved' }))
      toast.success('Saved.')
      setTimeout(() => setSaveState((s) => ({ ...s, [tab]: 'idle' })), 2500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
      setSaveState((s) => ({ ...s, [tab]: 'idle' }))
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) { toast.error('Enter your current password.'); return }
    if (!newPassword) { toast.error('Enter a new password.'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return }
    if (pwdStrength === 'weak') { toast.error('Password is too weak. Add uppercase letters, numbers or symbols.'); return }

    setSaveState((s) => ({ ...s, security: 'saving' }))
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaveState((s) => ({ ...s, security: 'saved' }))
      setTimeout(() => setSaveState((s) => ({ ...s, security: 'idle' })), 2500)
    } catch (err) {
      toast.error(firebaseErrorMessage(err))
      setSaveState((s) => ({ ...s, security: 'idle' }))
    }
  }

  const strengthColor = pwdStrength === 'strong' ? 'bg-[var(--aro-green)]' : pwdStrength === 'fair' ? 'bg-amber-400' : 'bg-red-500'
  const strengthWidth = pwdStrength === 'strong' ? 'w-full' : pwdStrength === 'fair' ? 'w-2/3' : 'w-1/3'

  return (
    <div className="min-h-full bg-background">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your AI agent, WhatsApp, security and preferences
        </p>
      </div>

      <div className="max-w-xl mx-auto px-4 pb-24 lg:max-w-none lg:px-8 lg:pb-10">

        {/* Tab bar */}
        <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0',
                activeTab === t.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── AI Agent ─────────────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('ai', {
                universalAIResponse,
                aiPersonality: aiPersonality.trim(),
                customPrompt: customPrompt.trim(),
                openrouterModel: aiModel,
              })
            }}
            className="space-y-5"
          >
            <SectionLabel>Master Control</SectionLabel>
            <ToggleRow
              label="Enable AI Responses"
              description="Kill switch — when off, AVA will not reply to any incoming messages regardless of other settings."
              value={universalAIResponse}
              onChange={setUniversalAIResponse}
            />

            <Divider />

            <SectionLabel>Personality & Tone</SectionLabel>
            <FieldBlock
              label="AI Character"
              hint="Describe how your AI agent speaks to customers. Be specific about tone, style, and boundaries. Your product catalogue is automatically included at runtime."
            >
              <textarea
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                rows={9}
                placeholder="Describe how your AI should behave…"
                className="w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 rounded-xl px-3 py-3 text-sm resize-y outline-none transition-colors leading-relaxed"
              />
            </FieldBlock>

            <Divider />

            <SectionLabel>Extra Instructions</SectionLabel>
            <FieldBlock
              label="Custom Prompt"
              hint="Additional instructions appended to every AI response. Use this for rules like pricing policies, prohibited topics, or business-specific context that applies globally."
            >
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={5}
                placeholder="e.g. Always offer free delivery on orders above ₦50,000. Never discuss competitor pricing..."
                className="w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 rounded-xl px-3 py-3 text-sm resize-y outline-none transition-colors leading-relaxed"
              />
            </FieldBlock>

            <Divider />

            <SectionLabel>AI Model</SectionLabel>
            <FieldBlock
              label="Response Model"
              hint="Choose which AI model to use for generating responses. Different models have different strengths and speeds."
            >
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-secondary border border-border text-foreground focus:border-[var(--aro-green)]/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
              >
                <optgroup label="Recommended">
                  <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash (Recommended)</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                </optgroup>
                <optgroup label="Budget-Friendly">
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="google/gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="meta-llama/llama-3.2-90b-vision-instruct">Llama 3.2 90B</option>
                </optgroup>
                <optgroup label="Advanced">
                  <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                </optgroup>
              </select>
            </FieldBlock>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAiPersonality(DEFAULT_PERSONALITY)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[var(--aro-green)] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to default
              </button>
              <SaveButton state={saveState.ai} />
            </div>
          </form>
        )}

        {/* ── WhatsApp ─────────────────────────────────────────────────────── */}
        {activeTab === 'whatsapp' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save('whatsapp', { whatsappPhone: whatsappPhone.trim() })
            }}
            className="space-y-5"
          >
            <SectionLabel>Phone Number</SectionLabel>
            <FieldBlock
              label="WhatsApp Number"
              hint="Include country code, e.g. +2348012345678. Customers message this number to reach your AI agent."
            >
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+2348012345678"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono"
              />
            </FieldBlock>

            <div className="flex items-start gap-3 p-4 bg-[var(--aro-green)]/6 border border-[var(--aro-green)]/20 rounded-xl">
              <Smartphone className="w-4 h-4 text-[var(--aro-green)] mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                After saving your number, go to the{' '}
                <strong className="text-foreground">WhatsApp</strong> page to connect via QR code scan.
              </p>
            </div>

            <div className="flex justify-end">
              <SaveButton state={saveState.whatsapp} />
            </div>

            {/* ── Notification Number ─────────────────────────────── */}
            <div className="border-t border-border pt-6 space-y-4">
              <SectionLabel>Notification Number</SectionLabel>

              {/* Verified badge */}
              {verifiedNotificationNumber && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--aro-green)]/8 border border-[var(--aro-green)]/20">
                  <BadgeCheck className="w-4 h-4 text-[var(--aro-green)] shrink-0" />
                  <p className="text-sm text-foreground flex-1">
                    <span className="font-mono font-semibold">+{verifiedNotificationNumber}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">verified</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setVerifiedNotificationNumber(''); setNotificationNumber(''); setOtpSent(false) }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}

              {!verifiedNotificationNumber && (
                <>
                  <FieldBlock
                    label="Phone Number"
                    hint="This WhatsApp number will receive order and message notification alerts from AVA. Must be a valid WhatsApp number."
                  >
                    <div className="flex gap-2">
                      <Input
                        value={notificationNumber}
                        onChange={(e) => { setNotificationNumber(e.target.value); setOtpSent(false) }}
                        placeholder="+2348012345678"
                        disabled={otpSent || sendingOtp}
                        className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono"
                      />
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || otpSent || !notificationNumber.replace(/\D/g, '')}
                        className="h-11 px-4 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-xl shrink-0 gap-2"
                      >
                        {sendingOtp
                          ? <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5 animate-pulse" />Sending...</span>
                          : <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Send Code</span>
                        }
                      </Button>
                    </div>
                  </FieldBlock>

                  {otpSent && (
                    <FieldBlock
                      label="Verification Code"
                      hint="Enter the 6-digit code sent to your WhatsApp number."
                    >
                      <div className="flex gap-2">
                        <Input
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          maxLength={6}
                          inputMode="numeric"
                          className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl font-mono tracking-[0.3em] text-center"
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otpCode.length < 6}
                          className="h-11 px-4 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-xl shrink-0 gap-2"
                        >
                          {verifyingOtp
                            ? <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 animate-pulse" />Verifying...</span>
                            : <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" />Verify</span>
                          }
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                      >
                        Resend code
                      </button>
                    </FieldBlock>
                  )}
                </>
              )}

              <div className="flex items-start gap-3 p-4 bg-secondary border border-border rounded-xl">
                <Bell className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AVA will send new order and message alerts to this number via WhatsApp. You must verify ownership before notifications are enabled.
                </p>
              </div>
            </div>
          </form>
        )}

        {/* ── Security ─────────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Change Password</SectionLabel>
              <form onSubmit={handlePasswordChange} className="space-y-4">

                <FieldBlock label="Current Password">
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Your current password"
                      autoComplete="current-password"
                      className="bg-secondary border-border text-foreground h-11 rounded-xl pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FieldBlock>

                <FieldBlock label="New Password">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className="bg-secondary border-border text-foreground h-11 rounded-xl"
                  />
                  {newPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-300', strengthColor, strengthWidth)} />
                      </div>
                      <p className={cn(
                        'text-xs font-medium capitalize',
                        pwdStrength === 'strong' ? 'text-[var(--aro-green)]' : pwdStrength === 'fair' ? 'text-amber-400' : 'text-red-500',
                      )}>
                        {pwdStrength} password
                        {pwdStrength === 'weak' && ' — add uppercase, numbers or symbols'}
                        {pwdStrength === 'fair' && ' — add more variety to strengthen'}
                      </p>
                    </div>
                  )}
                </FieldBlock>

                <FieldBlock label="Confirm New Password">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    className={cn(
                      'bg-secondary border-border text-foreground h-11 rounded-xl',
                      confirmPassword && confirmPassword !== newPassword && 'border-red-500/50',
                    )}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </FieldBlock>

                <div className="flex justify-end">
                  <SaveButton state={saveState.security} label="Update Password" />
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">

            {/* Currency */}
            <div>
              <SectionLabel>Currency</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                      currency === c.code
                        ? 'border-[var(--aro-green)] bg-[var(--aro-green)]/8 text-foreground'
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border/80',
                    )}
                  >
                    <span className="text-base font-bold w-6 text-center shrink-0">{c.symbol}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
                    </div>
                    {currency === c.code && (
                      <Check className="w-3.5 h-3.5 text-[var(--aro-green)] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            {/* Language & Region */}
            <div>
              <SectionLabel>Language & Region</SectionLabel>
              <div className="space-y-4">
                <FieldBlock label="Language">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground h-11 rounded-xl px-3 text-sm outline-none focus:border-[var(--aro-green)]/60 transition-colors"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </FieldBlock>

                <FieldBlock label="Timezone">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground h-11 rounded-xl px-3 text-sm outline-none focus:border-[var(--aro-green)]/60 transition-colors"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </FieldBlock>
              </div>
            </div>

            <Divider />

            {/* Notifications */}
            <div>
              <SectionLabel>Notifications</SectionLabel>
              <div className="bg-card border border-border rounded-xl px-4">
                <ToggleRow
                  label="New Order"
                  description="Alert when a customer places an order"
                  value={notifNewOrder}
                  onChange={setNotifNewOrder}
                />
                <ToggleRow
                  label="New Message"
                  description="Alert when a customer sends a WhatsApp message"
                  value={notifNewMessage}
                  onChange={setNotifNewMessage}
                />
                <ToggleRow
                  label="Daily Report"
                  description="Daily summary of orders and conversations"
                  value={notifDailyReport}
                  onChange={setNotifDailyReport}
                />
                <ToggleRow
                  label="Weekly Report"
                  description="Weekly performance digest every Monday"
                  value={notifWeeklyReport}
                  onChange={setNotifWeeklyReport}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                disabled={saveState.preferences === 'saving' || saveState.preferences === 'saved'}
                onClick={() =>
                  save('preferences', {
                    currency,
                    language,
                    timezone,
                    notifNewOrder,
                    notifNewMessage,
                    notifDailyReport,
                    notifWeeklyReport,
                  })
                }
                className={cn(
                  'h-10 px-5 rounded-xl font-semibold text-sm gap-2 transition-all',
                  saveState.preferences === 'saved'
                    ? 'bg-[var(--aro-green)]/10 text-[var(--aro-green)] border border-[var(--aro-green)]/30 hover:bg-[var(--aro-green)]/10'
                    : 'bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)]',
                )}
              >
                {saveState.preferences === 'saved' ? (
                  <><CheckCircle2 className="w-4 h-4" /> Saved</>
                ) : saveState.preferences === 'saving' ? 'Saving…' : 'Save Preferences'}
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
