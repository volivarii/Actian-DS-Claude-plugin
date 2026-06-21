---
title: "Upload file"
---
# Upload file

Upload components allow users to add files to the platform. They appear in dataset import flows, connection setup, and file attachment contexts.

---

## When to use

- When users need to import data files, certificates, configuration files, or attachments.

## Style

- Drop zone label: use an action phrase plus the accepted file types. For example, "Drag and drop a CSV file, or browse."
- Browse link text: use **Browse** or **Choose file**, not "Click here."
- File type restrictions: list accepted formats explicitly. For example, "Accepts `.csv`, `.json`, and `.xlsx` files."
- File size limit: state the limit in plain language. For example, "Maximum file size: 50 MB."

## Progress and status

- During upload: show filename, progress bar, and percentage.
- On success: show filename with a success indicator. For example, "`data_export.csv` - Uploaded."
- On error: show filename with a specific error. For example, "`data_export.csv` - File exceeds the 50 MB size limit."

## Do / Don't

| Do | Don't |
|---|---|
| Drag and drop a CSV file, or browse. | Click here to upload your file. |
| Accepts .csv, .json, and .xlsx files. | Only certain file types are supported. |
| data.csv - File exceeds the 50 MB size limit. | Upload failed. |