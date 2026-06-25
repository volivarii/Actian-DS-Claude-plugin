## 5. Focus & Keyboard {#focus-keyboard}

Focus is the only interactive state handled by a token. Hover, pressed, and disabled use CSS brightness filters — see the Design Foundation.

**Focus ring rules**

* `--zen-focus-ring-primary` (2px solid Royal Blue) + `--zen-focus-ring-offset` (2px) for buttons, links, checkboxes, radios, toggles, tabs, avatars, tags.

* `--zen-focus-ring-error` (2px solid `error-600`) for destructive actions and error-state inputs. Error-600 is intentional — stronger contrast than 500.

* For inputs and textareas: focus ring with no offset — the input border acts as the boundary.

* Focus must never be hidden by sticky headers or overlays (WCAG 2.4.11).

* `:focus-visible` must always be styled — never use `outline: none` without a replacement.

**Keyboard rules**

* All interactive elements reachable by Tab.

* All actions must have a keyboard alternative — annotate when non-obvious.

* Modals trap focus while open; return focus to trigger on close.

* Dropdowns and menus close on Escape.

* No keyboard traps.

**Key bindings by component**

| Component       | Keys                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| Button          | Tab to focus · Enter or Space to activate                                |
| Link            | Tab to focus · Enter to activate                                         |
| Dropdown/Select | Tab to focus · Space/Enter to open · Arrow to navigate · Escape to close |
| Modal           | Tab cycles within modal (focus trap) · Escape to close                   |
| Tabs            | Tab to tab list · Arrow Left/Right to switch tabs                        |
| Menu            | Enter/Space to open · Arrow to navigate · Escape to close                |
| Data table      | Tab between interactive cells · Arrow for cell navigation                |
