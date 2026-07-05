'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { logOut } from '@/lib/firebase-auth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  Sun,
  Moon,
  ArrowLeft,
  ChevronRight,
  UserCircle,
  Wallet,
} from 'lucide-react'

// Desktop sidebar keeps Settings
const desktopNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/payouts', label: 'Payouts', icon: Wallet },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

// Mobile bottom nav uses Profile instead of Settings
const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
]

// All nav items (union) for header title lookup
const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/payouts', label: 'Payouts', icon: Wallet },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
]

function useActiveNav() {
  const pathname = usePathname()
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
    >
      {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  )
}

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = useActiveNav()
  const isRootDashboard = pathname === '/dashboard'

  const currentPage = navItems.find((n) => !n.exact && pathname.startsWith(n.href))

  async function handleLogout() {
    await logOut()
    router.push('/auth/login')
  }

  // ── Desktop side rail ──────────────────────────────────────────────────────
  const DesktopSidebar = (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-xl bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-[var(--aro-green)]" />
        </div>
        <div className="leading-none">
          <p className="font-bold text-sm">
            <span className="text-[var(--aro-green)]">Aro</span>
            <span className="text-foreground">Msg</span>
          </p>
          <p className="text-muted-foreground text-[10px] mt-0.5 font-medium tracking-wide uppercase">Platform</p>
        </div>
      </div>

      {/* Nav section label */}
      <p className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Navigation
      </p>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3">
        {desktopNavItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--aro-green)] text-[var(--aro-bg)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-[var(--aro-bg)]' : 'text-current')} />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[var(--aro-bg)]/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-5 pt-4 border-t border-border mt-2 flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-muted-foreground font-medium">Appearance</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-150 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  // ── Mobile top header ──────────────────────────────────────────────────────
  const MobileHeader = (
    <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-card/95 backdrop-blur-xl border-b border-border flex items-center px-4 gap-3">
      {isRootDashboard ? (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--aro-green)]/15 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-[var(--aro-green)]" />
            </div>
            <span className="font-bold text-sm">
              <span className="text-[var(--aro-green)]">Aro</span>
              <span className="text-foreground">Msg</span>
            </span>
          </div>
          <ThemeToggle />
        </>
      ) : (
        <>
          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Back to dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Back</span>
          </button>
          <span className="flex-1 text-sm font-semibold text-foreground truncate">
            {currentPage?.label ?? 'Dashboard'}
          </span>
          <ThemeToggle />
        </>
      )}
    </header>
  )

  // ── Mobile bottom nav bar ──────────────────────────────────────────────────
  const BottomNav = (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all min-w-0 flex-1"
              aria-label={item.label}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
                  active
                    ? 'bg-[var(--aro-green)] shadow-lg shadow-[var(--aro-green)]/25'
                    : 'bg-transparent',
                )}
              >
                <item.icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    active ? 'text-[var(--aro-bg)]' : 'text-muted-foreground',
                  )}
                />
              </span>
              <span
                className={cn(
                  'text-[9px] font-semibold tracking-wide uppercase transition-colors leading-none',
                  active ? 'text-[var(--aro-green)]' : 'text-muted-foreground',
                )}
              >
                {item.label === 'WhatsApp' ? 'Chat' : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      {DesktopSidebar}
      {MobileHeader}
      {BottomNav}
    </>
  )
}
