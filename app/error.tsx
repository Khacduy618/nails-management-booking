'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Lỗi</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Đã xảy ra lỗi!
                </h2>
                <p className="text-gray-600 mb-6">
                    {error.message || 'Đã xảy ra lỗi không mong muốn'}
                </p>
                <Button onClick={reset} className="w-full">
                    Thử Lại
                </Button>
            </div>
        </div>
    )
}
