# Meta Kit — Component Reference

Auto-generated from `vendor/components/registries/metakit.json` by `scripts/renderers/render-component-reference.js`.
28 components.

---

### Meta / Chrome / Accessibility Card

Container for WCAG requirements with severity badges. Used in component-brief Cards 7-8. Detach instance before appending content to the Content slot.

- Variants: **Mode:** `DS` · `FM`
- Text overrides: `Title#47:2`
- Node: `47:24` | Key: `b4779a13f4097d682413a669eaaf9ead1b49f115`

### Meta / Chrome / Brief Card

Card shell for component spec pages. 4 variants: DS Standard (1200px grey header), DS Page Header (1200px white with logo), FM Standard (820px grey header), FM Page Header (820px dark).

- Variants: **Mode:** `DS` · `FM` | **Type:** `Standard` · `Page Header`
- Text overrides: `Component Name#7:2`, `Description#7:3`, `Source#7:4`
- Node: `7:2` | Key: `3dbb732730af0754210cde7af35e5236a2502843`

### Meta / Chrome / Brief Card Header

Card header for component briefs. Used as first child inside Brief Card shells. Set Title, Subtitle, and Show Subtitle via properties — do not detach.

- Single component (no variants)
- Text overrides: `Title#140:0`, `Subtitle#140:1`
- Boolean properties: `Show Subtitle#140:2` (default: true) — set to `false` to hide
- Node: `140:12` | Key: `057e742610975479a8c9c245e713d9911a49e484`

### Meta / Chrome / Feedback

Annotation component for designer feedback and library gap markers. Designer variant: place next to issues for /refine comments. System variant: auto-placed when plugin improvises around a library gap

- Variants: **Type:** `Designer` · `System`
- Node: `66:20` | Key: `d5cba21bc3dbf36578665bac89834fbe1ca29ed0`

### Meta / Chrome / Flow Cover Card

Dark cover card at the start of each sub-flow. Shows Feature, Flow, and User fields on a dark background.

- Single component (no variants)
- Text overrides: `Feature#46:8`, `Flow#46:9`, `User#46:10`
- Node: `46:344` | Key: `eaebde6bd07d2f19f3f9c00a9587240cb085a90d`

### Meta / Chrome / Flow Screen

Screen frame for wireframe flows. Composes FM App_header + FM Side navigation bar + Content Area. Standard (1440x960) and Compact (1440x700).

- Variants: **Size:** `Standard` · `Compact`
- Node: `21:1198` | Key: `2ca7c756ad54e81219104d3a270ba8eb9eeffcf6`

### Meta / Chrome / Generation Log

Generation metadata card. First element in every AI-generated output. Shows skill name, prompt, timestamp, duration, model, and plugin version.

- Single component (no variants)
- Text overrides: `Skill#3:0`, `Prompt#3:1`, `Date#3:2`, `Duration#3:3`, `Model#3:4`, `Plugin Version#3:5`
- Node: `3:2` | Key: `a9653f30925367e96dea90093d750bfe70849571`

### Meta / Chrome / Theme Card

Theme-branded card with colored accent bar. Used in component-brief for theme comparison views (Actian/Studio/Explorer). Detach to append content.

- Variants: **Theme:** `Actian` · `Studio` · `Explorer`
- Node: `47:43` | Key: `9081a7761dfbe11d576182f3cb1711b9e76c2d36`

### Meta / Content / Code Block

Dark code block for CSS, HTML, ARIA code examples. Used in component-brief Card 9 and presentation code slides. Toggle Show Header for filename/language label.

- Single component (no variants)
- Text overrides: `Header Text#8:1`, `Code#8:2`
- Boolean properties: `Show Header#8:0` (default: true) — set to `false` to hide
- Node: `8:2` | Key: `1bf10eee1751a46da5f90a9671be6c9abf0073b7`

### Meta / Content / Color Swatch

Circular color indicator. Used in component-brief Card 4 (token tables) and Card 8 (contrast tables). Bind fill to a DS2026 variable at runtime.

- Variants: **Size:** `Small` · `Medium` · `Large`
- Node: `42:17` | Key: `da3369932f710386b76ca91a40ebd48d94e3f2e0`

### Meta / Content / Contrast Badge

WCAG contrast result badge (Pass/Exempt/Fail). Used in component-brief Card 8 accessibility contrast table.

- Variants: **Status:** `Pass` · `Exempt` · `Fail`
- Text overrides: `Label#44:3`
- Node: `44:20` | Key: `941756541adc6ce21e32e848c2039c64fece0fcf`

### Meta / Content / Dimension Annotation

Measurement annotation with endcaps and value label. Used in component-brief Card 3 (Anatomy - Specs) for dimension callouts between elements.

- Variants: **Orientation:** `Horizontal` · `Vertical`
- Text overrides: `Value#45:7`
- Node: `45:37` | Key: `49bf6a1b210a403ba145a3fdee9b1994eb54069a`

### Meta / Content / Do-Don't Pair

Side-by-side Do and Don't examples with green/red color bars. Used in component-brief Cards 6-7 and presentation best-practice slides.

