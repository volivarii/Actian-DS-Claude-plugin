## 4. Motion {#motion}

* All motion respects `prefers-reduced-motion: reduce` — fade transitions disabled, elements toggle visibility instantly.

* No content flashes more than 3 times per second (WCAG 2.3.1).

* State changes communicated by more than motion alone.

* Decorative animations are pauseable.

* `--zen-motion-delay-intent` (300ms) used on hover-triggered tooltips. Note: all motion tokens are 🟡 Proposed — document the intent; engineering implements when tokens ship.
