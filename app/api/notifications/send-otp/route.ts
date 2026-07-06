import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessDoc } from '@/lib/firestore-server'

function resolveGateway(raw?: string): string {
  const url = (raw || 'https://aromsg.up.railway.app').trim().replace(/\/$/, '')
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function getGatewayUrl(): string {
  // Prefer server-side env var; fall back to public one
  return resolveGateway(process.env.WHATSAPP_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL)
}

/**
 * POST /api/notifications/send-otp
 * Generates a 6-digit OTP, stores it in Firestore with a 10-minute TTL,
 * then sends it via the WhatsApp gateway to the provided phone number.
 *
 * Body: { uid: string, phone: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { uid, phone } = await request.json()

    if (!uid || !phone) {
      return NextResponse.json({ error: 'Missing uid or phone' }, { status: 400 })
    }

    // Normalise: strip everything except digits
    const normalised = phone.replace(/\D/g, '')
    if (normalised.length < 7 || normalised.length > 15) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Get business to find the WhatsApp session (businessId = uid)
    const business = await getBusinessDoc(uid)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP in Firestore
    await adminDb.collection('otp_verifications').doc(uid).set({
      otp,
      phone: normalised,
      expiresAt,
      createdAt: Date.now(),
      verified: false,
    })

    // Send via WhatsApp gateway
    const GATEWAY = getGatewayUrl()
    const jid = `${normalised}@s.whatsapp.net`
    const message = `Your AVA verification code is: *${otp}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`

    const gwRes = await fetch(`${GATEWAY}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        to: jid,
        text: message,
      }),
    })

    if (!gwRes.ok) {
      const err = await gwRes.text()
      console.error('[v0] Gateway send failed:', err)
      return NextResponse.json({ error: 'Failed to send OTP via WhatsApp. Ensure your WhatsApp is connected.' }, { status: 502 })
    }

    return NextResponse.json({ success: true, message: `OTP sent to +${normalised}` })
  } catch (err) {
    console.error('[v0] send-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
