import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { updateAIModel } from '@/lib/firestore-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const businessDoc = await adminDb
      .collection('businesses')
      .doc(userId)
      .get()

    if (!businessDoc.exists()) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const business = businessDoc.data()

    return NextResponse.json({ business })
  } catch (err) {
    console.error('[v0] Error fetching business:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const body = await request.json()
    const { universalAIResponse, openrouterModel } = body

    // Handle universal AI response toggle
    if (universalAIResponse !== undefined) {
      await adminDb
        .collection('businesses')
        .doc(userId)
        .update({ universalAIResponse })
    }

    // Handle AI model change
    if (openrouterModel !== undefined) {
      await updateAIModel(userId, openrouterModel)
    }

    const updatedDoc = await adminDb
      .collection('businesses')
      .doc(userId)
      .get()

    return NextResponse.json({ business: updatedDoc.data() })
  } catch (err) {
    console.error('[v0] Error updating business:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

