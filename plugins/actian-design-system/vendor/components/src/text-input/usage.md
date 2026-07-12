---
title: "Text input usage guidelines"
---
## When to use

* Use a text input for a single-line freeform value that cannot be constrained to a fixed list: names, emails, hosts, ports (for example **Dataset name**, **Connection host**).

* Use it when the user already knows the value and just needs to type it, rather than pick it from options.

* Specify the input type when the value has a format (email, number, password) so validation and keyboards can assist.

## When not to use

* Don't use a text input when the value comes from a known list: use a [dropdown / select](dropdown-select), or a [combo box](combo-box) when the list is long and typing should narrow it.

* Don't use it to query or filter the content of the page: use [search](search).

* Don't use it for multi-line or formatted content such as data product descriptions: use [rich text](rich-text).

* Don't use it for dates: use the [date input](input-date).

* Don't ask for freeform text when a yes/no answer is enough: use a [checkbox](checkbox) or [toggle](toggle).

## Variant selection

Text inputs have no type or size variants; the choices are between modes.

* **Editable (default):** the normal case; pair with helper text when the field needs persistent instructions.

* **Read-only:** a value the user can see and copy but not change in this context (for example a system-generated connection ID). Never use disabled for this.

* **Disabled:** the field does not apply until another choice is made (for example a port field before a protocol is picked).

* **With placeholder:** only to model a good example value; if the label is sufficient on its own, leave the field empty.

## Do / Don't

| Do | Don't |
| --- | --- |
| Validate on blur, then re-validate as the user fixes the value | Flash an error on every keystroke |
| Match the field width to the expected value length | Stretch a port-number field across the page |
| Use read-only for values users may copy but not edit | Disable a field just to display data |
| Constrain known formats with the right input type | Accept any text into a numeric-only field |

> Placeholder and label wording rules live in the Content guidelines for text inputs.
