import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
})

export const metadata: Metadata = {
  title: "Quest Mode",
  description: "RPG-style focus and quest tracking",
}

export default function QuestsLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}>{children}</div>
}
