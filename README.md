# File Converter

> A zero-dependency, client-side file conversion tool — all processing happens in the browser. No server, no uploads, no data leaves your machine.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen)

---

## Overview

File Converter is a single-page application that converts images and text-based data files entirely within the browser using native Web APIs — the Canvas API for image rasterisation and the FileReader API for text parsing. There is no backend, no build step, and no third-party libraries. The project runs by opening `index.html` directly.

---

## Live Demo

Clone or download the repository and open `index.html` in any modern browser.

```
index.html      ← entry point and markup
style.css       ← layout, components, and dark theme
converter.js    ← conversion engine, state management, rendering
```

---

## Supported Conversions

### Images

| Source | Available targets |
|---|---|
| JPG / JPEG | PNG, WebP, GIF, BMP, ICO |
| PNG | JPG, WebP, GIF, BMP, ICO |
| WebP | JPG, PNG, GIF, BMP |
| GIF | JPG, PNG, WebP, BMP |
| BMP | JPG, PNG, WebP, GIF |
| ICO | JPG, PNG |

### Text and Data

| Source | Available targets |
|---|---|
| TXT | JSON, HTML, Markdown, CSV |
| JSON | TXT, XML, CSV |
| CSV | JSON, TXT, HTML, XML |
| XML | JSON, TXT, HTML |
| HTML | TXT, Markdown |
| Markdown | HTML, TXT |

---

## Features

- **Fully client-side** — files never leave the browser; no network requests are made
- **Batch processing** — add multiple files, configure each independently, convert all at once
- **Drag-and-drop** — drop files onto the drop zone or use the file picker
- **Per-file format selector** — change the target format at any time before converting
- **Reactive status indicators** — each card shows a live status: Ready / Converting / Done / Error
- **Instant download** — converted output is made available as a `Blob` object URL for immediate download
- **Deterministic colour coding** — each format extension is assigned a fixed accent colour for quick visual identification
- **Responsive layout** — works on desktop and mobile browsers

---

## Project Structure

```
file-converter/
│
├── index.html        # Markup: drop zone, file list container, action bar
├── style.css         # Styles: dark theme, card grid, status dots, buttons
├── converter.js      # Engine: format map, image converter, text transformer,
│                     #         state management, rendering, utilities
└── README.md
```

---

## How It Works

### 1. File Ingestion

Files are added via drag-and-drop or the `<input type="file">` element. Each file is wrapped in a `FileItem` object and pushed to the `items` array. The source extension is extracted and used to look up available target formats from `FORMAT_MAP`.

### 2. Image Conversion

Image files are converted using an off-screen `<canvas>`:

1. The source file is read as a Data URL via `FileReader`.
2. An `Image` element loads the Data URL.
3. The image is drawn onto a canvas at its original dimensions.
4. For formats that do not support transparency (JPG, BMP, ICO), a white background is filled first.
5. `canvas.toBlob()` encodes the result in the target MIME type.
6. A `Blob` object URL is returned for download.

### 3. Text and Data Conversion

Text files are read as UTF-8 strings and passed to `transformText()`, a pure function that handles all format pair logic:

- **CSV parsing** handles quoted fields containing embedded commas correctly
- **JSON ↔ XML** conversion uses a recursive tree walker
- **XML ↔ JSON** conversion uses the browser's built-in `DOMParser`
- **HTML ↔ Markdown** conversion uses regex-based tag replacement
- Unsupported pairs fall through to an identity return (source text unchanged)

### 4. State and Rendering

There is no framework. The `items` array is the single source of truth. Every mutation (add, delete, format change, status update) calls `render()`, which rebuilds the file list DOM from scratch. This keeps the update logic trivial and avoids stale state.

### 5. Download Mechanism

Converted output is stored as a `Blob` object URL (`URL.createObjectURL()`). The download link in the Done state points directly to this URL with the `download` attribute set to the computed output filename. No server round-trip is involved.

---

## Controls

| Action | Method |
|---|---|
| Add files | Drag onto drop zone, or click to open file picker |
| Change target format | Use the format selector dropdown on each card |
| Convert a single file | Click the **Convert** button on the card |
| Convert all pending files | Click **Convert all** in the action bar |
| Download result | Click the **Download** link on a completed card |
| Remove a file | Click the **x** button on the card |
| Clear all files | Click **Clear all** in the action bar |

---

## Configuration

Format routing is defined in the `FORMAT_MAP` object at the top of `converter.js`. To add a new source format or extend an existing one, update the relevant entry:

```js
const FORMAT_MAP = {
  png: ['jpg', 'webp', 'gif', 'bmp', 'ico'],
  // add 'tiff' as a new target:
  // png: ['jpg', 'webp', 'gif', 'bmp', 'ico', 'tiff'],
};
```

Accent colours for format badges are controlled by `FORMAT_COLOR` in the same file.

---

## Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | Full |
| Firefox 88+ | Full |
| Safari 15+ | Full |
| Edge 90+ | Full |
| Mobile (iOS / Android) | Full |

Requires: `FileReader API`, `Canvas API`, `DOMParser`, `Blob`, `URL.createObjectURL`. All are baseline-stable across modern browsers.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please open an issue before submitting large changes.

---
