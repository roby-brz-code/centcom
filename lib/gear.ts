// ── Gear catalog ──────────────────────────────────────────────────
// Cosmetic loot, bought with gold and rendered as pixel layers on the
// hero sprite. One item equipped per slot; owning is permanent.

export type GearSlot = "head" | "hand" | "offhand" | "back" | "pet"

export interface PixelLayer {
  rows: string[]
  colors: Record<string, string>
  /** Offset on the 16×18 hero canvas */
  ox: number
  oy: number
  /** Drawn behind the hero (capes) */
  behind?: boolean
}

export interface GearItem {
  id: string
  slot: GearSlot
  name: string
  emoji: string
  price: number
  pixels: PixelLayer[]
}

export const GEAR: GearItem[] = [
  {
    id: "g-sword",
    slot: "hand",
    name: "Iron Sword",
    emoji: "🗡️",
    price: 150,
    pixels: [
      {
        ox: 14,
        oy: 5,
        rows: [".B", ".B", ".B", ".B", ".B", "GG", ".H", ".H"],
        colors: { B: "#cdd6e8", G: "#f0c25e", H: "#8a5a2b" },
      },
    ],
  },
  {
    id: "g-shield",
    slot: "offhand",
    name: "Round Shield",
    emoji: "🛡️",
    price: 250,
    pixels: [
      {
        ox: 0,
        oy: 9,
        rows: [".SS.", "SBBS", "SBBS", ".SS."],
        colors: { S: "#a4713a", B: "#f0c25e" },
      },
    ],
  },
  {
    id: "g-wizard",
    slot: "head",
    name: "Wizard Hat",
    emoji: "🧙",
    price: 300,
    pixels: [
      {
        ox: 3,
        oy: 0,
        rows: ["....PP....", "...PPPP...", "..PPSPPP..", ".PPPPPPPP.", "PPPPPPPPPP"],
        colors: { P: "#7c5cff", S: "#f0c25e" },
      },
    ],
  },
  {
    id: "g-cape",
    slot: "back",
    name: "Crimson Cape",
    emoji: "🧣",
    price: 400,
    pixels: [
      {
        ox: 1,
        oy: 8,
        behind: true,
        rows: [
          "RRRRRRRRRRRRRR",
          "RRRRRRRRRRRRRR",
          "RRRRRRRRRRRRRR",
          "RRRRRRRRRRRRRR",
          "RRRRRRRRRRRRRR",
          "RRRRRRRRRRRRRR",
          "RRRRRRRRRRRRRR",
        ],
        colors: { R: "#c0392b" },
      },
      {
        ox: 0,
        oy: 15,
        behind: true,
        rows: ["RRRRRRRRRRRRRRRR"],
        colors: { R: "#a93226" },
      },
    ],
  },
  {
    id: "g-slime",
    slot: "pet",
    name: "Pet Slime",
    emoji: "🫧",
    price: 600,
    // Pets render as their own little sprite next to the hero
    pixels: [
      {
        ox: 0,
        oy: 0,
        rows: ["..TTT..", ".TTTTT.", "TETETTT", "TTTTTTT"],
        colors: { T: "#3ddc97", E: "#0b1026" },
      },
    ],
  },
  {
    id: "g-crown",
    slot: "head",
    name: "Golden Crown",
    emoji: "👑",
    price: 900,
    pixels: [
      {
        ox: 4,
        oy: 2,
        rows: ["G.G.G.G", "GGGRGGG"],
        colors: { G: "#f0c25e", R: "#e0556c" },
      },
    ],
  },
  {
    id: "g-halo",
    slot: "head",
    name: "Halo",
    emoji: "😇",
    price: 1500,
    pixels: [
      {
        ox: 5,
        oy: 0,
        rows: ["HHHHHH"],
        colors: { H: "#ffe08a" },
      },
    ],
  },
]

export function gearById(id: string): GearItem | undefined {
  return GEAR.find((g) => g.id === id)
}

// ── Themes ────────────────────────────────────────────────────────
// Table skins, unlocked automatically at level milestones (never bought
// with gold — ranking up has its own payoff).

export interface Theme {
  id: string
  name: string
  emoji: string
  minLevel: number
  /** CSS class suffix applied to .qm-page ("" = default) */
  className: string
  /** Swatch gradient for the armory preview */
  preview: string
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    minLevel: 1,
    className: "",
    preview: "linear-gradient(160deg, #0d1330, #090c1e)",
  },
  {
    id: "forest",
    name: "Deep Forest",
    emoji: "🌲",
    minLevel: 3,
    className: "qm-t-forest",
    preview: "linear-gradient(160deg, #12240f, #071106)",
  },
  {
    id: "dawn",
    name: "Dawn",
    emoji: "🌅",
    minLevel: 5,
    className: "qm-t-dawn",
    preview: "linear-gradient(160deg, #3a1a4a, #14092a)",
  },
  {
    id: "ember",
    name: "Ember",
    emoji: "🔥",
    minLevel: 8,
    className: "qm-t-ember",
    preview: "linear-gradient(160deg, #351310, #120504)",
  },
  {
    id: "aurora",
    name: "Aurora",
    emoji: "🌌",
    minLevel: 12,
    className: "qm-t-aurora",
    preview: "linear-gradient(160deg, #073028, #090c1e)",
  },
]

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
