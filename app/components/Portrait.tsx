"use client"

import { useEffect, useRef } from "react"
import { CHAR, charPalette, drawSprite } from "@/app/lib/office"

// A scaled-up pixel portrait of an agent, drawn from the shared sprite data.
export default function Portrait({ shirt, scale = 5 }: { shirt: string; scale?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.imageSmoothingEnabled = false
    drawSprite(ctx, CHAR, charPalette(shirt), 0, 0)
  }, [shirt])

  return (
    <canvas
      ref={ref}
      width={12}
      height={14}
      className="pixelated shrink-0"
      style={{
        width: 12 * scale,
        height: 14 * scale,
        border: "2px solid var(--ink)",
        background: "var(--accent-soft)",
      }}
    />
  )
}
