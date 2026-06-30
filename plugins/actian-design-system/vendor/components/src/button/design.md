---
title: "Buttons — Design guidelines"
---
## Anatomy

A button is a single container holding an optional leading icon and a text
label. The container is the click target; padding and the icon-to-label gap
are token-driven so every variant shares one geometry.

<Media role="parts" layout="stack" />

> The icon is optional. When present it always leads the label — never trails
> it — so the action verb stays the last thing read.

## Variants

Four variants cover the action hierarchy: primary, secondary, ghost, and
destructive. They differ only in fill, border, and text colour — never in
shape or size.

<Media role="variations" layout="stack" />

## Spacing & size

<Media role="spacing" />

* Three sizes: small (28px), medium (32px), large (40px). Medium is the
  default.

* Horizontal padding is `space-150`; the icon-to-label gap is `space-100`.

* Buttons never set their own margins — spacing belongs to the parent layout.

## Behavior

Buttons expose five interaction states. Hover and focus are always visible;
the loading state replaces the label with a spinner and locks the width so
the layout never shifts.

<Media role="behavior" layout="grid" />

## Layout

<Media role="layout" />

In a button group the primary action sits right-most (LTR). Groups align to
the 4px baseline grid and wrap as a unit, never mid-group.
