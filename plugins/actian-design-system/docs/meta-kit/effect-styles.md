# Meta Kit — Effect Styles

DS Kit effect styles for binding via `figma.importStyleByKeyAsync(key)`.
Extracted from Actian Design System v1.1.0 on 2026-03-26.

## Usage

```js
const style = await figma.importStyleByKeyAsync("KEY");
frame.effectStyleId = style.id;
```

## Styles

| Style | Key | Summary |
|-------|-----|---------|
| shadow-xs | `e5e6f1d0c3aabfd9ff4aab0978c489771e7efcce` | 2 layers: subtle lift |
| shadow-sm | `3bdec05719c6a80952f2a909b2ee818bf23dc8b6` | 2 layers: light elevation |
| shadow-md | `a2b3143e1394d5cf10c76cd5cfa67ee3a769415e` | 2 layers: medium elevation |
| shadow-lg | `50793d1ceb271d09ec2ae79cb188b8d7c8ea85ba` | 2 layers: high elevation |
| shadow-xl | `ed326603bcb9d1ce54a00ae66352cdbdf9645a93` | 2 layers: maximum elevation |

## Shadow Detail

### shadow-xs

| # | Type | Color | X | Y | Blur | Spread |
|---|------|-------|---|---|------|--------|
| 1 | DROP_SHADOW | rgba(0, 0, 15, 0.06) | 0 | 1 | 3 | 1 |
| 2 | DROP_SHADOW | rgba(0, 0, 18, 0.07) | 0 | 1 | 5 | 0 |

### shadow-sm

| # | Type | Color | X | Y | Blur | Spread |
|---|------|-------|---|---|------|--------|
| 1 | DROP_SHADOW | rgba(0, 0, 20, 0.08) | 0 | 1 | 7 | 3 |
| 2 | DROP_SHADOW | rgba(0, 0, 31, 0.12) | 0 | 1 | 3 | 1 |

### shadow-md

| # | Type | Color | X | Y | Blur | Spread |
|---|------|-------|---|---|------|--------|
| 1 | DROP_SHADOW | rgba(0, 0, 77, 0.30) | 0 | 1 | 3 | 0 |
| 2 | DROP_SHADOW | rgba(0, 0, 38, 0.15) | 0 | 4 | 8 | 3 |

### shadow-lg

| # | Type | Color | X | Y | Blur | Spread |
|---|------|-------|---|---|------|--------|
| 1 | DROP_SHADOW | rgba(0, 0, 38, 0.15) | 0 | 6 | 10 | 4 |
| 2 | DROP_SHADOW | rgba(0, 0, 77, 0.30) | 0 | 2 | 3 | 0 |

### shadow-xl

| # | Type | Color | X | Y | Blur | Spread |
|---|------|-------|---|---|------|--------|
| 1 | DROP_SHADOW | rgba(0, 0, 38, 0.15) | 0 | 8 | 12 | 6 |
| 2 | DROP_SHADOW | rgba(0, 0, 77, 0.30) | 0 | 4 | 4 | 0 |
