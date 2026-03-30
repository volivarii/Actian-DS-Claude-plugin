# Fat Marker CSS Reference

Copy these exact styles into every generated FM HTML. These values are extracted from the Figma FM library and must not be approximated — use these exact hex values, font sizes, paddings, and border-radii.

**No extra colors.** Use only the `--fm-*` variables below. Do not introduce custom colors, gradients, decorative backgrounds, or any color not in this palette. FM outputs are intentionally lo-fi — the palette is deliberately constrained.

## Token Palette

```css
/* -- FM Token Palette (from Figma FM library) -- */
:root {
  --fm-base-900:   #1A202C;
  --fm-base-800:   #2D3648;   /* Primary button fill, nav text */
  --fm-base-700:   #4A5468;
  --fm-base-600:   #717D96;
  --fm-base-500:   #A0ABC0;
  --fm-base-400:   #CBD2E0;   /* Borders, disabled fills */
  --fm-base-300:   #E2E7F0;
  --fm-base-200:   #EDF0F7;   /* Active nav bg, hover, dividers */
  --fm-base-100:   #F5F5FA;
  --fm-base-white: #FFFFFF;
  --fm-brand:      #0550DC;
  --fm-brand-dark: #0029A9;
  --fm-brand-light:#EDF6FF;
  --fm-text-primary:  #101828;
  --fm-text-secondary:#2D3648;
  --fm-text-tertiary: #475467;
  --fm-text-error:    #D92D20;
  --fm-text-light:    #6D6D6D;
  --fm-text-success:  #047800;
  --fm-border:     #CBD2E0;
  --fm-bg-grey:    #F5F5FA;
  --fm-placeholder: #A0ABC0;
  --fm-shadow-default: 0px 2px 8px 0px rgba(0,0,0,0.13);
  --fm-radius:     6px;
}
```

## Component Styles

### FM App Header (WHITE bg, all variants)

```css
.fm-app-header {
  width: 100%; height: 70px;
  background: var(--fm-base-white);
  border-bottom: 2px solid var(--fm-base-400);
  display: flex; align-items: center;
  padding: 16px 28px; gap: 12px;
}
.fm-app-header__logo {
  display: flex; align-items: center; gap: 12px;
  mix-blend-mode: luminosity; flex-shrink: 0;
}
.fm-app-header__logo-icon {
  width: 30px; height: 25px;
  background: var(--fm-base-400); border-radius: 2px;
}
.fm-app-header__brand-text {
  display: flex; flex-direction: column; line-height: 1.2;
}
.fm-app-header__brand-line1 {
  font-size: 11px; font-weight: 400;
  color: var(--fm-base-700); letter-spacing: 0.2px;
}
.fm-app-header__brand-line2 {
  font-size: 13px; font-weight: 700; color: var(--fm-base-900);
}
.fm-app-header__spacer { flex: 1; }
.fm-app-header__icon-btn {
  width: 24px; height: 24px;
  background: var(--fm-base-300); border-radius: 4px;
}
.fm-app-header__avatar {
  width: 36px; height: 36px;
  background: var(--fm-base-400); border-radius: 50%;
}
```

### FM Side Navigation Bar

```css
.fm-sidebar {
  width: 260px; background: var(--fm-base-white);
  padding: 28px 16px 8px 16px;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.fm-sidebar__section {
  display: flex; flex-direction: column; gap: 4px; flex: 1;
}
.fm-sidebar__section--bottom {
  flex: 0; border-top: 1px solid var(--fm-base-200);
  padding-top: 16px; margin-top: auto;
}
.fm-sidebar__item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 8px 12px 16px; border-radius: 8px;
  font-size: 14px; font-weight: 400; color: var(--fm-base-800);
  letter-spacing: -0.14px; line-height: 1.5;
}
.fm-sidebar__item--active {
  background: var(--fm-base-200); font-weight: 600;
}
.fm-sidebar__icon {
  width: 20px; height: 20px;
  border: 1.5px solid var(--fm-base-500); border-radius: 4px;
  flex-shrink: 0;
}
.fm-sidebar__chevron {
  width: 20px; height: 20px; margin-left: auto;
  color: var(--fm-base-500); display: flex;
  align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
```

### FM Button

