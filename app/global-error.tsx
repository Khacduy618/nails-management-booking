'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
                    <div className="max-w-md w-full text-center">
                        <h1 className="text-4xl font-bold text-red-600 mb-4">500</h1>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            Something went wrong!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
