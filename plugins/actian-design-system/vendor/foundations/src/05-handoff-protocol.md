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

