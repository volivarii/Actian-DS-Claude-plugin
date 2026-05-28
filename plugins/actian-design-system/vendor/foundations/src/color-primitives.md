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
