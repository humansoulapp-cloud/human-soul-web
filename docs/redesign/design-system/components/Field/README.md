Wraps a control with a label, hint and error message.

## What the consumer provides
`label`, `optional`, `hint`, `error`, `required`, and a single control child (Input, Textarea or Select).

## Guidance
Every field has a visible label. The error replaces the hint, says how to fix it and is announced with `role="alert"`. Optional fields are marked "(optional)"; required fields carry no asterisk.
