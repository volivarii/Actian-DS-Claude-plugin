# Upload file: usage notes

Upload components allow users to add files to the platform. They appear in dataset import flows, connection setup, and file attachment contexts.

## When to use
- When users need to import data files, certificates, configuration files, or attachments.
- Use an upload component whenever the user brings a file into the platform: importing data files into a dataset, adding certificates or configuration files during connection setup, attaching files.
- Use a drop zone with a browse link so both drag-and-drop and file-picker users are served.
- Surface the constraints (accepted formats, size limit) in the drop zone before the user picks a file.

## When not to use
- Don't ask for a file when the value could just be typed (a URL, a path to an existing source): use a text input.
- Don't use it to pick from files already on the platform: use a selection control such as a table with row selection or a combo box.
- Don't ask users to export and re-upload data when a direct connection to the source exists: point them to connection setup instead.

## Style
- Drop zone label: use an action phrase plus the accepted file types. For example, "Drag and drop a CSV file, or browse."
- Browse link text: use **Browse** or **Choose file**, not "Click here."
- File type restrictions: list accepted formats explicitly. For example, "Accepts `.csv`, `.json`, and `.xlsx` files."
- File size limit: state the limit in plain language. For example, "Maximum file size: 50 MB."

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