```css
.fm-button {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px; padding: 12px 16px; border-radius: 6px;
  font-family: 'Inter', sans-serif; font-weight: 600;
  font-size: 16px; line-height: 22px; letter-spacing: -0.32px;
  cursor: pointer; border: none; white-space: nowrap; height: 48px;
}
.fm-button--primary { background: var(--fm-base-800); color: white; }
.fm-button--secondary { background: white; color: var(--fm-base-800); }
.fm-button--outline {
  background: transparent; color: var(--fm-base-800);
  border: 2px solid var(--fm-base-800);
}
.fm-button--text {
  background: transparent; color: var(--fm-brand);
  padding: 10px 4px; border: none; height: auto;
}
.fm-button--disabled { background: var(--fm-base-400); color: white; cursor: not-allowed; }
.fm-button--sm {
  padding: 8px 16px; font-size: 14px;
  letter-spacing: -0.28px; height: auto;
}
```

### FM Page Header

```css
.fm-page-header__title {
  font-weight: 600; font-size: 24px; line-height: 34.32px;
  color: var(--fm-text-primary);
}
.fm-page-header__subtitle {
  font-weight: 400; font-size: 14px; line-height: 22.88px;
  color: var(--fm-text-tertiary); margin-top: 4px;
}
```

### FM Input Label

```css
.fm-input-label { display: flex; gap: 4px; align-items: baseline; }
.fm-input-label__text {
  font-weight: 500; font-size: 14px; line-height: 16px;
  color: #1A202C;
}
.fm-input-label__required {
  font-weight: 700; font-size: 12px; color: #D92D20;
}
```

### FM Text Input

```css
.fm-text-input {
  width: 100%; height: 40px;
  border: 1px solid var(--fm-border); border-radius: 6px;
  padding: 8px 12px; font-family: 'Inter', sans-serif;
  font-size: 14px; letter-spacing: -0.28px; line-height: 22px;
  color: #1A202C; background: white;
}
.fm-text-input::placeholder { color: var(--fm-placeholder); }
```

### FM Alert

```css
.fm-alert {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 12px 16px; height: 48px; border-radius: 6px;
  box-shadow: 0px 2px 8px rgba(0,0,0,0.2);
}
.fm-alert--success { background: #EDF0F7; }
.fm-alert--error { background: #FCF3F3; }
.fm-alert--info { background: #EDF0F7; }
.fm-alert__text { font-size: 16px; line-height: 22px; color: #1A202C; }
```

### FM Tag

```css
.fm-tag {
  display: inline-flex; align-items: center;
  padding: 2px 10px; border-radius: 9999px;
  font-size: 12px; font-weight: 500; line-height: 20px;
}
```

### Generation Card

```css
.gen-card {
  width: 280px; flex-shrink: 0; background: var(--fm-base-800); border-radius: 12px;
  padding: 20px 24px; display: flex; flex-direction: column; gap: 6px;
  align-self: flex-start;
}
.gen-card__label {
  font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700;
  color: var(--fm-base-500); letter-spacing: 1.2px; text-transform: uppercase;
  margin-bottom: 4px;
}
.gen-card__field {
  font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400;
  color: var(--fm-base-300); line-height: 1.5;
}
.gen-card__key {
  font-weight: 600; color: var(--fm-base-500); margin-right: 6px;
}
```

## HTML Structure Templates

### FM App Header

```html
<div class="fm-app-header">
  <div class="fm-app-header__logo">
    <div class="fm-app-header__logo-icon"></div>
    <div class="fm-app-header__brand-text">
      <span class="fm-app-header__brand-line1">Actian Data Intelligence</span>
      <span class="fm-app-header__brand-line2">Studio</span>
      <!-- Use "Administration" for Admin, "Explorer" for Explorer -->
    </div>
  </div>
  <div class="fm-app-header__spacer"></div>
  <div class="fm-app-header__icon-btn"></div>
  <div class="fm-app-header__icon-btn"></div>
  <div class="fm-app-header__avatar"></div>
</div>
```

### FM Sidebar

```html
<div class="fm-sidebar">
  <div class="fm-sidebar__section">
    <div class="fm-sidebar__item fm-sidebar__item--active">
      <div class="fm-sidebar__icon"></div>
      <span>Active Item</span>
      <div class="fm-sidebar__chevron">></div>
    </div>
    <div class="fm-sidebar__item">
      <div class="fm-sidebar__icon"></div>
      <span>Nav Item</span>
      <div class="fm-sidebar__chevron">></div>
    </div>
  </div>
  <div class="fm-sidebar__section fm-sidebar__section--bottom">
    <div class="fm-sidebar__item">
      <div class="fm-sidebar__icon"></div>
      <span>Settings</span>
      <div class="fm-sidebar__chevron">></div>
    </div>
  </div>
</div>
```
