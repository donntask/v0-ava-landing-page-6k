import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { updateBusinessDoc } from '@/lib/firestore-server'

/**
 * POST /api/notifications/verify-otp
 * Verifies the OTP and, on success, saves the verified notification number
 * to the business document.
 *
 * Body: { uid: string, otp: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { uid, otp } = await request.json()

    if (!uid || !otp) {
      return NextResponse.json({ error: 'Missing uid or otp' }, { status: 400 })
    }

    const snap = await adminDb.collection('otp_verifications').doc(uid).get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'No pending verification found. Please request a new code.' }, { status: 404 })
    }

    const data = snap.data()!

    if (data.verified) {
      return NextResponse.json({ error: 'This code has already been used.' }, { status: 400 })
    }

    if (Date.now() > data.expiresAt) {
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
    }

    if (data.otp !== String(otp).trim()) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
    }

    // Mark as verified
    await adminDb.collection('otp_verifications').doc(uid).update({ verified: true })

    // Save the verified phone number to the business doc
    await updateBusinessDoc(uid, {
      notificationNumber: data.phone,
      notificationVerifiedAt: Date.now(),
    })

    return NextResponse.json({ success: true, phone: data.phone })
  } catch (err) {
    console.error('[v0] verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
