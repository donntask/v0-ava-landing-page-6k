/**
 * Generates webhook URLs for WhatsApp gateway integration.
 * Automatically detects deployment URL from environment.
 */

export function getDeploymentUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current window location
    return window.location.origin
  }

  // Server-side: check environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  return 'http://localhost:3000'
}

export async function fetchDeploymentUrl(): Promise<string> {
  try {
    const response = await fetch('/api/deployment/url')
    const data = await response.json()
    return data.url || 'http://localhost:3000'
  } catch {
    return getDeploymentUrl()
  }
}
