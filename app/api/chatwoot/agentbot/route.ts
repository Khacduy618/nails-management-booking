
import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ChatwootPayload = {
    event?: string
    id?: number | string
    content?: string | null
    message_type?: string | number
    sender?: {
        type?: string
        name?: string
    }
    conversation?: {
        id?: number | string
        display_id?: number | string
    }
    message?: {
        id?: number | string
        content?: string | null
        message_type?: string | number
        sender?: { type?: string }
        conversation?: {
            id?: number | string
            display_id?: number | string
        }
    }
}

function verifySignature(
    rawBody: string,
    timestamp: string,
    signature: string,
    secret: string,
): boolean {
    if (!/^\d+$/.test(timestamp)) return false

    const timestampSeconds = Number(timestamp)
    if (!Number.isSafeInteger(timestampSeconds)) return false

    // Reject stale or future requests outside a 5-minute window.
    if (Math.abs(Date.now() / 1000 - timestampSeconds) > 300) {
        return false
    }

    const expected =
        'sha256=' +
        createHmac('sha256', secret)
            .update(`${timestamp}.${rawBody}`)
            .digest('hex')

    const receivedBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    return (
        receivedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(receivedBuffer, expectedBuffer)
    )
}

export async function GET() {
    return NextResponse.json({
        service: 'Chatwoot Agent Bot',
        status: 'ready',
    })
}


async function fetchGeminiWithRetry(
    url: string,
    makeInit: () => RequestInit,
    maxAttempts = 3,
): Promise<Response> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch(url, makeInit());

        const shouldRetry =
            [429, 500, 502, 503, 504].includes(response.status);

        if (!shouldRetry || attempt === maxAttempts) {
            return response;
        }

        await response.body?.cancel();

        const delayMs = 800 * 2 ** (attempt - 1);

        console.warn('[Gemini Retry]', {
            status: response.status,
            attempt,
            nextRetryMs: delayMs,
        });

        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Gemini retry loop exhausted');
}



export async function POST(request: NextRequest) {
    try {
        const secret = process.env.CHATWOOT_WEBHOOK_SECRET

        if (!secret) {
            console.error('Missing CHATWOOT_WEBHOOK_SECRET')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            )
        }

        // Verify the exact raw request body before parsing JSON.
        const rawBody = await request.text()
        const signature = request.headers.get('x-chatwoot-signature') ?? ''
        const timestamp = request.headers.get('x-chatwoot-timestamp') ?? ''

        if (!verifySignature(rawBody, timestamp, signature, secret)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = JSON.parse(rawBody) as ChatwootPayload
        const message = body.message ?? body

        const messageType = message.message_type
        const content = message.content?.trim()

        const conversation =
            message.conversation ?? body.conversation

        // Agent Bot events may include non-message events.
        if (body.event !== 'message_created') {
            return NextResponse.json({ ok: true, ignored: true })
        }

        // Only answer incoming customer messages, never outgoing bot replies.
        if (
            !['incoming', 0, '0'].includes(messageType ?? '') ||
            message.sender?.type === 'AgentBot' ||
            !content
        ) {
            return NextResponse.json({ ok: true, ignored: true })
        }

        // Chatwoot webhook payloads commonly expose display_id.
        const conversationId =
            conversation?.display_id ?? conversation?.id

        if (!conversationId) {
            console.error('Webhook payload has no conversation ID')
            return NextResponse.json(
                { error: 'Missing conversation ID' },
                { status: 400 },
            )
        }


        const apiKey = process.env.GROQ_API_KEY;
        const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

        const baseUrl = process.env.CHATWOOT_BASE_URL?.replace(/\/+$/, '');
        const accountId = process.env.CHATWOOT_ACCOUNT_ID;
        const botToken = process.env.CHATWOOT_AGENT_BOT_TOKEN;

        if (!apiKey || !baseUrl || !accountId || !botToken) {
            console.error('Missing Groq or Chatwoot environment variables');

            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        const aiResponse = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: [
                                'Bạn là trợ lý chăm sóc khách hàng cho dịch vụ nail.',
                                'Trả lời bằng ngôn ngữ khách đang sử dụng.',
                                'Thân thiện, lịch sự, ngắn gọn và rõ ràng.',
                                'Không tự bịa giá, lịch trống hoặc chính sách.',
                                'Nếu chưa có thông tin, hãy hỏi lại khách.',
                            ].join(' '),
                        },
                        {
                            role: 'user',
                            content,
                        },
                    ],
                    max_tokens: 400,
                    temperature: 0.4,
                }),
                signal: AbortSignal.timeout(15000),
            },
        );

        if (!aiResponse.ok) {
            const errorBody = await aiResponse.text();

            console.error('[Groq API Error]', {
                status: aiResponse.status,
                model,
                body: errorBody.slice(0, 2000),
            });

            return NextResponse.json(
                { error: 'AI generation failed' },
                { status: 502 },
            );
        }

        const aiData = await aiResponse.json();

        const reply = aiData.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return NextResponse.json(
                { error: 'AI returned an empty response' },
                { status: 502 },
            );
        }


        const chatwootResponse = await fetch(
            `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    api_access_token: botToken,
                },
                body: JSON.stringify({
                    content: reply,
                    message_type: 'outgoing',
                    private: false,
                }),
                signal: AbortSignal.timeout(15000),
            },
        )

        if (!chatwootResponse.ok) {
            console.error('Chatwoot API error:', chatwootResponse.status)
            return NextResponse.json(
                { error: 'Failed to send Chatwoot reply' },
                { status: 502 },
            )
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error(
            'Agent Bot error:',
            error instanceof Error ? error.message : 'Unknown error',
        )

        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 },
        )
    }
}
