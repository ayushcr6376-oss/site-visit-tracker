# Industrial Site Visit Tracker

Premium, minimalist React web app for logging industrial site visits with digital signatures, CSV export, and PDF reports. Data persists in the browser via LocalStorage.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (included with Node.js)

## Installation

Open a terminal in the project folder (`D:\site visit`) and run:

```bash
npm install
```

### Libraries installed (all free & open-source)

| Feature | Package | Purpose |
|--------|---------|---------|
| Digital signature | `react-signature-canvas` | Touch/mouse signature pad (wraps `signature_pad`) |
| PDF reports | `jspdf` + `jspdf-autotable` | Professional PDF with summary tables |
| Excel export | *(built-in)* | UTF-8 CSV download — opens in Excel; no extra package required |

## Run the app

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## First-time usage

1. **Sign Up** — Create an account (name, email, password ≥ 6 characters).
2. **Dashboard** — After login you see metrics, actions, and visit history.
3. **Log New Visit** — Fill the modal, draw a signature, click **Save Signature**, then **Save Visit**.
4. **Export to Excel (.csv)** — Downloads all visits from LocalStorage as a `.csv` file.
5. **Generate PDF Report** — Downloads a formatted PDF with summary and visit table.
6. **Search** — Filter visits by company, type, task, status, or date text.
7. **Delete** — Trash icon on a card removes the visit and refreshes metrics instantly.
8. **Logout** — Clears auth token; dashboard is hidden until login again.

## LocalStorage keys

| Key | Content |
|-----|---------|
| `isvt_auth_token` | Session token |
| `isvt_auth_user` | Logged-in user profile |
| `isvt_users` | Registered accounts (mock auth) |
| `isvt_visits` | All site visit records (including base64 signatures) |

## Library usage in this project

### Signature (`react-signature-canvas`)

```jsx
import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const sigRef = useRef(null);

// Clear
sigRef.current?.clear();

// Save as base64 PNG
if (!sigRef.current?.isEmpty()) {
  const base64 = sigRef.current.toDataURL('image/png');
}

<SignatureCanvas
  ref={sigRef}
  penColor="#1E3A8A"
  canvasProps={{ className: 'w-full h-40 touch-none' }}
/>
```

### PDF (`jspdf` + `jspdf-autotable`)

```js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();
autoTable(doc, { head: [['Col1', 'Col2']], body: [['A', 'B']] });
doc.save('report.pdf');
```

See `src/utils/exportPdf.js` for the full report implementation.

### CSV export (no npm package)

```js
const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
// trigger download via temporary <a> element
```

See `src/utils/exportExcel.js`.

## Project structure

```
src/
├── App.jsx                 # Auth gate + routing
├── context/AppContext.jsx  # Global state + LocalStorage
├── components/             # UI modules
└── utils/                  # Auth, storage, PDF, CSV
```

## Design palette

- **White** — cards, modals
- **Premium gray** — `#F5F5F7`, `#E8E8ED`
- **Royal blue** — `#1E3A8A` (primary actions, branding)

## Security note

Auth and visit data are stored only in the browser. This is suitable for demos and single-device use. For production, replace mock LocalStorage auth with a secure backend API.
