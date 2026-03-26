# Meta Kit Variable Keys

DS2026 Figma variables for use with `figma.variables.importVariableByKeyAsync(key)`.
Bind to generated scaffolding frames via `setBoundVariableForPaint()`.

All variables from **Actian Design System v1.1.0** library, extracted on 2026-03-26.
5 collections, 115 variables total.

## Usage pattern

```js
// Import variables at the start of each use_figma call
const vars = {};
async function importVar(name, key) {
  vars[name] = await figma.variables.importVariableByKeyAsync(key);
}
await importVar('bgDefault', '805afec875092b89deebe685e17992963d603974');
await importVar('bgGrey2', '2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31');
await importVar('borderDefault', '290c868621027b488cbc3b262619959bec52765f');
// ... import all needed variables

// Bind a fill to a Figma variable
function bindFill(node, variable) {
  const fills = JSON.parse(JSON.stringify(node.fills));
  fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
  node.fills = fills;
}

// Bind a stroke to a Figma variable
function bindStroke(node, variable) {
  const strokes = JSON.parse(JSON.stringify(node.strokes));
  strokes[0] = figma.variables.setBoundVariableForPaint(strokes[0], 'color', variable);
  node.strokes = strokes;
}
```

## Color Variables (86)

| Variable | Key | Actian | Studio | Explorer |
|----------|-----|--------|--------|----------|
| Annotation/annotation | `f7ad3100ff05e64ccaead66803680ff5981ae474` | #D71D6D | #D71D6D | #D71D6D |
| Background (bg)/default | `805afec875092b89deebe685e17992963d603974` | #FFFFFF | #FFFFFF | #FFFFFF |
| Background (bg)/disabled | `3f3f05ce2b1febb9e2d3f26652d01aa1461f9f46` | #F5F5FA | #EBEBEB | #EBEBEB |
| Background (bg)/grey 1 | `62257cce2f8b13cca0c39739e79569c69f22b028` | #FBFBFF | #FCFCFC | #FCFCFC |
| Background (bg)/grey 2 | `2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31` | #F5F5FA | #EBEBEB | #EBEBEB |
| Background (bg)/reverse | `3d35091ed8a67f9cf4dc1e55e32a4bac7ac07a79` | #12131F | #505050 | #505050 |
| Border/default | `290c868621027b488cbc3b262619959bec52765f` | #F5F5FA | #EBEBEB | #EBEBEB |
| Border/disabled | `3270053531cee00b04fbff56b588466eeae73f13` | #9898A7 | #A9A9A9 | #A9A9A9 |
| Brand/primary | `a256595115f6048a1e1c843e3099a79a5c259288` | #0550DC | #0283BE | #049B98 |
| Brand/secondary | `5f7c971b8a2b554781a19b14afab8f912727fde4` | #EDF6FF | #ECFFFF | #ECFFFF |
| Category/1-low | `d47bcb154facaf734f3881f7cfaecbea0ffffa59` | #DDE6EC | #DDE6EC | #DDE6EC |
| Category/1-lower | `a45b7c64a878ea9b55ee3d4ee7849789b1e1ad79` | #F7FDFF | #F7FDFF | #F7FDFF |
| Category/1-strong | `a6da1a364e8613bd146667f77efa03ee7ea39305` | #4A6470 | #4A6470 | #4A6470 |
| Category/1-stronger | `b8ceb41653bd2964352b0a77e5b1b6021f7806a7` | #3C515A | #3C515A | #3C515A |
| Category/2-low | `e275b869b7768f86f651457258d34e592ada71da` | #CFEAFD | #CFEAFD | #CFEAFD |
| Category/2-lower | `6ca13b6b587c3932001702849e77a58a3a72f1d4` | #ECFFFF | #ECFFFF | #ECFFFF |
| Category/2-strong | `c2c0376490a69426cedfdcb1ab2a6d531b626fdf` | #00699F | #00699F | #00699F |
| Category/2-stronger | `b55492a8e36ebf065405415280556f7a2ad023cd` | #00547D | #00547D | #00547D |
| Category/3-low | `b98caff09aa9caa95c84d5074a5ee4f008b72b85` | #D0EFED | #D0EFED | #D0EFED |
| Category/3-lower | `74016c01c5eb724a956ac7a27e95fe4a6dc6ee63` | #ECFFFF | #ECFFFF | #ECFFFF |
| Category/3-strong | `9997cab3913a4dfbcb8729e5a11bd21f14f16b86` | #007E7B | #007E7B | #007E7B |
| Category/3-stronger | `db06d2d0d2b6c9301c142faf146b8cd71f82a9cd` | #006563 | #006563 | #006563 |
| Category/4-low | `3aa3c48a03b891f5658c4441752cbdec2c3661df` | #EED7FF | #EED7FF | #EED7FF |
| Category/4-lower | `fbde0edc41e27723007f7da758fd0fd9acaf357a` | #FFF5FF | #FFF5FF | #FFF5FF |
| Category/4-strong | `2b5d7f13d3765cb54d6b7ffdcd36b6ed3543823f` | #7900CB | #7900CB | #7900CB |
| Category/4-stronger | `ce8aa25c0039ee2bce8657f281347e518fd66114` | #5F0C9E | #5F0C9E | #5F0C9E |
| Category/5-low | `30668a015201a557795dd39455eac0b44a242266` | #FFD5DD | #FFD5DD | #FFD5DD |
| Category/5-lower | `54efe8c511336ec321a17158ab5c5cd3e62d4afa` | #FFF1F5 | #FFF1F5 | #FFF1F5 |
| Category/5-strong | `8d43f11cdb9916465065f37576bb8d903706dcfc` | #C4004C | #C4004C | #C4004C |
| Category/5-stronger | `d48bd7194314a5953d0b4675303f4a1a2a3cb5d0` | #9A083E | #9A083E | #9A083E |
| Category/6-low | `64f8e2bae9ac52d6219f9421c3abf2cbb021849a` | #D3EFCD | #D3EFCD | #D3EFCD |
| Category/6-lower | `aaa364c84a670e9731af28398d91fbfee3bdc882` | #F0FFEC | #F0FFEC | #F0FFEC |
| Category/6-strong | `eac2d5774c2afa0239f67512a120dd64d827a33f` | #047800 | #047800 | #047800 |
| Category/6-stronger | `418dbb3aabfd0ea42985f4d34509fcc1061e679e` | #145F04 | #145F04 | #145F04 |
| Category/7-low | `d682b8ade88e0d972ac88038ee984253be0b2701` | #FFDACF | #FFDACF | #FFDACF |
| Category/7-lower | `844690c754dd02e452a2a58151ddc18d5809315d` | #FFF4EC | #FFF4EC | #FFF4EC |
| Category/7-strong | `789f037cbface543eeb059911d98572f43fd7c0d` | #C12C11 | #C12C11 | #C12C11 |
| Category/7-stronger | `dfaf8870a1b25bea6d367f3b0246185481cab961` | #982A18 | #982A18 | #982A18 |
| Category/8-low | `e27f5e6ecbb3641a6f89a8d77ee0d0753a33fa53` | #FFEBCE | #FFEBCE | #FFEBCE |
| Category/8-lower | `98884a1a9cf4bdf1721f5262c74ffc009b82af85` | #FFF9E5 | #FFF9E5 | #FFF9E5 |
| Category/8-strong | `6d2a82ddcd9dabd2ceeb8c5805bb824a6eecaccb` | #A76605 | #D27B00 | #D27B00 |
| Category/8-stronger | `341a5425be35a0ab63fbb5981a777f97520ea2f0` | #A76605 | #A76605 | #A76605 |
| Category/9-low | `dc22d4ebf21364a4b0f36a0b59eae972382ab5e2` | #FEEDDC | #FEEDDC | #FEEDDC |
| Category/9-lower | `4db42e59531e0320d6bf5e10275687ebe278a983` | #FFFBEF | #FFFBEF | #FFFBEF |
| Category/9-strong | `6506a4c6941a8280b4b60fd1049d7bbbbe729ae3` | #B78A55 | #B78A55 | #B78A55 |
| Category/9-stronger | `62449c9611004b8428293683593bea77576a762a` | #937148 | #937148 | #937148 |
| Icon/default | `3dcaaa7ab47eefe274129f94647b3649bde36778` | #000000 | #000000 | #000000 |
| Icon/disabled | `930c476be7cb644ff8c317fe5fc9b2d8a68ad06f` | #9898A7 | #A9A9A9 | #A9A9A9 |
| Icon/primary | `3babe95aab2440a14c4c9abcf5a2dde38e8279c8` | #0550DC | #0283BE | #049B98 |
| Icon/reverse | `b9657ab94410a39cb9b6ab9b9d6ae445b3ceb4de` | #FFFFFF | #FFFFFF | #FFFFFF |
| Icon/secondary | `0dace0dc11a0f6f627c27597c094dcb0ad2c2a15` | #595968 | #7B7B7B | #7B7B7B |
| Interactive/disabled-primary | `226235904cc0141fd82410af0e31b32cd59d1591` | #9898A7 | #A9A9A9 | #A9A9A9 |
| Interactive/disabled-secodary | `817090c8ce118eaa4deb1dbd50be8921a30b47d6` | #F5F5FA | #EBEBEB | #F5F5FA |
| Interactive/dragged-primary | `a29984d56c1a4eb3a436710152658dc3028d27ba` | #0029A9 | #0079B6 | #00908E |
| Interactive/enabled-inverse | `83772749c42b0ab54a4bca609a59310559d9eab3` | #FFFFFF | #FFFFFF | #FFFFFF |
| Interactive/enabled-primary | `e66ce98f5c4aa3f1db4a1b0d41afc7e2cbda3672` | #0550DC | #0283BE | #049B98 |
| Interactive/focused-primary | `9e7ca060b486b0883a93f8f1a96986aa0c806f1e` | #3F3F4A4D | #3F3F4A4D | #3F3F4A4D |
| Interactive/focused-secodary | `d5a7f53a72335f148509cd58cbec3bc168742677` | #E4E4F04D | #E4E4F04D | #E4E4F04D |
| Interactive/focused-stroke-default | `74a90e30c5a6f9c63fef3e6e6ba5398a582df4d0` | #000000 | #000000 | #000000 |
| Interactive/focused-stroke-inverse | `e68757cd12d37d195fa952a1cd167635211ddad8` | #FBFBFF | #FCFCFC | #FCFCFC |
| Interactive/hovered-primary | `f5f798e18d734a538e8c156111da997cc48c056c` | #3F3F4A4D | #3F3F4A4D | #3F3F4A4D |
| Interactive/hovered-secodary | `14b9d4d27ae515bfcae31f516892494c6a8a8d3c` | #E4E4F04D | #E4E4F04D | #E4E4F04D |
| Interactive/pressed-primary | `b724de1bc820a1fc1cb05676cd13a13d26e8a1e5` | #3F3F4A80 | #3F3F4A80 | #3F3F4A80 |
| Interactive/pressed-secodary | `5f910fa533bbd2104680332827f0ede0d87b2b2f` | #E4E4F080 | #E4E4F080 | #E4E4F080 |
| Interactive/selected-primary | `8e29da351e08fc012a853ea6f7bddc143d035afc` | #0029A9 | #0079B6 | #00908E |
| Interactive/selected-secodary | `110d55f885c009b21caa47ae0545373c79a3930a` | #EDF6FF | #ECFFFF | #ECFFFF |
| Overlay/default | `6d65f9865e1f71f5bcc09153035163d9fe94fda0` | #656574B2 | #999999B2 | #999999B2 |
| Status/error-primary | `bc472063267d7d69f837a57c80df56f73d64c577` | #C12C11 | #C12C11 | #C12C11 |
| Status/error-secondary | `8e62179b2ccef0614364551860808ac7eab71e64` | #FFDACF | #FFDACF | #FFDACF |
| Status/inactive-primary | `1bf45199a98ba08a96c8b1c97e2eff6c14c16c0a` | #33333D | #7B7B7B | #7B7B7B |
| Status/inactive-secondary | `2277bbf1e686df7895fecbb46814ea267a48cb3a` | #F5F5FA | #EBEBEB | #EBEBEB |
| Status/info-primary | `676c39f76d7abe409b803ab3db0c7c8aed9fa454` | #00699F | #00699F | #00699F |
| Status/info-secondary | `2680dc77efc74b4b1b58fa50bc31e521cf3952f3` | #CFEAFD | #CFEAFD | #CFEAFD |
| Status/success-primary | `b8c56f1d09375fd2087f84d74c0c5d5af119ed5c` | #047800 | #047800 | #047800 |
| Status/success-secondary | `d4cb1c5b38dd4b09395696724bbdfe6046b156f3` | #D3EFCD | #D3EFCD | #D3EFCD |
| Status/warning-primary | `49099364f52f5b1e69681b3a3abdd271cf1cadce` | #D27B00 | #D27B00 | #D27B00 |
| Status/warning-secondary | `b0fd80a98adb8013219d46d1272ce39b71634913` | #FFEBCE | #FFEBCE | #FFEBCE |
| Text/disabled | `46c4b4f0f65db6a2cf513ef25f32230fae75e562` | #9898A7 | #A9A9A9 | #A9A9A9 |
| Text/error | `ed6e1faaa56109df25c6587e8b9d2b70c80dbb53` | #C12C11 | #C12C11 | #C12C11 |
| Text/placeholder | `e34e7702643edf1bb8f17ad77aafbd8874f89017` | #595968 | #999999 | #999999 |
| Text/primary | `cb3cf6a8b661f3a2ff12835120957f3278d329d0` | #000000 | #000000 | #000000 |
| Text/reverse | `d5b2b08fd5bab41595edb892bf4707cb94bae50a` | #FFFFFF | #FFFFFF | #FFFFFF |
| Text/secondary | `54d9d36f7653380d99e9aadbad21e14f9dcdb295` | #3F3F4A | #8D8D8D | #8D8D8D |
| Text/success | `cdfa8e816f9db4a7edce3065e4de86e5d04b257d` | #047800 | #047800 | #047800 |
| Text/tertiary | `d56575506dae345c45ea1563df6b81ca041c8c4f` | #595968 | #999999 | #999999 |
| Text/warning | `3d65bc80eba197437afc12c196b05fe9501e2c8a` | #D27B00 | #D27B00 | #D27B00 |

