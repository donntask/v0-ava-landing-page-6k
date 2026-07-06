import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'AroMsg — AI Sales Agent That Closes Deals While You Sleep',
  description:
    'AroMsg powers Arobi, an AI Sales Agent that automates your sales on WhatsApp with human-like conversations, auto-payments, and smart negotiation. Never lose a customer in your DMs again.',
  keywords: [
    'AI sales agent',
    'WhatsApp automation',
    'AroMsg',
    'Arobi AI',
    'sales automation',
    'conversational AI',
    'payment automation',
  ],
  authors: [{ name: 'AroMsg' }],
  creator: 'AroMsg',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'AroMsg — AI Sales Agent That Closes Deals While You Sleep',
    description:
      'Automate your sales on WhatsApp with human-like AI conversations and built-in payments.',
    siteName: 'AroMsg',
    images: [
      {
        url: '/aromsg-logo.png',
        width: 1200,
        height: 630,
        alt: 'AroMsg — AI Sales Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AroMsg — AI Sales Agent That Closes Deals While You Sleep',
    description:
      'Automate your sales on WhatsApp with human-like AI conversations and built-in payments.',
    images: ['/aromsg-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0B1410',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AroMsg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden aromsg-loading">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) { console.log('[AroMsg] SW registered:', reg.scope); })
                    .catch(function(err) { console.log('[AroMsg] SW registration failed:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
