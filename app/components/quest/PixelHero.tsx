"use client"

import { gearById, PixelLayer } from "@/lib/gear"

export type HeroState = "idle" | "focusing" | "victory"

// Hero canvas is 16×18: rows 0–3 leave room for hats, columns 0–1 and
// 14–15 for held items and capes. The hero itself is 12×14 at (2,4).
const CANVAS_W = 16
const CANVAS_H = 18
const HERO_OX = 2
const HERO_OY = 4

const HERO_ROWS = [
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

const HERO_COLORS: Record<string, string> = {
  C: "#8b6cff", // cloak
  D: "#5f43d8", // cloak shadow
  F: "#f2c9a0", // skin
  E: "#241b4d", // eyes
  G: "#f0b429", // belt
  T: "#38c7a2", // tunic
  L: "#2b2350", // boots
}

// Eyes close while focusing — swap eye pixels for skin.
const FOCUS_COLORS: Record<string, string> = { ...HERO_COLORS, E: "#e0b088" }

function layerRects(layer: PixelLayer, keyPrefix: string) {
  return layer.rows.flatMap((row, y) =>
    row.split("").map((ch, x) =>
      ch === "." || ch === " " ? null : (
        <rect
          key={`${keyPrefix}-${x}-${y}`}
          x={layer.ox + x}
          y={layer.oy + y}
          width={1}
          height={1}
          fill={layer.colors[ch]}
        />
      )
    )
  )
}

export default function PixelHero({
  state,
  size = 96,
  equipment = [],
}: {
  state: HeroState
  size?: number
  /** Equipped gear item ids (pets are drawn separately — see PetSprite) */
  equipment?: string[]
}) {
  const palette = state === "focusing" ? FOCUS_COLORS : HERO_COLORS
  const layers = equipment
    .map(gearById)
    .filter((g) => g !== undefined && g.slot !== "pet")
    .flatMap((g) => g!.pixels)
  const behind = layers.filter((l) => l.behind)
  const front = layers.filter((l) => !l.behind)

  return (
    <div className={`qm-hero qm-hero-${state}`} style={{ width: size }}>
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        width={size}
        height={(size / CANVAS_W) * CANVAS_H}
        shapeRendering="crispEdges"
        aria-label={`Pixel hero, ${state}`}
      >
        {behind.map((l, i) => layerRects(l, `b${i}`))}
        {HERO_ROWS.flatMap((row, y) =>
          row.split("").map((ch, x) =>
            ch === "." ? null : (
              <rect
                key={`h-${x}-${y}`}
                x={HERO_OX + x}
                y={HERO_OY + y}
                width={1}
                height={1}
                fill={palette[ch]}
              />
            )
          )
        )}
        {front.map((l, i) => layerRects(l, `f${i}`))}
      </svg>
    </div>
  )
}

/** Small companion sprite, rendered beside the hero when a pet is equipped */
export function PetSprite({ itemId, size = 30 }: { itemId: string; size?: number }) {
  const item = gearById(itemId)
  if (!item) return null
  const layer = item.pixels[0]
  const w = layer.rows[0].length
  const h = layer.rows.length
  return (
    <div className="qm-hero qm-hero-idle" style={{ width: size }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={size}
        height={(size / w) * h}
        shapeRendering="crispEdges"
        aria-label={item.name}
      >
        {layerRects({ ...layer, ox: 0, oy: 0 }, "p")}
      </svg>
    </div>
  )
}