- Variants: **Mode:** `DS` · `FM`
- Text overrides: `Do Label#9:8`, `Don't Label#9:9`, `Do Example#9:10`, `Don't Example#9:11`
- Node: `9:24` | Key: `28edfacf13e50706586172bd48f8a3ad84d7c263`

### Meta / Content / Pointer Badge

Dimension callout label with directional line. Used in component-brief Card 3 (Anatomy) for pink dimension annotations.

- Variants: **Direction:** `Left` · `Right` · `Up` · `Down`
- Text overrides: `Label#45:4`
- Node: `45:26` | Key: `7e066fc21d9a2bbbcd1149113787cf59140162d4`

### Meta / Content / Research Frame

Container for research findings in presentations. Shows title, source attribution, and content area.

- Single component (no variants)
- Text overrides: `Title#48:10`, `Source#48:11`
- Node: `48:31` | Key: `e671618f2b4c6ea406a995fdc3012ac54eadfe56`

### Meta / Content / Stat Card

Data callout card with value, trend indicator, and label. Used in presentations for KPI highlights.

- Variants: **Trend:** `Up` · `Down` · `Neutral`
- Text overrides: `Value#46:6`, `Label#46:7`
- Node: `46:29` | Key: `8662c721d74d6f0079f273f76eec374b12ec2fae`

### Meta / Slide / Back Cover

Presentation slide template. Used by generate-presentation skill.

- Single component (no variants)
- Text overrides: `Title#112:10`
- Node: `112:18` | Key: `6df533ae800a6596fd84e93a2e5fc725dbd6a369`

### Meta / Slide / Body Full

Presentation slide template. Used by generate-presentation skill.

- Single component (no variants)
- Text overrides: `Title#112:5`
- Node: `112:15` | Key: `281e7a9bc55abe69bb2364e639f7511b4a005694`

### Meta / Slide / Body Text Visual

Presentation slide template. Used by generate-presentation skill.

- Single component (no variants)
- Text overrides: `Title#112:6`, `Body#112:7`
- Node: `112:16` | Key: `28ea7a37752149d78679847ec7893368a4c4f1a0`

### Meta / Slide / Cover

Presentation slide template. Used by generate-presentation skill.

- Single component (no variants)
- Text overrides: `Topic#112:0`, `Title#112:1`, `Subtitle#112:2`, `Date#112:3`, `Creators#112:4`
- Node: `112:14` | Key: `a12f6f0b26fffc59fdac49df2bc3c36182c912da`

### Meta / Slide / Section

Presentation slide template. Used by generate-presentation skill.

- Single component (no variants)
- Text overrides: `Topic#112:8`, `Title#112:9`
- Node: `112:17` | Key: `348efaa22a6da818c435017399a357b47257bcdc`

### Meta / Template / A11y Spec Row

- Single component (no variants)
- Text overrides: `element#105:0`, `role#105:1`, `label#105:2`, `focus-order#105:3`, `keyboard#105:4`, `announcement#105:5`
- **Required overrides:** `label#105:2` (default `"label"` is a placeholder)
- Node: `96:12` | Key: `92ed7bc88cf229782c4b42238aacba1d15f8fd06`

### Meta / Template / Section Header

Hidden template for section headers with title and subtitle. Skills clone and fill text slots. Do not use directly.

- Single component (no variants)
- Text overrides: `title#86:0`, `subtitle#86:1`
- **Required overrides:** `title#86:0` (default `"Section Title"` is a placeholder)
- Boolean properties: `Show Subtitle#138:0` (default: true) — set to `false` to hide
- Node: `76:12` | Key: `f4fd576001f4f1f4606a4efb051d1e4492e378c4`

### Meta / Template / State Column

Hidden template for state grid columns. Skills clone, fill title, replace content placeholder. Do not use directly.

- Single component (no variants)
- Text overrides: `title#85:0`
- Node: `75:12` | Key: `4f782d1a8541b4474858767209f99dce1428784b`

### Meta / Template / Swatch Row

Hidden template for color swatch rows. Skills clone, fill text slots, bind swatch fill to variable. Do not use directly.

- Single component (no variants)
- Text overrides: `name#87:0`, `value#87:1`, `hex#87:2`
- Node: `77:12` | Key: `96647364b6cb5c55b7ced72106708daaa33afb7f`

### Meta / Template / Table Data Row

Hidden template for table data rows. Skills clone and fill text slots via the template engine. Do not use directly.

- Single component (no variants)
- Text overrides: `label#84:0`, `value#84:1`
- **Required overrides:** `label#84:0` (default `"Label"` is a placeholder)
- Node: `74:12` | Key: `3a1fae22dd85936f81565122888efd8a50e37180`

### Meta / Template / Table Header Row

Hidden template for table header rows. Skills clone and fill text slots via the template engine. Do not use directly.

- Single component (no variants)
- Text overrides: `label#83:0`
- Node: `73:12` | Key: `0754accfc4bc79ce9a68ff8fe7a108f1b41b9b2e`

### Meta / Utility / Card Divider

Horizontal divider line between card sections. Set layoutSizingHorizontal = 'FILL' on instances to fill parent width.

- Single component (no variants)
- Node: `4:2` | Key: `f4d778e1cf9bb61a33712c791486f54bb1c095b7`
