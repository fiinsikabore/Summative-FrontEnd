# Book Vault

A calm, minimal reading tracking for keeping every book I read in one place. Built with vanilla HTML, CSS and JavaScript for the **Building Responsive UI** summative (Frontend Web Development, ALU).

**Live site (GitHub Pages):** https://fiinsikabore.github.io/Summative-Assignment---Building-Responsive-UI/
**Demo video (unlisted):** ADD-LINK-HERE

---

## What it does

- **Home:** total pages, books, authors, top tag, progress towards a pages goal, and a chart of the last 7 days.
- **Library:** search with a regular expression, sort by date, title or pages, and delete a book.
- **Add:** a form with live validation. Every rule is a regex, and errors appear next to the field.
- **Settings:** set the pages goal, export the books to JSON, import a JSON backup, and load the sample books.
- **Storage:** everything is saved in the browser with `localStorage`, so nothing is lost on reload.

## Getting started

Clone the repository, then open the project with a local server. ES modules do not load from `file://`.

```bash
git clone https://github.com/fiinsikabore/Summative-Assignment---Building-Responsive-UI.git
cd Summative-Assignment---Building-Responsive-UI
python3 -m http.server 8000
# then open http://localhost:8000
```

Or use the VS Code **Live Server** extension: right-click `index.html` → *Open with Live Server*.

To load the sample books, go to **Settings → Load sample books**.

## File structure

```
├── index.html          the screens (structure only)
├── tests.html          tests for the regex rules and the search
├── seed.json           10 sample books
├── styles/
│   └── main.css        colours, layout, breakpoints
└── scripts/
    ├── validators.js   every regex rule and its error message
    ├── search.js       safe regex compiler, escaping, highlight
    └── app.js          state, storage, rendering and events
```

## Regex rules

| Rule | Pattern | Passes | Fails |
|---|---|---|---|
| No space at the start or end | `/^\S(?:.*\S)?$/` | `Serpent & Dove` | ` Serpent` |
| No double spaces | `/ {2,}/` (must not match) | `The Way` | `The  Way` |
| Pages (whole number or up to 2 decimals) | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `528`, `12.5` | `0528`, `12.345` |
| Date (YYYY-MM-DD) | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `2024-02-29` | `2025-13-01`, `29/02/2024` |
| Tag (letters, spaces, hyphens) | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `Non-Fiction` | `Fantasy!` |
| **Advanced:** the same word twice (back-reference) | `/\b(\w+)\s+\1\b/i` (must not match) | `Kingdom of the Wicked` | `Kingdom Kingdom` |

**Search patterns to try:**

| Pattern | Finds |
|---|---|
| `azra\|rivens` | books by Azra Reed or Sarah Rivens |
| `^the` | titles that start with "The" |
| `kingdom` | every title with "Kingdom" |
| `(` | an invalid pattern: the app shows a message instead of crashing |

## Running the tests

Open `tests.html` with the local server. It prints a green or red line for each rule and the search helpers. The expected result is **14 passed, 0 failed**.

## Accessibility

- Landmarks (`aside`, `nav`, `main`) and a skip link
- Every input has a `<label>`; errors are linked with `aria-describedby`, and invalid fields get `aria-invalid`
- Status messages use `role="status"`
- Visible focus ring on every interactive element
- Animations are turned off when the user prefers reduced motion

## Responsive design

Mobile first. A bottom tab bar on phones, a sidebar at 1024px and wider. The library is a table; on a small screens the Tag and Added columns are hidden so it fits.

## Contact

Fiinsi Kabore
GitHub: [@fiinsikabore](https://github.com/fiinsikabore)
Email: f.kabore@alustudent.com