import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'CodeGraph Intelligence',
    description: 'AI-Powered Codebase Intelligence & Impact Analysis Platform',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning className={`${inter.className} bg-slate-950 text-white min-h-screen antialiased overflow-hidden`}>{children}</body>
        </html>
    )
}
