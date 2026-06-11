# Text Input — Design

- Reserve space for hints by default using --zen-spacing-2xs (4px) gap between input field and hint text
- Maintains “position: absolute” approach (prevents layout shift in modals and other containers) while avoiding visual instability when hints appear
- Reserve the space consistently across all inputs in forms