# Username & Avatar Layout (2026-02-04)

Summarized the edits shipped on February 4, 2026 for the edit-profile tabs so they are easier to review later.

---

## Username tab tweaks

- username input and Save button now live in a 2-column layout so they each occupy 50% of the row and never wrap across viewports; the button spans the full width of its column while staying responsive via the grid setup.
- the “Username” title inherits the yellow neon treatment (matching other section headers) and the color selection row now holds the checkbox beside the swatches, with the checkbox label/text grayed-out for less visual weight.
- reduced the vertical spacing between the color/checkbox row and the tab switcher by tightening the card’s internal gap, eliminating the blank area near the bottom of the card.

## Avatar tab tweaks

- the Avatar Editor heading now matches the neon-yellow styling so it stays consistent with the username section.
- trimmed the bottom spacing inside the card that sat above the tab switcher so the Avatar tab also sits flush, similar to the username tab.

## Workflow notes

- branch `fix/username-row` contains all layout/styling updates (working off the codex/fix/username-row history, because the Xlink-based refs were unwritable), so continue from there for deployments or follow-ups.
- no automated tests were run; please validate visually once the dev server is running.
