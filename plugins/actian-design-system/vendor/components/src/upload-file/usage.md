---
title: "Upload file usage guidelines"
---
## When to use

* Use an upload component whenever the user brings a file into the platform: importing data files into a dataset, adding certificates or configuration files during connection setup, attaching files.

* Use a drop zone with a browse link so both drag-and-drop and file-picker users are served.

* Surface the constraints (accepted formats, size limit) in the drop zone before the user picks a file.

## When not to use

* Don't ask for a file when the value could just be typed (a URL, a path to an existing source): use a [text input](text-input).

* Don't use it to pick from files already on the platform: use a selection control such as a [table](table) with row selection or a [combo box](combo-box).

* Don't ask users to export and re-upload data when a direct connection to the source exists: point them to connection setup instead.

## Variant selection

Upload components have no type or size variants; the choices are between modes.

* **Drop zone:** the default surface; an action phrase plus the accepted file types, with a browse link.

* **In progress:** filename, progress bar, and percentage while the file transfers.

* **Result rows:** each file resolves to a success indicator or a specific error naming the file and the failure.

## Do / Don't

| Do | Don't |
| --- | --- |
| State accepted formats and the size limit up front | Reveal constraints only in the rejection error |
| Name the file and the exact problem on failure | Report a bare upload failure |
| Show per-file progress during upload | Leave the screen static with no transfer signal |
| Validate type and size on drop, before the transfer | Upload the whole file and reject it afterwards |
| Let the user remove or replace an uploaded file | Force a restart of the flow to retry |

> Drop zone, constraint, and status wording rules live in the Content guidelines for file uploads.
