import { NextRequest, NextResponse } from 'next/server'
import { updateBusinessDoc, getBusinessDoc } from '@/lib/firestore-server'

/**
 * GET /api/user/profile?uid=...
 * Fetch current user's business profile
 */
export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid')
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
    }

    console.log('[v0] Fetching user profile for:', uid)
    const business = await getBusinessDoc(uid)
    
    if (!business) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile: business })
  } catch (err) {
    console.error('[v0] Error fetching profile:', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

/**
 * POST /api/user/profile
 * Update user's business profile (name, avatar, AI settings, etc.)
 * Uses Admin SDK for reliable server-side writes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      uid, name, avatarUrl, aiPersonality, openrouterModel, whatsappPhone,
      customPrompt, notificationNumber,
      currency, language, timezone,
      notifNewOrder, notifNewMessage, notifDailyReport, notifWeeklyReport,
    } = body

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (aiPersonality !== undefined) updateData.aiPersonality = aiPersonality.trim()
    if (openrouterModel !== undefined) updateData.openrouterModel = openrouterModel.trim()
    if (whatsappPhone !== undefined) updateData.whatsappPhone = whatsappPhone.trim()
    if (customPrompt !== undefined) updateData.customPrompt = customPrompt.trim()
    if (notificationNumber !== undefined) updateData.notificationNumber = notificationNumber.trim()
    // Preferences
    if (currency !== undefined) updateData.currency = currency
    if (language !== undefined) updateData.language = language
    if (timezone !== undefined) updateData.timezone = timezone
    if (notifNewOrder !== undefined) updateData.notifNewOrder = notifNewOrder
    if (notifNewMessage !== undefined) updateData.notifNewMessage = notifNewMessage
    if (notifDailyReport !== undefined) updateData.notifDailyReport = notifDailyReport
    if (notifWeeklyReport !== undefined) updateData.notifWeeklyReport = notifWeeklyReport

    updateData.updatedAt = Date.now()

    // Update via Admin SDK
    await updateBusinessDoc(uid, updateData)

    console.log('[v0] Profile updated successfully for:', uid)

    // Fetch and return updated profile
    const updated = await getBusinessDoc(uid)

    return NextResponse.json({ success: true, profile: updated })
  } catch (err) {
    console.error('[v0] Error updating profile:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