## Spacing Variables (6)

| Variable | Key | Value | Scopes |
|----------|-----|-------|--------|
| Spacing/2xs | `5a7e452ee094abaac62002b0b0e3dd02776e0330` | 4 | GAP |
| Spacing/xs | `9c98ee0ee8b9464165738d761e12dbdba0f60a09` | 8 | GAP |
| Spacing/sm | `e02968bd3fca3e90211bbfaea4f00abc573c842e` | 12 | GAP |
| Spacing/md | `0ed0efbb23a84581762b07154031014525c51a2a` | 16 | GAP |
| Spacing/lg | `ac5c5c8d7ba29924dcbdc4734dd5b8d91767d007` | 24 | GAP |
| Spacing/xl | `25f333ee5dde5e89b28afa9cb249018b760089fa` | 32 | GAP |

## Border Variables (12)

| Variable | Key | Value | Scopes |
|----------|-----|-------|--------|
| radius/2xs | `36267b0223009e715411b9c9ca145d28ab68d655` | 2 | CORNER_RADIUS |
| radius/xs | `e86ac4c8021b3e15db45761ae05a0d415e08d737` | 4 | CORNER_RADIUS |
| radius/sm | `66b473a7c0f9cfa531c058c9609b3765b84ffd8f` | 6 | CORNER_RADIUS |
| radius/default | `70601bc06e07e748704235e617b4f7ca9ea8fb81` | 6 (alias → radius/sm) | CORNER_RADIUS |
| radius/md | `e3f39f7ca717955288264ed80bc99027564b31fe` | 8 | CORNER_RADIUS |
| radius/lg | `8e4f8cdd91158975e5fb846243d02d6561a62ea8` | 10 | CORNER_RADIUS |
| radius/xl | `cd2ee903810decb6b2f3339cd028b99584a94e73` | 12 | CORNER_RADIUS |
| radius/full | `96f69added0e5e58d02f4aaef4b05f02d6158cec` | 9999 | CORNER_RADIUS |
| width/default | `91cb850d543fa1caaa9f9ba095a19b1c506baadb` | 1 (alias → width/md) | STROKE_FLOAT |
| width/md | `18f9c436d60cf6e86ba6775b92c300e94b1d266f` | 1 | STROKE_FLOAT |
| width/lg | `404d432989c0659955af4859c04ef7802bd93d5d` | 2 | STROKE_FLOAT |
| width/focus | `6461e7ac1c7ffae2dda9586dc0c89c3d7d0ea524` | 2 (alias → width/lg) | STROKE_FLOAT |

