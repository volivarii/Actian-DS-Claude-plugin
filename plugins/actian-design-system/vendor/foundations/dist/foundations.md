# Actian Design Foundation

<!--
  Substrate vs. presentation.

  This file is the agnostic, structured substrate (per GOVERNANCE.md) — it
  authors token shapes, primitives, scales, and the design rules that govern
  them. It is NOT the rendered Foundations page on the public docs site.

  The docs site (https://github.com/volivarii/actian-ds-docs) ships an
  opinionated, hand-authored view of these tokens under
  `src/content/docs/foundations/*.mdx`. Section names, page order, embedded
  widgets, and prose flavor are docs-side decisions. Token shapes and
  data contracts are substrate-side decisions.

  When the docs Foundations layout diverges from this file, that is
  legitimate per GOVERNANCE.md "Presentation divergence is allowed."

  When making edits here:
   - Token shapes, primitives, scale ramps, design-guideline rules → live
     here, in this file.
   - Section labels on the public docs site, page order, "Brand & feedback
     colors" vs "Color" naming, what gets embedded with what widget →
     live in actian-ds-docs MDX.
-->

> **Built on Zen**
> The Actian Design System is built on top of the **Zen Design System** — Zen provides the underlying token architecture, color primitives, spacing scale, typography, and component logic that Actian inherits and extends. Where Actian-specific decisions diverge from or expand on Zen, they are noted explicitly. When in doubt, Zen is the foundation.

> **How to use this doc**
> This is the authoritative reference for the Actian design system. It covers current primitives, existing tokens (in both Figma/hex and engineering/OKLCH formats), and foundational usage rules. Tokens are marked with a status (🟢 Shipped, 🔵 In Review, 🟡 Proposed) throughout Section 2.

**Version:** 1.2.0
**Last updated:** May 11, 2026

---

## Table of Contents

1. [Color Primitives](./color-primitives.md)
   - OKLCH Shade Formula
   - Primitives (all palettes, 25–900)

2. [Tokens](./tokens.md)
   - Status Key
   - 2.1 Global Color
   - 2.2 Typography
   - 2.3 Borders
   - 2.4 Breakpoints
   - 2.5 Focus Rings
   - 2.6 Elevation
   - 2.7 Spacing
   - 2.8 Backgrounds
   - 2.9 Heights and Trigger Areas
   - 2.10 Icons
   - 2.11 Motion

3. [Design Guidelines](./design-guidelines.md)
   - 3.1 Color Usage Rules
   - 3.2 Typography Rules
   - 3.3 Spacing Rules
   - 3.4 Elevation Rules
   - 3.5 Brightness Filter Convention — Interactive States
   - 3.6 Breakpoints

4. [Handoff Protocol](./handoff-protocol.md)
   - 4.1 Before You Hand Off
   - 4.2 Figma Handoff Checklist
   - 4.3 What to Include in Every Handoff
   - 4.4 When Something Is Missing

5. [Related Guidelines](./related-guidelines.md)
   - 5.1 Accessibility Guidelines
   - 5.2 Content Guidelines

---

## 1. Color Primitives

All color palettes follow a shared OKLCH shade formula. Each palette has a named base (500), and all other shades are derived from it. Figma stores these as hex; engineering implements them as OKLCH with relative color syntax.

### OKLCH Shade Formula

Engineering derives all shades from the 500 base using the following formula:

| Shade | Lightness (L) | Chroma (C) |
|-------|--------------|------------|
| 25 | `0.97` 🟡 Proposed *(update from 0.99)* | `calc(c * 0.005)` 🟡 Proposed *(update from c * 0.2)* |
| 50 | `calc(l + (0.99 - l) * 5/6)` | `calc(c * 0.3)` |
| 100 | `calc(l + (0.99 - l) * 4/6)` | `calc(c * 0.4)` |
| 200 | `calc(l + (0.99 - l) / 2)` | `calc(c * 0.6)` |
| 300 | `calc(l + (0.99 - l) * 2/6)` | `calc(c * 0.7)` |
| 400 | `calc(l + (0.99 - l) * 1/6)` | `calc(c * 0.85)` |
| **500** | **Base** | **Base** |
| 600 | `calc(l * 0.94)` | `calc(c * 1.05)` |
| 700 | `calc(l * 0.85)` | `calc(c * 0.95)` |
| 800 | `calc(l * 0.73)` | `calc(c * 0.75)` |
| 900 | `calc(l * 0.63)` | `calc(c * 0.55)` |

> **Note on Figma vs Eng:** Figma stores colors as hex values. Engineering uses OKLCH with the formula above. There can be minor visual differences between platforms — always defer to the Figma file for design decisions and engineering code for production output.

---

### Primitives

All color primitives across the system. Every palette follows the same OKLCH shade formula (25–900). Semantic roles are defined in the Semantic Tokens section below.

#### White & Black

| Token | Value | Status |
|-------|-------|--------|
| `--zen-color-white` | `oklch(1 0 0)` / `#FFFFFF` | 🟢 Shipped |
| `--zen-color-black` | `oklch(0 0 0)` / `#000000` | 🟢 Shipped |

#### Green
OKLCH 500 base: `oklch(0.5812 0.1816 141.19)` — *Success semantic role*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-green-25` | `#F3F6F3` 🟡 | `oklch(0.97 0.005 141.19)` 🟡 |
| 50 | `--zen-color-green-50` | `#D3EFCD` | `oklch(0.8677 0.0545 141.19)` |
| 100 | `--zen-color-green-100` | `#B5DCAF` | `oklch(0.8211 0.0726 141.19)` |
| 200 | `--zen-color-green-200` | `#92CC89` | `oklch(0.7812 0.1090 141.19)` |
| 300 | `--zen-color-green-300` | `#75B86B` | `oklch(0.7346 0.1271 141.19)` |
| 400 | `--zen-color-green-400` | `#53A647` | `oklch(0.6879 0.1544 141.19)` |
| **500** | **`--zen-color-green-500`** | **`#299315`** | **`oklch(0.5812 0.1816 141.19)`** |
| 600 | `--zen-color-green-600` | `#098900` | `oklch(0.5463 0.1907 141.19)` |
| 700 | `--zen-color-green-700` | `#047800` | `oklch(0.494 0.1725 141.19)` |
| 800 | `--zen-color-green-800` | `#145F04` | `oklch(0.4243 0.1362 141.19)` |
| 900 | `--zen-color-green-900` | `#1A4B14` | `oklch(0.3662 0.0999 141.19)` |

#### Orange
OKLCH 500 base: `oklch(0.7775 0.166 66.57)` — *Warning semantic role*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-orange-25` | `#F7F4F2` 🟡 | `oklch(0.97 0.005 66.57)` 🟡 |
| 50 | `--zen-color-orange-50` | `#FFEBCE` | `oklch(0.9479 0.0498 66.57)` |
| 100 | `--zen-color-orange-100` | `#FFDDB6` | `oklch(0.9183 0.0664 66.57)` |
| 200 | `--zen-color-orange-200` | `#FFCD92` | `oklch(0.8888 0.0996 66.57)` |
| 300 | `--zen-color-orange-300` | `#FFBE78` | `oklch(0.8592 0.1162 66.57)` |
| 400 | `--zen-color-orange-400` | `#FFAF53` | `oklch(0.8296 0.1411 66.57)` |
| **500** | **`--zen-color-orange-500`** | **`#FC9F1D`** | **`oklch(0.7775 0.166 66.57)`** |
| 600 | `--zen-color-orange-600` | `#EF8D00` | `oklch(0.7309 0.1743 66.57)` |
| 700 | `--zen-color-orange-700` | `#D27B00` | `oklch(0.6609 0.1577 66.57)` |
| 800 | `--zen-color-orange-800` | `#A76605` | `oklch(0.5676 0.1245 66.57)` |
| 900 | `--zen-color-orange-900` | `#83551F` | `oklch(0.4898 0.0913 66.57)` |

#### Red
OKLCH 500 base: `oklch(0.6243 0.1982 32.45)` — *Error semantic role*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-red-25` | `#F8F4F3` 🟡 | `oklch(0.97 0.005 32.45)` 🟡 |
| 50 | `--zen-color-red-50` | `#FFDACF` | `oklch(0.9202 0.0595 32.45)` |
| 100 | `--zen-color-red-100` | `#FFC1B3` | `oklch(0.8828 0.0793 32.45)` |
| 200 | `--zen-color-red-200` | `#FFA38F` | `oklch(0.8121 0.1189 32.45)` |
| 300 | `--zen-color-red-300` | `#F88973` | `oklch(0.7747 0.1387 32.45)` |
| 400 | `--zen-color-red-400` | `#EF6B53` | `oklch(0.7114 0.1685 32.45)` |
| **500** | **`--zen-color-red-500`** | **`#E6492D`** | **`oklch(0.6243 0.1982 32.45)`** |
| 600 | `--zen-color-red-600` | `#DC3514` | `oklch(0.5868 0.2081 32.45)` |
| 700 | `--zen-color-red-700` | `#C12C11` | `oklch(0.5307 0.1883 32.45)` |
| 800 | `--zen-color-red-800` | `#982A18` | `oklch(0.4557 0.1487 32.45)` |
| 900 | `--zen-color-red-900` | `#762A1C` | `oklch(0.3933 0.109 32.45)` |

#### Grey
OKLCH 500 base: `oklch(0.683 0 0)` — *Neutral semantic role*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-grey-25` | `#F8F4F5` 🟡 | `oklch(0.97 0.005 0)` 🟡 |
| 50 | `--zen-color-grey-50` | `#EBEBEB` | `oklch(0.9358 0 0)` |
| 100 | `--zen-color-grey-100` | `#DADADA` | `oklch(0.8887 0 0)` |
| 200 | `--zen-color-grey-200` | `#C9C9C9` | `oklch(0.8415 0 0)` |
| 300 | `--zen-color-grey-300` | `#B9B9B9` | `oklch(0.7943 0 0)` |
| 400 | `--zen-color-grey-400` | `#A9A9A9` | `oklch(0.7472 0 0)` |
| **500** | **`--zen-color-grey-500`** | **`#999999`** | **`oklch(0.683 0 0)`** |
| 600 | `--zen-color-grey-600` | `#8D8D8D` | `oklch(0.642 0 0)` |
| 700 | `--zen-color-grey-700` | `#7B7B7B` | `oklch(0.5806 0 0)` |
| 800 | `--zen-color-grey-800` | `#636363` | `oklch(0.4986 0 0)` |
| 900 | `--zen-color-grey-900` | `#505050` | `oklch(0.4303 0 0)` |

#### Royal Blue
OKLCH 500 base: `oklch(0.5216 0.2044 260.3)` — *Actian theme primary*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-royal-blue-25` | `#F3F5F9` 🟡 | `oklch(0.97 0.005 260.3)` 🟡 |
| 50 | `--zen-color-royal-blue-50` | `#CBE3FF` | `oklch(0.9119 0.0613 260.3)` |
| 100 | `--zen-color-royal-blue-100` | `#AACAFE` | `oklch(0.8339 0.0818 260.3)` |
| 200 | `--zen-color-royal-blue-200` | `#82B0FD` | `oklch(0.7558 0.1226 260.3)` |
| 300 | `--zen-color-royal-blue-300` | `#6296EF` | `oklch(0.6777 0.1431 260.3)` |
| 400 | `--zen-color-royal-blue-400` | `#3D7CE6` | `oklch(0.5997 0.1737 260.3)` |
| **500** | **`--zen-color-royal-blue-500`** | **`#0F5FDC`** | **`oklch(0.5216 0.2044 260.3)`** |
| 600 | `--zen-color-royal-blue-600` | `#0053D7` | `oklch(0.4903 0.2146 260.3)` |
| 700 | `--zen-color-royal-blue-700` | `#0047BC` | `oklch(0.4434 0.1942 260.3)` |
| 800 | `--zen-color-royal-blue-800` | `#033B92` | `oklch(0.3808 0.1533 260.3)` |
| 900 | `--zen-color-royal-blue-900` | `#0D316D` | `oklch(0.3286 0.1124 260.3)` |

#### Blue
OKLCH 500 base: `oklch(0.58 0.130062 238.7173)` — *Studio & Admin theme primary*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-blue-25` | `#F2F6F8` 🟡 | `oklch(0.97 0.005 238.72)` 🟡 |
| 50 | `--zen-color-blue-50` | `#CFEAFD` | `oklch(0.9297 0.039 238.72)` |
| 100 | `--zen-color-blue-100` | `#B1D5EE` | `oklch(0.8827 0.052 238.72)` |
| 200 | `--zen-color-blue-200` | `#8BC0E6` | `oklch(0.79 0.078 238.72)` |
| 300 | `--zen-color-blue-300` | `#6BACD7` | `oklch(0.7297 0.091 238.72)` |
| 400 | `--zen-color-blue-400` | `#4598CB` | `oklch(0.6648 0.1106 238.72)` |
| **500** | **`--zen-color-blue-500`** | **`#0283BE`** | **`oklch(0.58 0.130062 238.7173)`** |
| 600 | `--zen-color-blue-600` | `#0079B6` | `oklch(0.5452 0.1366 238.72)` |
| 700 | `--zen-color-blue-700` | `#00699F` | `oklch(0.493 0.1236 238.72)` |
| 800 | `--zen-color-blue-800` | `#00547D` | `oklch(0.4234 0.0976 238.72)` |
| 900 | `--zen-color-blue-900` | `#114361` | `oklch(0.3654 0.0715 238.72)` |

#### Turquoise
OKLCH 500 base: `oklch(0.6233 0.1066 192.34)` — *Explorer theme primary*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-turquoise-25` | `#F1F6F6` 🟡 | `oklch(0.97 0.005 192.34)` 🟡 |
| 50 | `--zen-color-turquoise-50` | `#D0EFED` | `oklch(0.9189 0.032 192.34)` |
| 100 | `--zen-color-turquoise-100` | `#B5DDDB` | `oklch(0.8755 0.0426 192.34)` |
| 200 | `--zen-color-turquoise-200` | `#90CECB` | `oklch(0.812 0.064 192.34)` |
| 300 | `--zen-color-turquoise-300` | `#72BCB9` | `oklch(0.7622 0.0746 192.34)` |
| 400 | `--zen-color-turquoise-400` | `#4AACA9` | `oklch(0.6928 0.0906 192.34)` |
| **500** | **`--zen-color-turquoise-500`** | **`#049B98`** | **`oklch(0.6233 0.1066 192.34)`** |
| 600 | `--zen-color-turquoise-600` | `#00908E` | `oklch(0.5859 0.1119 192.34)` |
| 700 | `--zen-color-turquoise-700` | `#007E7B` | `oklch(0.5298 0.1013 192.34)` |
| 800 | `--zen-color-turquoise-800` | `#006563` | `oklch(0.455 0.0800 192.34)` |
| 900 | `--zen-color-turquoise-900` | `#15504E` | `oklch(0.3927 0.0586 192.34)` |

#### Purple
OKLCH 500 base: `oklch(0.6798 0.0933 313.67)` — *Former primary; available for data viz, tags*

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-purple-25` | `#F6F4F7` 🟡 | `oklch(0.97 0.005 313.67)` 🟡 |
| 50 | `--zen-color-purple-50` | `#F2E6F8` | `oklch(0.9415 0.028 313.67)` |
| 100 | `--zen-color-purple-100` | `#E3D3EC` | `oklch(0.8932 0.0373 313.67)` |
| 200 | `--zen-color-purple-200` | `#D7BFE4` | `oklch(0.8399 0.056 313.67)` |
| 300 | `--zen-color-purple-300` | `#C7ADD7` | `oklch(0.7866 0.0653 313.67)` |
| 400 | `--zen-color-purple-400` | `#BA9ACC` | `oklch(0.7332 0.0793 313.67)` |
| **500** | **`--zen-color-purple-500`** | **`#AD88C1`** | **`oklch(0.6798 0.0933 313.67)`** |
| 600 | `--zen-color-purple-600` | `#A17AB6` | `oklch(0.639 0.098 313.67)` |
| 700 | `--zen-color-purple-700` | `#8C6A9F` | `oklch(0.5778 0.0886 313.67)` |
| 800 | `--zen-color-purple-800` | `#71567F` | `oklch(0.4963 0.07 313.67)` |
| 900 | `--zen-color-purple-900` | `#5A4764` | `oklch(0.4283 0.0512 313.67)` |

#### Blue Grey
OKLCH 500 base: `oklch(0.5724 0.0397 229.02)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-blue-grey-25` | `#F2F6F8` 🟡 | `oklch(0.97 0.005 229.02)` 🟡 |
| 50 | `--zen-color-blue-grey-50` | `#DDE6EC` | `oklch(0.9287 0.0119 229.02)` |
| 100 | `--zen-color-blue-grey-100` | `#C4D0D7` | `oklch(0.8816 0.0159 229.02)` |
| 200 | `--zen-color-blue-grey-200` | `#AABCC4` | `oklch(0.8062 0.0238 229.02)` |
| 300 | `--zen-color-blue-grey-300` | `#91A6B0` | `oklch(0.7486 0.0278 229.02)` |
| 400 | `--zen-color-blue-grey-400` | `#78929D` | `oklch(0.6912 0.0338 229.02)` |
| **500** | **`--zen-color-blue-grey-500`** | **`#607D8C`** | **`oklch(0.5724 0.0397 229.02)`** |
| 600 | `--zen-color-blue-grey-600` | `#547482` | `oklch(0.538 0.0417 229.02)` |
| 700 | `--zen-color-blue-grey-700` | `#4A6470` | `oklch(0.4865 0.0377 229.02)` |
| 800 | `--zen-color-blue-grey-800` | `#3C515A` | `oklch(0.4179 0.0298 229.02)` |
| 900 | `--zen-color-blue-grey-900` | `#323F47` | `oklch(0.3606 0.0218 229.02)` |

#### Yellow
OKLCH 500 base: `oklch(0.8699 0.1453 89.43)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-yellow-25` | `#F6F5F1` 🟡 | `oklch(0.97 0.005 89.43)` 🟡 |
| 50 | `--zen-color-yellow-50` | `#FFF5D5` | `oklch(0.9499 0.0436 89.43)` |
| 100 | `--zen-color-yellow-100` | `#FEEDC3` | `oklch(0.9166 0.0581 89.43)` |
| 200 | `--zen-color-yellow-200` | `#FFE6A5` | `oklch(0.8849 0.0872 89.43)` |
| 300 | `--zen-color-yellow-300` | `#FCDF91` | `oklch(0.8533 0.1017 89.43)` |
| 400 | `--zen-color-yellow-400` | `#FBD776` | `oklch(0.8616 0.1235 89.43)` |
| **500** | **`--zen-color-yellow-500`** | **`#FACF55`** | **`oklch(0.8699 0.1453 89.43)`** |
| 600 | `--zen-color-yellow-600` | `#EABD34` | `oklch(0.8177 0.1526 89.43)` |
| 700 | `--zen-color-yellow-700` | `#CDA52C` | `oklch(0.7394 0.1381 89.43)` |
| 800 | `--zen-color-yellow-800` | `#A58732` | `oklch(0.6351 0.1090 89.43)` |
| 900 | `--zen-color-yellow-900` | `#836F37` | `oklch(0.5481 0.0799 89.43)` |

#### Olive Green
OKLCH 500 base: `oklch(0.58 0.137262 119.6914)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-olive-green-25` | `#F4F6F2` 🟡 | `oklch(0.97 0.005 119.69)` 🟡 |
| 50 | `--zen-color-olive-green-50` | `#E1EACB` | `oklch(0.9213 0.0412 119.69)` |
| 100 | `--zen-color-olive-green-100` | `#CAD5AD` | `oklch(0.8627 0.055 119.69)` |
| 200 | `--zen-color-olive-green-200` | `#B2C186` | `oklch(0.79 0.0824 119.69)` |
| 300 | `--zen-color-olive-green-300` | `#9CAD67` | `oklch(0.7313 0.0961 119.69)` |
| 400 | `--zen-color-olive-green-400` | `#879940` | `oklch(0.669 0.1167 119.69)` |
| **500** | **`--zen-color-olive-green-500`** | **`#718601`** | **`oklch(0.58 0.137262 119.6914)`** |
| 600 | `--zen-color-olive-green-600` | `#677B00` | `oklch(0.5452 0.1441 119.69)` |
| 700 | `--zen-color-olive-green-700` | `#5A6B00` | `oklch(0.493 0.1304 119.69)` |
| 800 | `--zen-color-olive-green-800` | `#475500` | `oklch(0.4234 0.103 119.69)` |
| 900 | `--zen-color-olive-green-900` | `#3A440F` | `oklch(0.3654 0.0755 119.69)` |

#### Pacific Blue
OKLCH 500 base: `oklch(0.3803 0.1386 258.03)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-pacific-blue-25` | `#F3F5F8` 🟡 | `oklch(0.97 0.005 258.03)` 🟡 |
| 50 | `--zen-color-pacific-blue-50` | `#CADCF7` | `oklch(0.9134 0.0416 258.03)` |
| 100 | `--zen-color-pacific-blue-100` | `#A5BCDE` | `oklch(0.8468 0.0554 258.03)` |
| 200 | `--zen-color-pacific-blue-200` | `#7A9CCD` | `oklch(0.7469 0.0832 258.03)` |
| 300 | `--zen-color-pacific-blue-300` | `#577CB4` | `oklch(0.6803 0.097 258.03)` |
| 400 | `--zen-color-pacific-blue-400` | `#315EA0` | `oklch(0.5802 0.1178 258.03)` |
| **500** | **`--zen-color-pacific-blue-500`** | **`#023E8A`** | **`oklch(0.3803 0.1386 258.03)`** |
| 600 | `--zen-color-pacific-blue-600` | `#003786` | `oklch(0.3575 0.1455 258.03)` |
| 700 | `--zen-color-pacific-blue-700` | `#002F75` | `oklch(0.3233 0.1317 258.03)` |
| 800 | `--zen-color-pacific-blue-800` | `#00255A` | `oklch(0.2776 0.1040 258.03)` |
| 900 | `--zen-color-pacific-blue-900` | `#041E42` | `oklch(0.2396 0.0762 258.03)` |

#### Pomegranate Red
OKLCH 500 base: `oklch(0.5253 0.155 17.61)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-pomegranate-red-25` | `#F8F4F4` 🟡 | `oklch(0.97 0.005 17.61)` 🟡 |
| 50 | `--zen-color-pomegranate-red-50` | `#FFD6D8` | `oklch(0.9176 0.0465 17.61)` |
| 100 | `--zen-color-pomegranate-red-100` | `#EEB9BC` | `oklch(0.862 0.062 17.61)` |
| 200 | `--zen-color-pomegranate-red-200` | `#E4979E` | `oklch(0.7877 0.093 17.61)` |
| 300 | `--zen-color-pomegranate-red-300` | `#D27A83` | `oklch(0.7302 0.1085 17.61)` |
| 400 | `--zen-color-pomegranate-red-400` | `#C25A67` | `oklch(0.6461 0.1318 17.61)` |
| **500** | **`--zen-color-pomegranate-red-500`** | **`#B1374D`** | **`oklch(0.5253 0.155 17.61)`** |
| 600 | `--zen-color-pomegranate-red-600` | `#A82743` | `oklch(0.4938 0.1628 17.61)` |
| 700 | `--zen-color-pomegranate-red-700` | `#932139` | `oklch(0.4465 0.1473 17.61)` |
| 800 | `--zen-color-pomegranate-red-800` | `#73202F` | `oklch(0.3835 0.1163 17.61)` |
| 900 | `--zen-color-pomegranate-red-900` | `#591E27` | `oklch(0.3309 0.0853 17.61)` |

#### Kickstart Purple
OKLCH 500 base: `oklch(0.6113 0.1162 278.98)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-kickstart-purple-25` | `#F4F5F8` 🟡 | `oklch(0.97 0.005 278.98)` 🟡 |
| 50 | `--zen-color-kickstart-purple-50` | `#E1E5FF` | `oklch(0.9295 0.0349 278.98)` |
| 100 | `--zen-color-kickstart-purple-100` | `#CBD0F2` | `oklch(0.8776 0.0465 278.98)` |
| 200 | `--zen-color-kickstart-purple-200` | `#B4BAEB` | `oklch(0.7973 0.0697 278.98)` |
| 300 | `--zen-color-kickstart-purple-300` | `#9FA5DD` | `oklch(0.7354 0.0813 278.98)` |
| 400 | `--zen-color-kickstart-purple-400` | `#8A90D3` | `oklch(0.6734 0.0988 278.98)` |
| **500** | **`--zen-color-kickstart-purple-500`** | **`#757BC8`** | **`oklch(0.6113 0.1162 278.98)`** |
| 600 | `--zen-color-kickstart-purple-600` | `#6A6FBF` | `oklch(0.5746 0.122 278.98)` |
| 700 | `--zen-color-kickstart-purple-700` | `#5C61A7` | `oklch(0.5196 0.1104 278.98)` |
| 800 | `--zen-color-kickstart-purple-800` | `#4A4E84` | `oklch(0.4463 0.0872 278.98)` |
| 900 | `--zen-color-kickstart-purple-900` | `#3C4066` | `oklch(0.3851 0.0639 278.98)` |

#### Glint Green
OKLCH 500 base: `oklch(0.9292 0.0635 130.94)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-glint-green-25` | `#F4F6F2` 🟡 | `oklch(0.97 0.005 130.94)` 🟡 |
| 50 | `--zen-color-glint-green-50` | `#F4FBEE` | `oklch(0.9744 0.019 130.94)` |
| 100 | `--zen-color-glint-green-100` | `#EFF9E8` | `oklch(0.9621 0.0254 130.94)` |
| 200 | `--zen-color-glint-green-200` | `#E9F7DD` | `oklch(0.9496 0.0381 130.94)` |
| 300 | `--zen-color-glint-green-300` | `#E4F6D6` | `oklch(0.9371 0.0445 130.94)` |
| 400 | `--zen-color-glint-green-400` | `#DFF4CE` | `oklch(0.9246 0.054 130.94)` |
| **500** | **`--zen-color-glint-green-500`** | **`#DAF1C5`** | **`oklch(0.9292 0.0635 130.94)`** |
| 600 | `--zen-color-glint-green-600` | `#C6DFB2` | `oklch(0.8734 0.0667 130.94)` |
| 700 | `--zen-color-glint-green-700` | `#AEC49B` | `oklch(0.7898 0.0603 130.94)` |
| 800 | `--zen-color-glint-green-800` | `#8E9F80` | `oklch(0.6783 0.0476 130.94)` |
| 900 | `--zen-color-glint-green-900` | `#75806B` | `oklch(0.5854 0.0349 130.94)` |

#### Clematis Purple
OKLCH 500 base: `oklch(0.5474 0.0688 308.11)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-clematis-purple-25` | `#F6F4F8` 🟡 | `oklch(0.97 0.005 308.11)` 🟡 |
| 50 | `--zen-color-clematis-purple-50` | `#E7E0EE` | `oklch(0.9229 0.0206 308.11)` |
| 100 | `--zen-color-clematis-purple-100` | `#D1C7D9` | `oklch(0.8762 0.0275 308.11)` |
| 200 | `--zen-color-clematis-purple-200` | `#BBAEC9` | `oklch(0.8037 0.0413 308.11)` |
| 300 | `--zen-color-clematis-purple-300` | `#A695B4` | `oklch(0.7470 0.0482 308.11)` |
| 400 | `--zen-color-clematis-purple-400` | `#907DA3` | `oklch(0.6703 0.0585 308.11)` |
| **500** | **`--zen-color-clematis-purple-500`** | **`#7D6690`** | **`oklch(0.5474 0.0688 308.11)`** |
| 600 | `--zen-color-clematis-purple-600` | `#745C88` | `oklch(0.5145 0.0722 308.11)` |
| 700 | `--zen-color-clematis-purple-700` | `#644F77` | `oklch(0.4653 0.0654 308.11)` |
| 800 | `--zen-color-clematis-purple-800` | `#4F405D` | `oklch(0.3996 0.0516 308.11)` |
| 900 | `--zen-color-clematis-purple-900` | `#3F3548` | `oklch(0.3449 0.0378 308.11)` |

#### Mellow Melon Pink
OKLCH 500 base: `oklch(0.6062 0.2298 9.63)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-mellow-melon-pink-25` | `#F8F4F4` 🟡 | `oklch(0.97 0.005 9.63)` 🟡 |
| 50 | `--zen-color-mellow-melon-pink-50` | `#FFD5DD` | `oklch(0.9219 0.069 9.63)` |
| 100 | `--zen-color-mellow-melon-pink-100` | `#FFB9C4` | `oklch(0.8657 0.092 9.63)` |
| 200 | `--zen-color-mellow-melon-pink-200` | `#FF96AA` | `oklch(0.7918 0.1379 9.63)` |
| 300 | `--zen-color-mellow-melon-pink-300` | `#FC7993` | `oklch(0.7349 0.1609 9.63)` |
| 400 | `--zen-color-mellow-melon-pink-400` | `#F3557B` | `oklch(0.6706 0.1953 9.63)` |
| **500** | **`--zen-color-mellow-melon-pink-500`** | **`#E91E64`** | **`oklch(0.6062 0.2298 9.63)`** |
| 600 | `--zen-color-mellow-melon-pink-600` | `#E00058` | `oklch(0.5698 0.2413 9.63)` |
| 700 | `--zen-color-mellow-melon-pink-700` | `#C4004C` | `oklch(0.5153 0.2183 9.63)` |
| 800 | `--zen-color-mellow-melon-pink-800` | `#9A083E` | `oklch(0.4425 0.1724 9.63)` |
| 900 | `--zen-color-mellow-melon-pink-900` | `#771A34` | `oklch(0.3819 0.1264 9.63)` |

#### Zima Blue
OKLCH 500 base: `oklch(0.7602 0.1358 220.59)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-zima-blue-25` | `#F2F6F7` 🟡 | `oklch(0.97 0.005 220.59)` 🟡 |
| 50 | `--zen-color-zima-blue-50` | `#D2F6FF` | `oklch(0.9481 0.0407 220.59)` |
| 100 | `--zen-color-zima-blue-100` | `#BBEBFC` | `oklch(0.9095 0.0543 220.59)` |
| 200 | `--zen-color-zima-blue-200` | `#99E3FC` | `oklch(0.8451 0.0815 220.59)` |
| 300 | `--zen-color-zima-blue-300` | `#7FD8F5` | `oklch(0.7941 0.0951 220.59)` |
| 400 | `--zen-color-zima-blue-400` | `#58CFF1` | `oklch(0.7471 0.1155 220.59)` |
| **500** | **`--zen-color-zima-blue-500`** | **`#1BC4ED`** | **`oklch(0.7602 0.1358 220.59)`** |
| 600 | `--zen-color-zima-blue-600` | `#00B6E1` | `oklch(0.7146 0.1426 220.59)` |
| 700 | `--zen-color-zima-blue-700` | `#009FC5` | `oklch(0.6462 0.1290 220.59)` |
| 800 | `--zen-color-zima-blue-800` | `#00809D` | `oklch(0.5550 0.1019 220.59)` |
| 900 | `--zen-color-zima-blue-900` | `#21677B` | `oklch(0.4789 0.0747 220.59)` |

#### Singapore Orchid Purple
OKLCH 500 base: `oklch(0.5473 0.2685 302.74)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-singapore-orchid-purple-25` | `#F6F4F8` 🟡 | `oklch(0.97 0.005 302.74)` 🟡 |
| 50 | `--zen-color-singapore-orchid-purple-50` | `#EED7FF` | `oklch(0.9206 0.0806 302.74)` |
| 100 | `--zen-color-singapore-orchid-purple-100` | `#D9BBFF` | `oklch(0.8606 0.1074 302.74)` |
| 200 | `--zen-color-singapore-orchid-purple-200` | `#C898FF` | `oklch(0.7739 0.1611 302.74)` |
| 300 | `--zen-color-singapore-orchid-purple-300` | `#B47BFC` | `oklch(0.7072 0.188 302.74)` |
| 400 | `--zen-color-singapore-orchid-purple-400` | `#A456F4` | `oklch(0.6273 0.2282 302.74)` |
| **500** | **`--zen-color-singapore-orchid-purple-500`** | **`#9321ED`** | **`oklch(0.5473 0.2685 302.74)`** |
| 600 | `--zen-color-singapore-orchid-purple-600` | `#8B00E8` | `oklch(0.5145 0.2819 302.74)` |
| 700 | `--zen-color-singapore-orchid-purple-700` | `#7900CB` | `oklch(0.4652 0.2551 302.74)` |
| 800 | `--zen-color-singapore-orchid-purple-800` | `#5F0C9E` | `oklch(0.3995 0.2014 302.74)` |
| 900 | `--zen-color-singapore-orchid-purple-900` | `#4A1A76` | `oklch(0.3448 0.1477 302.74)` |

#### Dropped Brick Red
OKLCH 500 base: `oklch(0.5292 0.1745 37.67)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-dropped-brick-red-25` | `#F8F4F3` 🟡 | `oklch(0.97 0.005 37.67)` 🟡 |
| 50 | `--zen-color-dropped-brick-red-50` | `#FFD7CA` | `oklch(0.9178 0.0524 37.67)` |
| 100 | `--zen-color-dropped-brick-red-100` | `#F3BBA9` | `oklch(0.8617 0.0698 37.67)` |
| 200 | `--zen-color-dropped-brick-red-200` | `#EB9980` | `oklch(0.7877 0.1047 37.67)` |
| 300 | `--zen-color-dropped-brick-red-300` | `#DA7C61` | `oklch(0.7296 0.1222 37.67)` |
| 400 | `--zen-color-dropped-brick-red-400` | `#CB5D3B` | `oklch(0.6450 0.1483 37.67)` |
| **500** | **`--zen-color-dropped-brick-red-500`** | **`#BA3800`** | **`oklch(0.5292 0.1745 37.67)`** |
| 600 | `--zen-color-dropped-brick-red-600` | `#B22700` | `oklch(0.4974 0.1832 37.67)` |
| 700 | `--zen-color-dropped-brick-red-700` | `#9C2000` | `oklch(0.4498 0.1658 37.67)` |
| 800 | `--zen-color-dropped-brick-red-800` | `#7B2000` | `oklch(0.3863 0.1309 37.67)` |
| 900 | `--zen-color-dropped-brick-red-900` | `#5D1F0B` | `oklch(0.3334 0.0960 37.67)` |

#### Viva Gold Orange
OKLCH 500 base: `oklch(0.7828 0.0942 70.44)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-viva-gold-orange-25` | `#F7F5F1` 🟡 | `oklch(0.97 0.005 70.44)` 🟡 |
| 50 | `--zen-color-viva-gold-orange-50` | `#FEEDDC` | `oklch(0.9456 0.0283 70.44)` |
| 100 | `--zen-color-viva-gold-orange-100` | `#F5E1CA` | `oklch(0.9068 0.0377 70.44)` |
| 200 | `--zen-color-viva-gold-orange-200` | `#F2D4B2` | `oklch(0.8564 0.0565 70.44)` |
| 300 | `--zen-color-viva-gold-orange-300` | `#EBC8A0` | `oklch(0.8061 0.066 70.44)` |
| 400 | `--zen-color-viva-gold-orange-400` | `#E5BB8B` | `oklch(0.7564 0.0801 70.44)` |
| **500** | **`--zen-color-viva-gold-orange-500`** | **`#E0AE74`** | **`oklch(0.7828 0.0942 70.44)`** |
| 600 | `--zen-color-viva-gold-orange-600` | `#D29F62` | `oklch(0.7358 0.0989 70.44)` |
| 700 | `--zen-color-viva-gold-orange-700` | `#B78A55` | `oklch(0.6654 0.0895 70.44)` |
| 800 | `--zen-color-viva-gold-orange-800` | `#937148` | `oklch(0.5715 0.0707 70.44)` |
| 900 | `--zen-color-viva-gold-orange-900` | `#755D40` | `oklch(0.4932 0.0518 70.44)` |

#### Shutters Green
OKLCH 500 base: `oklch(0.5349 0.0308 118.85)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-shutters-green-25` | `#F5F6F2` 🟡 | `oklch(0.97 0.005 118.85)` 🟡 |
| 50 | `--zen-color-shutters-green-50` | `#E2E4DD` | `oklch(0.9132 0.0092 118.85)` |
| 100 | `--zen-color-shutters-green-100` | `#C9CBC2` | `oklch(0.8665 0.0123 118.85)` |
| 200 | `--zen-color-shutters-green-200` | `#B0B4A7` | `oklch(0.7898 0.0185 118.85)` |
| 300 | `--zen-color-shutters-green-300` | `#989D8E` | `oklch(0.7298 0.0216 118.85)` |
| 400 | `--zen-color-shutters-green-400` | `#818674` | `oklch(0.6531 0.0262 118.85)` |
| **500** | **`--zen-color-shutters-green-500`** | **`#6B705C`** | **`oklch(0.5349 0.0308 118.85)`** |
| 600 | `--zen-color-shutters-green-600` | `#626752` | `oklch(0.5028 0.0323 118.85)` |
| 700 | `--zen-color-shutters-green-700` | `#555947` | `oklch(0.4547 0.0293 118.85)` |
| 800 | `--zen-color-shutters-green-800` | `#43473A` | `oklch(0.3905 0.0231 118.85)` |
| 900 | `--zen-color-shutters-green-900` | `#37392F` | `oklch(0.337 0.0169 118.85)` |

#### Frosted Glass Green
OKLCH 500 base: `oklch(0.5035 0.0743 171.63)`

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-frosted-glass-green-25` | `#F2F6F5` 🟡 | `oklch(0.97 0.005 171.63)` 🟡 |
| 50 | `--zen-color-frosted-glass-green-50` | `#D3E7E0` | `oklch(0.9106 0.0223 171.63)` |
| 100 | `--zen-color-frosted-glass-green-100` | `#B4CEC5` | `oklch(0.8558 0.0297 171.63)` |
| 200 | `--zen-color-frosted-glass-green-200` | `#91B7A9` | `oklch(0.7768 0.0446 171.63)` |
| 300 | `--zen-color-frosted-glass-green-300` | `#749F90` | `oklch(0.7121 0.052 171.63)` |
| 400 | `--zen-color-frosted-glass-green-400` | `#538877` | `oklch(0.6268 0.0631 171.63)` |
| **500** | **`--zen-color-frosted-glass-green-500`** | **`#30725F`** | **`oklch(0.5035 0.0743 171.63)`** |
| 600 | `--zen-color-frosted-glass-green-600` | `#216B57` | `oklch(0.4733 0.078 171.63)` |
| 700 | `--zen-color-frosted-glass-green-700` | `#1C5C4B` | `oklch(0.428 0.0706 171.63)` |
| 800 | `--zen-color-frosted-glass-green-800` | `#1A493B` | `oklch(0.3676 0.0557 171.63)` |
| 900 | `--zen-color-frosted-glass-green-900` | `#1B3930` | `oklch(0.3172 0.0408 171.63)` |

#### Cool Grey
OKLCH 500 base: `oklch(0.5121 0.0235 285.54)` — 🟢 Shipped

| Shade | Token | Hex (Figma) | OKLCH (Eng) |
|-------|-------|------------|-------------|
| 25 | `--zen-color-cool-grey-25` | `#F5F5F8` 🟡 | `oklch(0.97 0.005 285.54)` 🟡 |
| 50 | `--zen-color-cool-grey-50` | `#e1e1e6` | `oklch(0.9103 0.0070 285.54)` |
| 100 | `--zen-color-cool-grey-100` | `#c7c7ce` | `oklch(0.8307 0.0094 285.54)` |
| 200 | `--zen-color-cool-grey-200` | `#adadb7` | `oklch(0.7510 0.0141 285.54)` |
| 300 | `--zen-color-cool-grey-300` | `#9494a0` | `oklch(0.6714 0.0164 285.54)` |
| 400 | `--zen-color-cool-grey-400` | `#7c7c8a` | `oklch(0.5917 0.0200 285.54)` |
| **500** | **`--zen-color-cool-grey-500`** | **`#656574`** | **`oklch(0.5121 0.0235 285.54)`** |
| 600 | `--zen-color-cool-grey-600` | `#5c5c6c` | `oklch(0.4814 0.0247 285.54)` |
| 700 | `--zen-color-cool-grey-700` | `#50505d` | `oklch(0.4353 0.0223 285.54)` |
| 800 | `--zen-color-cool-grey-800` | `#40404a` | `oklch(0.3738 0.0176 285.54)` |
| 900 | `--zen-color-cool-grey-900` | `#33333a` | `oklch(0.3226 0.0129 285.54)` |

---

## 2. Tokens

All tokens are implemented as CSS custom properties under the `--zen-` namespace and as Figma variables in the Zen Colors library.

**Token status key**

| Status | Meaning |
|--------|---------|
| 🟢 Shipped | Live in engineering and Figma. Safe to use in production. |
| 🔵 In Review | Discussed with eng; defined in Figma; pending implementation in code. |
| 🟡 Proposed | Design has spec'd this; not yet discussed with eng. |

---

### 2.1 Global Color

| Token | Resolves To | Status |
|-------|------------|--------|
| `--zen-color-primary` | `--zen-color-royal-blue` | 🟡 Proposed |
| `--zen-color-success` | `--zen-color-green` | 🟢 Shipped |
| `--zen-color-warning` | `--zen-color-orange` | 🟢 Shipped |
| `--zen-color-error` | `--zen-color-red` | 🟢 Shipped |
| `--zen-color-neutral` | `--zen-color-cool-grey` | 🟡 Proposed |

### 2.2 Typography

#### Text Color Tokens

| Token | Resolves To | Usage | Status |
|-------|------------|-------|--------|
| `--zen-color-text-default` | `--zen-color-black` | Titles, labels, body text | 🟡 Proposed *(rename from `text-primary` — eng update required)* |
| `--zen-color-text-secondary` | `--zen-color-neutral-800` | Hints, subtext | 🟢 Shipped |
| `--zen-color-text-tertiary` | `--zen-color-neutral-700` | Subtitles, alternate texts | 🟢 Shipped |
| `--zen-color-text-placeholder` | `--zen-color-neutral-600` | Input placeholders | 🟢 Shipped |
| `--zen-color-text-placeholder-subtle` | `--zen-color-neutral-400` | Secondary placeholders (e.g. search fields) | 🟢 Shipped |
| `--zen-color-text-disabled` | `--zen-color-neutral-500` | Disabled inputs, buttons, form elements | 🟢 Shipped |
| `--zen-color-text-primary` | `--zen-color-primary-500` | Interactive text | 🟡 Proposed *(named `primary` to align with primary color convention)* |
| `--zen-color-text-error` | `--zen-color-error-600` | Error messages | 🟢 Shipped |
| `--zen-color-text-warning` | `--zen-color-warning-600` | Warning messages | 🟢 Shipped |
| `--zen-color-text-success` | `--zen-color-success-600` | Success messages | 🟢 Shipped |
| `--zen-color-text-reverse` | `--zen-color-white` | Text on dark or primary-colored backgrounds | 🟡 Proposed |

#### Font Family

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-font-family-text` | `Roboto` | Default — headings and body | 🟢 Shipped |
| `--zen-font-family-mono` | `"Roboto Mono"` | Code and data | 🟢 Shipped |

#### Font Weight

| Token | Value | Status |
|-------|-------|--------|
| `--zen-font-weight-regular` | `400` | 🟢 Shipped |
| `--zen-font-weight-medium` | `500` | 🟢 Shipped |
| `--zen-font-weight-semibold` | `600` | 🟢 Shipped |
| `--zen-font-weight-bold` | `700` | 🟢 Shipped |

#### Font Size

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-font-size-xs` | `0.6875rem` (11px) *(update from 10px)* | Hint | 🟡 Proposed |
| `--zen-font-size-sm` | `0.75rem` (12px) | Body, section subtitle | 🟢 Shipped |
| `--zen-font-size-md` | `0.875rem` (14px) | Page subtitle, card header (small) | 🟢 Shipped |
| `--zen-font-size-lg` | `1rem` (16px) | Section title, card header (default) | 🟢 Shipped |
| `--zen-font-size-xl` | `1.125rem` (18px) | — | 🟢 Shipped |
| `--zen-font-size-2xl` | `1.25rem` (20px) | — | 🟢 Shipped |
| `--zen-font-size-3xl` | `1.5rem` (24px) | Page title | 🟢 Shipped |
| `--zen-font-size-4xl` | `1.875rem` (30px) | — | 🟢 Shipped |

#### Letter Spacing

> **⚠️ Token name correction:** Previously named `--zen-font-lettingspacing-*` (typo). Correct name is `--zen-font-letterspacing-*`. Engineering must update in codebase.

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-font-letterspacing-normal` | `0px` | Font sizes larger than 16px | 🔵 In Review |
| `--zen-font-letterspacing-wide-1` | `0.1px` | Font size 16px | 🔵 In Review |
| `--zen-font-letterspacing-wide-2` | `0.2px` | Font size 14px | 🔵 In Review |
| `--zen-font-letterspacing-wide-3` | `0.3px` | Font size 12px | 🔵 In Review |
| `--zen-font-letterspacing-wide-4` | `0.4px` | Font size 11px and smaller | 🔵 In Review |

#### Line Height

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-font-lineheight-xs` | `14px / 0.875rem` | Font size 11px or smaller | 🔵 In Review |
| `--zen-font-lineheight-sm` | `16px / 1rem` | Font size 12px | 🔵 In Review |
| `--zen-font-lineheight-md` | `20px / 1.25rem` | Font size 14px | 🔵 In Review |
| `--zen-font-lineheight-lg` | `24px / 1.5rem` | Font size 16px | 🔵 In Review |
| `--zen-font-lineheight-xl` | `26px / 1.625rem` | Font size 18px | 🔵 In Review |
| `--zen-font-lineheight-2xl` | `32px / 2rem` | Font size 24px | 🔵 In Review |

#### Text Style Tokens (Composite)

These are semantic aliases that combine weight + size + letter spacing + line height into a single named style.

| Token | Weight | Size | Letter Spacing | Line Height | Usage | Status |
|-------|--------|------|---------------|-------------|-------|--------|
| `--zen-text-heading-display` | semibold | 3xl | letterspacing-normal | 2xl | Primary header, display font | 🔵 In Review |
| `--zen-text-heading-prominent` | semibold | xl | letterspacing-normal | xl | Secondary header, default page header | 🔵 In Review |
| `--zen-text-heading-standard` | semibold | lg | letterspacing-wide-1 | lg | Tertiary header, section header | 🔵 In Review |
| `--zen-text-heading-subtle` | semibold | md | letterspacing-wide-2 | md | Subsection header | 🔵 In Review |
| `--zen-text-heading-micro` | semibold | sm | letterspacing-wide-3 | sm | Low-emphasis header | 🔵 In Review |
| `--zen-text-body-prominent` | regular | lg | letterspacing-wide-1 | lg | Intro, highlighted paragraph | 🔵 In Review |
| `--zen-text-body-standard` | regular | md | letterspacing-wide-2 | md | Main content | 🔵 In Review |
| `--zen-text-body-subtle` | regular | sm | letterspacing-wide-3 | sm | Secondary content | 🔵 In Review |
| `--zen-text-body-micro` | regular | xs | letterspacing-wide-4 | xs | Footnotes, microcopy | 🔵 In Review |
| `--zen-text-label-standard` | medium | md | letterspacing-wide-2 | md | Default button, form label | 🔵 In Review |
| `--zen-text-label-subtle` | medium | sm | letterspacing-wide-3 | sm | Less prominent actions, secondary info label | 🔵 In Review |
| `--zen-text-label-micro` | medium | xs | letterspacing-wide-4 | xs | Microcopy | 🔵 In Review |

### 2.3 Borders

#### Radius

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-border-radius-2xs` | `2px` | | 🟢 Shipped |
| `--zen-border-radius-xs` | `4px` | | 🟢 Shipped |
| `--zen-border-radius-sm` | `6px` | **Default** | 🟢 Shipped |
| `--zen-border-radius-md` | `8px` | | 🟢 Shipped |
| `--zen-border-radius-lg` | `10px` | | 🟢 Shipped |
| `--zen-border-radius-xl` | `12px` | | 🟢 Shipped |
| `--zen-border-radius-full` | `9999px` | Buttons, avatars | 🟢 Shipped |

#### Width

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-border-width-md` | `1px` | Default | 🟢 Shipped |
| `--zen-border-width-lg` | `2px` | Focus rings, emphasis | 🟢 Shipped |

#### Style (Composite)

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-border-default` | `1px solid --zen-color-neutral-100` | Default border for containers | 🟢 Shipped |
| `--zen-border-subtle` | `1px solid --zen-color-neutral-50` | Separators | 🟢 Shipped |
| `--zen-border-disabled` | `1px solid --zen-color-neutral-100` | Disabled state of components | 🟢 Shipped |
| `--zen-border-primary` | `1px solid --zen-color-primary-500` | Interactive elements | 🟡 Proposed |
| `--zen-border-selected` | `2px solid --zen-color-primary-500` | Selected state of components | 🟡 Proposed |
| `--zen-border-error` | `1px solid --zen-color-error-600` | Error state inputs | 🟡 Proposed |
| `--zen-border-warning` | `1px solid --zen-color-warning-600` | Warning state | 🟡 Proposed |
| `--zen-border-success` | `1px solid --zen-color-success-600` | Success state | 🟡 Proposed |
| `--zen-border-info` | `1px solid --zen-color-primary-500` | Info state | 🟡 Proposed |
| `--zen-border-strong` | `1px solid --zen-color-neutral-800` | High emphasis borders | 🟡 Proposed |
| `--zen-border-reverse` | `1px solid --zen-color-white` | Borders on dark or primary-colored backgrounds | 🟡 Proposed |

### 2.4 Breakpoints

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-breakpoint-sm` | `600px` | Phone landscape | 🟢 Shipped |
| `--zen-breakpoint-md` | `840px` | Tablet landscape | 🟢 Shipped |
| `--zen-breakpoint-lg` | `1200px` | Desktop | 🟢 Shipped |
| `--zen-breakpoint-xl` | `1920px` | Larger screens | 🟢 Shipped |

### 2.5 Focus Rings

Outlined focus rings must be applied with an offset on interactive elements. For inputs and textareas, use outline without offset.

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-focus-ring-primary` | `2px solid --zen-color-primary-500` | Buttons, toggles, checkboxes, radios, avatars, breadcrumbs, tags, tabs | 🟢 Shipped |
| `--zen-focus-ring-error` | `2px solid --zen-color-error-600` | Destructive button links, error inputs | 🟢 Shipped |
| `--zen-focus-ring-offset` | `2px` | Used with outlined focus states | 🟢 Shipped |

### 2.6 Elevation

> Elevation must only be used to define layering between elements when required. Use drop shadows only — do not use bevels, borders, or opacity to depict layering.

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-shadow-xs` | `0px 1px 3px 1px #0F, 0px 1px 5px 0px #12` | Dropdowns, elevated button (default), card hover | 🟢 Shipped |
| `--zen-shadow-sm` | `0px 1px 7px 3px #14, 0px 1px 3px 1px #1F` | App header, navigation menu, elevated button hover | 🟢 Shipped |
| `--zen-shadow-md` | `0px 1px 3px 0px #4D, 0px 4px 8px 3px #26` | Notification message, snackbar | 🟢 Shipped |
| `--zen-shadow-lg` | `0px 2px 3px 0px #4D, 0px 6px 10px 4px #26` | — | 🟢 Shipped |
| `--zen-shadow-xl` | `0px 4px 4px 0px #4D, 0px 8px 12px 6px #26` | Dialogs, toasts, overview panel | 🟢 Shipped |

### 2.7 Spacing

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-spacing-3xs` | `0.125rem` (2px) | Tightest spacing, hairline gaps | 🟡 Proposed |
| `--zen-spacing-2xs` | `0.25rem` (4px) | Between elements within a small component | 🟢 Shipped |
| `--zen-spacing-xs` | `0.5rem` (8px) | Default spacing between components | 🟢 Shipped |
| `--zen-spacing-sm` | `0.75rem` (12px) | Padding in a large component | 🟢 Shipped |
| `--zen-spacing-md` | `1rem` (16px) | Padding in a large component; spacing between components | 🟢 Shipped |
| `--zen-spacing-lg` | `1.5rem` (24px) | Spacing between sections | 🟢 Shipped |
| `--zen-spacing-xl` | `2rem` (32px) | Use when a clear separation is needed | 🟢 Shipped |
| `--zen-spacing-2xl` | `3rem` (48px) | Major section breaks, page padding | 🟡 Proposed |
| `--zen-spacing-3xl` | `4rem` (64px) | Hero sections, full-page layout | 🟡 Proposed |

### 2.8 Backgrounds

| Token | Suggested Value | Usage | Status |
|-------|----------------|-------|--------|
| `--zen-color-bg-default` | `--zen-color-white` | Default page background | 🟡 Proposed |
| `--zen-color-bg-subtle` | `--zen-color-neutral-25` | Subtle section backgrounds, sidebars | 🟡 Proposed |
| `--zen-color-bg-muted` | `--zen-color-neutral-50` | Cards, input fills, table rows | 🟡 Proposed |
| `--zen-color-bg-disabled` | `--zen-color-neutral-50` | Disabled state backgrounds | 🟡 Proposed |
| `--zen-color-bg-selected` | `--zen-color-primary-25` | Selected row or item background | 🟡 Proposed |
| `--zen-color-bg-overlay` | `--zen-color-black` at 40% opacity | Modal/dialog backdrop | 🟡 Proposed |
| `--zen-color-bg-primary` | `--zen-color-primary-500` | CTA banners, primary filled areas | 🟡 Proposed |
| `--zen-color-bg-success` | `--zen-color-success-25` | Success alert backgrounds | 🟡 Proposed |
| `--zen-color-bg-warning` | `--zen-color-warning-25` | Warning alert backgrounds | 🟡 Proposed |
| `--zen-color-bg-error` | `--zen-color-error-25` | Error alert backgrounds | 🟡 Proposed |
| `--zen-color-bg-info` | `--zen-color-primary-25` | Info alert backgrounds | 🟡 Proposed |
| `--zen-color-bg-reverse` | `--zen-color-black` | Dark/inverted surface backgrounds | 🟡 Proposed |

### 2.9 Heights and Trigger Areas

#### Component Heights

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-size-height-2xs` | `20px` | Extra compact components | 🟡 Proposed |
| `--zen-size-height-xs` | `24px` | Compact chips, dense table rows | 🟡 Proposed |
| `--zen-size-height-sm` | `32px` | Small buttons, secondary inputs | 🟡 Proposed |
| `--zen-size-height-md` | `40px` | Default button, input, select | 🟡 Proposed |
| `--zen-size-height-lg` | `48px` | Large buttons, prominent inputs | 🟡 Proposed |
| `--zen-size-height-xl` | `56px` | Hero inputs, large touch surfaces | 🟡 Proposed |

#### Trigger Area

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-size-trigger-min` | `24px` | Minimum interactive target area for desktop (WCAG 2.5.5 Level AA) | 🟡 Proposed |
| `--zen-size-trigger-min-mobile` | `44px` | Minimum interactive target area for mobile (WCAG 2.5.5 Level AA) | 🟡 Proposed |

### 2.10 Icons

#### Icon Sizes

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-size-icon-xs` | `12px` | Tight UI contexts, dense tables, badges | 🟡 Proposed |
| `--zen-size-icon-sm` | `16px` | Inline icons, compact components | 🟡 Proposed |
| `--zen-size-icon-md` | `20px` | Default icon size | 🟡 Proposed |
| `--zen-size-icon-lg` | `24px` | Standalone icons, feature icons | 🟡 Proposed |

#### Icon Colors

| Token | Suggested Value | Usage | Status |
|-------|----------------|-------|--------|
| `--zen-color-icon-default` | `--zen-color-black` | Default icon color | 🟡 Proposed |
| `--zen-color-icon-subtle` | `--zen-color-neutral-600` | De-emphasized icons | 🟡 Proposed |
| `--zen-color-icon-disabled` | `--zen-color-neutral-400` | Disabled icon state (no filter — uses explicit color) | 🟡 Proposed |
| `--zen-color-icon-primary` | `--zen-color-primary-500` | Primary action icons | 🟡 Proposed |
| `--zen-color-icon-error` | `--zen-color-error-600` | Error state icons | 🟡 Proposed |
| `--zen-color-icon-success` | `--zen-color-success-600` | Success state icons | 🟡 Proposed |
| `--zen-color-icon-warning` | `--zen-color-warning-600` | Warning state icons | 🟡 Proposed |
| `--zen-color-icon-reverse` | `--zen-color-white` | Icons on dark or primary-colored backgrounds | 🟡 Proposed |

### 2.11 Motion

> **Status:** All motion tokens are 🟡 Proposed. They are defined in Figma and have not yet been implemented in engineering.

Motion tokens cover three dimensions: **duration** (how long), **easing** (how it accelerates), and **delay** (when it starts). All three must be specified together for any animated component.

#### Duration

Duration controls the speed of a transition. Smaller, simpler components move faster; larger, complex surfaces take slightly more time to respect their physical weight.

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-motion-duration-instant` | `100ms` | Micro-feedback: button hovers, checkbox toggles, radio buttons, focus rings | 🟡 Proposed |
| `--zen-motion-duration-fast` | `200ms` | Small scale: tooltip fade-ins, dropdown/select expansions, tag dismissals | 🟡 Proposed |
| `--zen-motion-duration-base` | `300ms` | Structural changes: collapse/accordion expanding, toast notifications sliding in | 🟡 Proposed |
| `--zen-motion-duration-slow` | `400ms` | Large surfaces: modal scaling in, drawer (side panel) sliding in | 🟡 Proposed |

#### Easing

Easing curves give motion a natural, physical feel.

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-motion-ease-entrance` | `ease-out` | Fast start, slow finish. Objects entering the screen (e.g. modals, drawers). Feels responsive but settles smoothly. | 🟡 Proposed |
| `--zen-motion-ease-exit` | `ease-in` | Slow start, fast finish. Objects leaving the screen (e.g. closing a side nav, dismissing a toast). Gets out of the user's way quickly. | 🟡 Proposed |
| `--zen-motion-ease-standard` | `ease-in-out` | Smooth start and finish. Elements moving from point A to B, or expanding internally (e.g. accordions opening, progress bars filling). | 🟡 Proposed |

#### Delay

Delay dictates the pause before the motion duration begins.

| Token | Value | Usage | Status |
|-------|-------|-------|--------|
| `--zen-motion-delay-stagger` | `20ms` | Choreography: applied incrementally to list items, table rows, or search result cards as they enter the screen | 🟡 Proposed |
| `--zen-motion-delay-intent` | `300ms` | Hover protection: standard wait time before revealing a tooltip or complex glossary popover. Prevents accidental visual noise. | 🟡 Proposed |
| `--zen-motion-delay-long` | `500ms` | Feedback holding: used for temporary success states before they auto-dismiss (e.g. a toast lingering before sliding out) | 🟡 Proposed |

---

#### Component Motion Guide

Reference patterns for how motion tokens combine in common components. These define the expected behavior — engineering should implement these exactly.

---

**Drawer (open/close)** {#drawer-open-close}

| Phase | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Open | `duration-slow` | `ease-entrance` | Slides in from the right |
| Close | `duration-base` | `ease-exit` | Slides out to the right |

---

**Accordion (expand/collapse)** {#accordion-expand-collapse}

| Phase | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Expand | `duration-base` | `ease-standard` | Height animates open; content fades in (0→100% opacity) during final 150ms |
| Collapse | `duration-base` | `ease-standard` | Height animates closed; content fades out (100→0% opacity) during initial 100ms |

---

**Success Toast** {#success-toast}

| Phase | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Entry | `duration-base` | `ease-entrance` | Slides in from the bottom |
| Hold | `delay-long` (500ms as token; 4000ms total hold) | — | Settle time after entry completes before auto-dismiss timer begins |
| Exit | `duration-fast` | `ease-exit` | Fades out quickly |

> Note: The `--zen-motion-delay-long` token value is 500ms and represents the *token unit* for the holding pattern. The full 4000ms hold period is a product-level decision, not a motion token.

---

**The "Anchor" Motion — Dropdowns, Popovers, and Tooltips** {#anchor-motion}

| Phase | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Open | `duration-base` | `ease-entrance` | Fades in (0→100% opacity) over full duration; element scales up from its trigger point while fading in |
| Close | `duration-fast` | `ease-standard` | Fades out (100→0% opacity) over full duration; element scales down and retracts back to its trigger point |

**Logic & Accessibility**

- **Intentionality:** Apply `--zen-motion-delay-intent` (300ms) for Tooltip opening on hover to prevent accidental triggers
- **Immediate Focus:** Keyboard focus (Tab) ignores delays and triggers the open motion immediately
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, fade transitions are disabled and elements toggle visibility instantly

---

**Layered Overlays — Modals** {#layered-overlays-modals}

| Phase | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Open | `duration-slow` | `ease-entrance` | Modal scales 95%→100% while background scrim fades in. The slow duration communicates that the user has entered a new, temporary top-level context. |
| Close | `duration-fast` | `ease-exit` | Modal scales 100%→95% and fades 100%→0%. Scrim fades 100%→0%, synchronized. Slower on open to help users track context; dismisses quickly once the decision is made. |

---

**Skeleton Loading** {#skeleton-loading}

| Duration | Easing | Behavior |
|----------|--------|----------|
| `2000ms` (looping) | `linear` | A continuous, subtle gradient shimmer moving left-to-right. Not tokenized — value is fixed. Provides visual confirmation the system is active and reduces perceived wait time for data-heavy views. |

---

**Staggered Entrance — Lists, Table Rows, Search Cards** {#staggered-entrance}

| Per-item duration | Easing | Delay per item |
|------------------|--------|---------------|
| `duration-fast` | `ease-entrance` | `delay-stagger` × item index (item 1: 0ms, item 2: 20ms, item 3: 40ms…) |

The cascading effect guides the eye naturally downward and prevents the screen feeling "flashed" with too much at once.

---

**State Transitions** {#state-transitions}

| State | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Hover | `duration-instant` | `ease-standard` | Subtle background color shift via brightness filter |
| Focus | — | — | No motion tokens — instant high-contrast ring/border for accessibility and speed |
| Pressed | `duration-instant` | `ease-exit` | Subtle scale or brightness darkening |
| → Selected | `duration-fast` | `ease-standard` | Subtle background color shift and side stroke draw-in |
| → Unselected | `duration-instant` | `ease-exit` | Rapid fade and stroke collapse |

---

## 3. Design Guidelines

### 3.1 Color Usage Rules

**Semantic over primitive.** Always use a semantic token (e.g. `--zen-color-text-default`) rather than a raw palette token (e.g. `--zen-color-grey-900`) unless you're building a new token. This ensures theming works correctly.

**Contrast.** Text on backgrounds must meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text). Use the following pairings as reference:

- `text-default` on `bg-default` ✅
- `text-secondary` on `bg-subtle` ✅
- `text-disabled` should never be used on interactive elements that require action

**Semantic color intent.** Color conveys meaning — don't use `success-*` colors for non-success contexts, even if the green looks right.

### 3.2 Typography Rules

#### Typeface

Use `--zen-font-family-text` (Roboto) as the default for all UI text. Use `--zen-font-family-mono` (Roboto Mono) for code snippets, data tables with identifiers, and technical strings. Roobert is the brand typeface only for marketing and communication materials like website, PPTs, and flyers.

#### Language Support

Provide Noto as a font when your product is being consumed by users who read languages with tall or dense scripts.

#### Minimum Size

Must not use type sizes smaller than 11px. You may use 11px text in labels, tags, data visualizations, and supporting text with icon.

#### Line Length

- Text line length is 544px at max with 16px text
- Text line length is 480px at max with 14px text
- Text line length is 424px at max with 12px text

#### Paragraph Spacing

At default, the paragraph spacing is 8px.

#### Accessibility

- Default body text size is 14px
- Minimum body text size is 12px
- 11px is only acceptable for non-essential UI
- Use defined type styles (avoid light weight)
- Maintain readable line height and spacing
- Text line length is 544px at max with 16px text
- Text line length is 480px at max with 14px text
- Text line length is 424px at max with 12px text
- Avoid placeholder-only labels
- Avoid long blocks of dense text

Don't create one-off font sizes. If your design needs a size between tokens, first check whether a token can be used, then raise it as a proposed token addition.

### 3.3 Spacing Rules

Use spacing tokens for all margin, padding, and gap values. The scale is:

- **2xs–xs** for internal element spacing (icon-to-label, checkbox-to-text)
- **sm–md** for internal component padding
- **lg–xl** for spacing between sections and groups
- **2xl–3xl** for page-level layout breathing room

Never use arbitrary pixel values for spacing. If a layout needs something outside the scale, it's a signal to propose a new token.

### 3.4 Elevation Rules

Elevation communicates depth and layer hierarchy — not decoration. Only use drop shadows to convey that an element is above another. Never stack multiple shadows, and don't apply elevation to elements sitting on the same visual plane.

Common layer levels: `xs` → `sm` → `md` → `lg` → `xl` (each level suggests greater visual separation from the base surface).

### 3.5 Brightness Filter Convention — Interactive States

#### Types of States

**Interaction States**

- **Default:** The neutral state of an element before any user interaction.
- **Hover\*:** Triggered when a cursor is placed over an interactive element.
- **Focus\*:** Triggered when an element is highlighted via keyboard, voice, or other input methods.
- **Pressed\*:** The momentary state during a physical click or tap.
- **Dragged:** Active when a user presses and moves an element from its original position.
- **Selected:** A persistent state indicating an element has been chosen (e.g. via checkbox, tab, or radio button).
- **Disabled:** An inoperable state where the element cannot be interacted with or focused.

*\*Hover states should be suppressed on touch devices to avoid "sticky" visual effects. Conversely, Focus and Pressed states must be supported across all input types to ensure accessibility and tactile feedback.*

**Feedback & System States**

- **Loading:** Indicates a component is processing an action or fetching data.
- **Error:** Indicates invalid input or a failed system action, usually via color or icons.
- **Success:** Indicates valid input or a successfully completed action.
- **Warning:** Indicates a non-blocking issue or a state requiring user caution.
- **Read-Only:** Content is legible and focusable for copying, but cannot be edited.
- **Indeterminate:** A "partial" state, typically for parent checkboxes with mixed child selections.

---

#### Implementation

Interactive color states (hover, pressed/active, disabled) are **not handled with tokens**. Engineering implements these using CSS brightness filters at the component level.

| State | Filter | Notes |
|-------|--------|-------|
| Hover | `filter: brightness(0.92)` | Subtle darkening |
| Pressed / Active | `filter: brightness(0.85)` | More pronounced |
| Disabled | `opacity: 0.4` | Combined with `cursor: not-allowed` |

The only tokenized interactive state is **focus** — see `--zen-focus-ring-primary` and `--zen-focus-ring-error` in Section 2.5.

### 3.6 Breakpoints

The majority of Actian users are on desktop. Desktop (lg) is the primary design target. However, pages should be responsive and tested across the full breakpoint range — from xl (large screens) down to sm (phone landscape) — to ensure usability across contexts.

#### Columns, Gutters, and Margins

Layouts are built on a column grid with three key measurements:

1. **Columns** — guide what the content aligns to
2. **Gutters** — fixed spacing between columns
3. **Margins** — negative space beyond the content area

#### Grid Settings

Target XL and until S. XS is not considered at this moment.

| Grid type | Breakpoint | Token | Total columns | Column | Margin | Gutter | Body |
|-----------|-----------|-------|--------------|--------|--------|--------|------|
| XS | Under 600px | — | 4 | Fluid | 16px | 16px | Fluid |
| S | 600px | `--zen-breakpoint-sm` | 8 | Fluid | 16px | 16px | Fluid |
| M | 840px | `--zen-breakpoint-md` | 16 | Fluid | 24px | 16px | Fluid |
| L | 1200px | `--zen-breakpoint-lg` | 16 | Fluid | 24px | 16px | Fluid |
| XL | 1920px | `--zen-breakpoint-xl` | 16 | 85px | 40px | 16px | 1600px |

---



### 3.7 Focus Ring Rules

**Applies to:** Buttons, links, checkboxes, radios, avatars, breadcrumbs, tags, toggles, tabs

Use `--zen-focus-ring-primary` with `--zen-focus-ring-offset` (2px) as an `outline-offset`.

**Applies to:** Inputs, textareas

Use `--zen-focus-ring-primary` as `outline` with no offset. The border of the input itself acts as the boundary.

**Applies to:** Destructive actions and error-state interactive elements

Use `--zen-focus-ring-error` instead of primary.

**Do not** use `box-shadow` to simulate focus rings — it won't work correctly in high-contrast mode.

### 3.8 Border Usage

Use `--zen-border-default` for standard container borders (cards, panels, inputs at rest). Use `--zen-border-subtle` for dividers and separators between rows or sections. Use `--zen-border-disabled` for any input, button, or form element in a disabled state.

### 3.9 Placeholder Text

Two tiers of placeholder exist for inputs: `--zen-color-text-placeholder` is the standard placeholder (grey-600). `--zen-color-text-placeholder-subtle` (grey-400) is used in search fields where less visual weight is appropriate.

---

## 4. Handoff Protocol

### 4.1 Before You Hand Off

Before marking a design ready for engineering:

- All colors reference Zen tokens (no raw hex or one-offs)
- All spacing uses Zen spacing tokens
- All typography uses Zen type tokens
- Component states are fully specified: default, hover, focus, active, disabled, error
- Responsive behavior is documented for each breakpoint

### 4.2 Figma Handoff Checklist

- [ ] Frame is named clearly (component name + variant)
- [ ] All layers are named (no "Rectangle 47")
- [ ] Auto-layout is used for all resizable containers
- [ ] Components use library components, not detached copies
- [ ] Prototype flows are linked where interaction context matters
- [ ] Annotations added for non-obvious behavior (animations, edge cases, empty states)

### 4.3 What to Include in Every Handoff

Provide engineering with:

1. **Link to Figma frame** — not a screenshot
2. **Token references** — call out which tokens drive which properties if non-obvious
3. **State inventory** — list all interactive states explicitly
4. **Edge cases** — what happens with long text, empty data, loading, error?
5. **Accessibility notes** — color contrast, keyboard behavior, screen reader label if custom

### 4.4 When Something Is Missing

If you need a value that doesn't exist as a token:

1. Don't use a raw value in production design
2. Flag it in the design review with the `#design-systems` channel or equivalent
3. Work with engineering to agree on the token before implementation

---

## 5. Related Guidelines

The following topics are intentionally maintained as separate documents. They are kept separate to allow independent versioning and to serve their respective audiences without adding scope to this token and handoff reference.

### 5.1 Accessibility Guidelines

Covers WCAG compliance, color contrast requirements, keyboard navigation, focus management, touch target sizing, screen reader behavior, ARIA usage, and reduced motion requirements.

### 5.2 Content Guidelines

Covers voice and tone, capitalization rules, button and label copy, error message writing, empty state copy, and microcopy patterns.