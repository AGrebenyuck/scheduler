import { CreateEventDrawer } from '@/components/create-event'
import Header from '@/components/header'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'

export const metadata = {
	title: 'Scheduler',
	description: 'Scheduling app',
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
	return (
		<ClerkProvider>
			<html lang='en'>
				<body className={inter.className}>
					{/* Header */}
					<Header />
					<main className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
						{children}
					</main>
					{/* Footer */}
					<footer className='bg-blue-100 py-12'>
						<div className='container mx-auto px-4 text-center text-gray-600'>
							<p>Made by Hrebeniuk</p>
						</div>
					</footer>
					<Suspense fallback={<div>Loading...</div>}>
						<CreateEventDrawer />
					</Suspense>
				</body>
			</html>
		</ClerkProvider>
	)
}
