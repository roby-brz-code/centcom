"use client"

export type HeroState = "idle" | "focusing" | "victory"

// 12×14 pixel map — each char is one pixel, "." is transparent.
const PIXELS = [
  "....CCCC....",
  "...CCCCCC...",
  "..CCCCCCCC..",
  "..CDFFFFDC..",
  "..CDFEFEDC..",
  "..CDFFFFDC..",
  "...DFFFFD...",
  "..CCCCCCCC..",
  ".CCGGGGGGCC.",
  ".CCTTTTTTCC.",
  "..CTTTTTTC..",
  "...TTTTTT...",
  "...LL..LL...",
  "..LL....LL..",
]

const COLORS: Record<string, string> = {
  C: "#8b6cff", // cloak
  D: "#5f43d8", // cloak shadow
  F: "#f2c9a0", // skin
  E: "#241b4d", // eyes
  G: "#f0b429", // belt
  T: "#38c7a2", // tunic
  L: "#2b2350", // boots
}

// Eyes close while focusing — swap eye pixels for skin.
const FOCUS_COLORS: Record<string, string> = { ...COLORS, E: "#e0b088" }

export default function PixelHero({
  state,
  size = 96,
}: {
  state: HeroState
  size?: number
}) {
  const palette = state === "focusing" ? FOCUS_COLORS : COLORS
  return (
    <div className={`qm-hero qm-hero-${state}`} style={{ width: size }}>
      <svg
        viewBox="0 0 12 14"
        width={size}
        height={(size / 12) * 14}
        shapeRendering="crispEdges"
        aria-label={`Pixel hero, ${state}`}
      >
        {PIXELS.flatMap((row, y) =>
          row.split("").map((ch, x) =>
            ch === "." ? null : (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[ch]} />
            )
          )
        )}
      </svg>
    </div>
  )
}