## Size Variables (7)

| Variable | Key | Value | Scopes |
|----------|-----|-------|--------|
| sx | `a3bb28c3ad6cca9243e2246178a246cfa742ba68` | 4 | WIDTH_HEIGHT |
| sm | `ee3ef7cabc07275346ec0e0828dadedafd71c53e` | 8 | WIDTH_HEIGHT |
| md | `27370a3d0443dac20588a321a5dc6fddb8d79d2a` | 16 | WIDTH_HEIGHT |
| lg | `8e8b332993e629e50e11184d297276995d9a53af` | 24 | WIDTH_HEIGHT |
| xl | `5d33f18eea164e63cf9c9307a6e257949b7bae8f` | 32 | WIDTH_HEIGHT |
| 2xl | `c632aed239c9073ab8c91d703402ab0665fbac80` | 40 | WIDTH_HEIGHT |
| 3xl | `4f72317fbd0e7be2bdd367085c4d3c4578307b28` | 44 | WIDTH_HEIGHT |

## Breakpoint Variables (4)

| Variable | Key | Value | Scopes |
|----------|-----|-------|--------|
| sm | `0643748db4edbad386d5442d827591d3b606907c` | 600 | — |
| md | `dac0d3173d307e4e8cfbd3b20d0e160fad776b70` | 840 | — |
| lg | `ab8056c3475bcd0ee63062869e4d7c2dbca8147e` | 1200 | — |
| xl | `10d0543fd8217786cf982aaa9edc216203592f91` | 1920 | — |
