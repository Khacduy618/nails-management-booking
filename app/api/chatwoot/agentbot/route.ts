
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
    return NextResponse.json({
        service: 'Chatwoot Agent Bot webhook',
        status: 'ready',
    })
}

export async function POST(request: NextRequest) {
    const expectedSecret = process.env.CHATWOOT_WEBHOOK_SECRET
    const suppliedSecret = request.nextUrl.searchParams.get('secret')

    if (!expectedSecret || suppliedSecret !== expectedSecret) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 },
        )
    }

    const body = await request.json()

    console.log('[Chatwoot Agent Bot] Webhook received', {
        event: body.event,
        messageType: body.message?.message_type ?? body.message_type,
        conversationId: body.conversation?.id ?? body.conversation_id,
    })

    return NextResponse.json({ ok: true })
}
