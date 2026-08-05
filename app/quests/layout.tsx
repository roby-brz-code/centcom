import type { Metadata } from "next"
import { Press_Start_2P } from "next/font/google"

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

export const metadata: Metadata = {
  title: "Quest Mode",
  description: "RPG-style focus and quest tracking",
}

export default function QuestsLayout({ children }: { children: React.ReactNode }) {
  return <div className={pressStart.variable}>{children}</div>
}
