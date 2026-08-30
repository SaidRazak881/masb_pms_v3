import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata = {
  title: 'MIMOS Academy PMS',
  description: 'Sistem Pengurusan R1/R2/R3 MIMOS Academy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
