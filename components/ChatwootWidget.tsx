
'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        chatwootSDK?: {
            run: (options: {
                websiteToken: string;
                baseUrl: string;
            }) => void;
        };
    }
}

export default function ChatwootWidget() {
    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL
            ?.replace(/\/+$/, '');

        const websiteToken =
            process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;

        if (!baseUrl || !websiteToken) {
            console.error('[Chatwoot] Missing configuration');
            return;
        }

        let cancelled = false;

        const initialize = () => {
            if (cancelled || !window.chatwootSDK) return;

            window.chatwootSDK.run({
                websiteToken,
                baseUrl,
            });
        };

        if (window.chatwootSDK) {
            initialize();
        } else {
            let script = document.querySelector<HTMLScriptElement>(
                'script[data-chatwoot-sdk]'
            );

            if (!script) {
                script = document.createElement('script');
                script.src = `${baseUrl}/packs/js/sdk.js`;
                script.async = true;
                script.dataset.chatwootSdk = 'true';
                script.onload = initialize;
                script.onerror = () => {
                    console.error('[Chatwoot] Failed to load SDK');
                };
                document.body.appendChild(script);
            } else {
                script.addEventListener('load', initialize, { once: true });
            }
        }

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
