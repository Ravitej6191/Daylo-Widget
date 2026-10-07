// Positions in CSS px, measured from the reference design (card 1781x589 image px,
// scaled to the 800x266 window). Origin is the card's top-left corner.
export const CARD = { width: 736, height: 266 } as const

// Whole-widget scale. Every position above is in the 800x266 design space and is zoomed as one.
export const SCALE = 0.75

export const LAYOUT = {
  headline: { left: 32, top: 25, size: 31 },
  date: { left: 35, top: 65, size: 19 },
  weatherIcon: { left: 32, top: 98, size: 72 },
  temperature: { left: 109, top: 109, size: 50 },
  divider: { left: 203, top: 114, height: 38 },
  condition: { left: 214, top: 112, size: 17 },
  highLow: { left: 214, top: 143, size: 15 },
  panel: { left: 23, top: 175, width: 426, height: 67 },
  clock: { left: 482, top: 12, size: 242 },
  settingsButton: { left: 424, top: 16, size: 38 },
} as const
