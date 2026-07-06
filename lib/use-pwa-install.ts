'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level cache — persists across hook re-mounts within the same page session
let cachedPrompt: BeforeInstallPromptEvent | null = null

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(cachedPrompt)
  const [isInstallable, setIsInstallable] = useState(!!cachedPrompt)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Already installed as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone)
    ) {
      setIsInstalled(true)
      return
    }

    // Hydrate from module cache if event already fired
    if (cachedPrompt) {
      setDeferredPrompt(cachedPrompt)
      setIsInstallable(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      cachedPrompt = e as BeforeInstallPromptEvent
      setDeferredPrompt(cachedPrompt)
      setIsInstallable(true)
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      cachedPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  async function triggerInstall() {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        cachedPrompt = null
      }
    } catch {
      // prompt() can throw if called at wrong time
    }
    setDeferredPrompt(null)
  }

  return { isInstallable, isInstalled, triggerInstall }
}
