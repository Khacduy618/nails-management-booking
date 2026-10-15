
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { generateNailAssistantReply } from "@/lib/ai/nail-assistant";

export const runtime = "nodejs";

function verifySignature(
    rawBody: string,
    timestamp: string | null,
    signature: string | null,
    secret: string,
): boolean {
    if (!timestamp || !signature) return false;

    const timestampNumber = Number(timestamp);
    if (!Number.isFinite(timestampNumber)) return false;

    // Chatwoot webhook timestamp được kỳ vọng là Unix time tính bằng giây.
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(nowSeconds - timestampNumber) > 300) {
        return false;
    }

    const digest = createHmac("sha256", secret)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");

    const expected = Buffer.from(`sha256=${digest}`);
    const received = Buffer.from(signature);

    if (expected.length !== received.length) return false;

    return timingSafeEqual(expected, received);
}

export async function POST(request: NextRequest) {
    const secret = process.env.CHATWOOT_WEBHOOK_SECRET;
    const baseUrl = process.env.CHATWOOT_BASE_URL?.replace(/\/+$/, "");
    const accountId = process.env.CHATWOOT_ACCOUNT_ID;
    const botToken = process.env.CHATWOOT_AGENT_BOT_TOKEN;

    if (!secret || !baseUrl || !accountId || !botToken) {
        console.error("[Chatwoot AgentBot] Missing server configuration");

        return NextResponse.json(
            { error: "Webhook server is not configured" },
            { status: 500 },
        );
    }

    const rawBody = await request.text();
    const timestamp = request.headers.get("x-chatwoot-timestamp");
    const signature = request.headers.get("x-chatwoot-signature");

    if (!verifySignature(rawBody, timestamp, signature, secret)) {
        return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 },
        );
    }

    let payload: any;

    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON payload" },
            { status: 400 },
        );
    }

    if (payload.event !== "message_created") {
        return NextResponse.json({ ignored: true, reason: "unsupported_event" });
    }

    const messageType = payload.message_type;
    const isIncoming =
        messageType === "incoming" ||
        messageType === 0;

    if (!isIncoming || payload.private === true) {
        return NextResponse.json({ ignored: true, reason: "not_customer_message" });
    }

    // Tránh phản hồi các message không phải từ contact nếu Chatwoot có sender.type.
    if (payload.sender?.type && payload.sender.type !== "contact") {
        return NextResponse.json({ ignored: true, reason: "not_contact" });
    }

    const content =
        typeof payload.content === "string" ? payload.content.trim() : "";

    const conversationId = Number(
        payload.conversation?.id ?? payload.conversation_id,
    );

    if (!content || !Number.isSafeInteger(conversationId) || conversationId <= 0) {
        return NextResponse.json(
            { error: "Missing message content or conversation ID" },
            { status: 400 },
        );
    }

    let reply: string;

    try {
        reply = await generateNailAssistantReply(content);
    } catch (error) {
        console.error("[Chatwoot AgentBot] Assistant failed:", error);

        reply =
            "Xin lỗi, mình chưa thể xử lý câu hỏi lúc này. " +
            "Bạn vui lòng thử lại sau hoặc liên hệ nhân viên nhé.";
    }

    try {
        const chatwootResponse = await fetch(
            `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    api_access_token: botToken,
                },
                body: JSON.stringify({
                    content: reply,
                    message_type: "outgoing",
                    private: false,
                }),
                signal: AbortSignal.timeout(15_000),
            },
        );

        if (!chatwootResponse.ok) {
            const errorBody = await chatwootResponse.text();

            console.error("[Chatwoot AgentBot] Failed to send reply:", {
                status: chatwootResponse.status,
                body: errorBody.slice(0, 500),
            });

            return NextResponse.json(
                { error: "Unable to send Chatwoot reply" },
                { status: 502 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Chatwoot AgentBot] Chatwoot request failed:", error);

        return NextResponse.json(
            { error: "Chatwoot request failed" },
            { status: 502 },
        );
    }
}
