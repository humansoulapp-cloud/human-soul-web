A single field: label, input, hint, error and (for passwords) a show/hide button.

## What the consumer provides
`label`, `optional`, `hint`, `error`, `type` (text, email, password), `name`, `placeholder`, `value`/`defaultValue`, `autoComplete`, `required`, `disabled`, `icon`, `onChange`. `state` only to document hover, focus and disabled.

## Guidance
Prefer `TextField` over composing `Field` + `Input` for ordinary fields. The error replaces the hint and is announced with `role="alert"`. Password fields always include the show/hide toggle. Mark optional fields "(optional)"; required fields carry no asterisk.
