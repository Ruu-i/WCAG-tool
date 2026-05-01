# NgA11y Auditor

An accessibility auditing tool for Angular components, powered by Claude AI and WCAG 2.1.

Paste any Angular component template (and optionally its TypeScript file) and get a structured list of WCAG 2.1 A/AA violations, then generate a suggested fix with a visual before/after diff.

> **Best experienced on desktop** — the Monaco diff editor is not designed for mobile use.

---

## Features

- **Audit** — paste any Angular component template, get WCAG violations categorised by severity (critical / warning / info), rule ID, and affected element
- **Two-tab editor** — add the TypeScript file for deeper checks (focus management, keyboard handlers, unset ARIA bindings)
- **Fix all** — one click generates a corrected version of your component; the diff editor shows exactly what changed
- **6 built-in examples** — each with 4 real-world violations that auto-load and run audit on click
- **Hallucination prevention** — WCAG rule IDs are validated against a hard-coded allowlist; invented rules are automatically downgraded
- **Skeleton loading** — shimmer cards during the 2–3 second API call, not a spinner

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, SCSS) |
| Editor | Monaco Editor + ngx-monaco-editor-v2 |
| Diff viewer | Monaco `createDiffEditor` (native API) |
| AI model | claude-sonnet-4-20250514 (Anthropic SDK) |
| Serverless backend | Netlify Functions (Node.js, esbuild) |
| Hosting | Netlify |

---

## Architecture: Why Netlify Functions?

The Anthropic API key must never exist in browser JavaScript — it would be fully visible in DevTools to any visitor. Instead, the Angular app calls `POST /api/audit`, which Netlify routes to a serverless Node.js function at runtime. The function holds the key as a Netlify environment variable (never in source control), calls the Claude API, and returns structured JSON. This serverless proxy pattern is the standard approach for any web frontend that needs to call a paid third-party API securely. Using Netlify Functions specifically means zero infrastructure to manage: no server, no container, no cost at low traffic volumes — the function only runs when a request arrives.

---

## Run locally

**Prerequisites:** Node.js 18+, Netlify CLI

```bash
# Install Netlify CLI globally (once)
npm install -g netlify-cli

# Clone and install
git clone <repo-url>
cd nga11y-auditor
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Start (Angular + Netlify Functions together)
netlify dev
```

Open **http://localhost:8888**. Do not use `ng serve` alone — API calls will 404.

> **Note:** The first audit request after the server has been idle may take 3–4 seconds — this is Netlify function cold start behaviour. Subsequent calls are fast.

---

## Deploy to Netlify

1. Push the repo to GitHub
2. In the Netlify dashboard: **Add new site → Import from Git**
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist/nga11y-auditor/browser`
4. Go to **Site settings → Environment variables** and add `ANTHROPIC_API_KEY`
5. Trigger a deploy

SPA routing (`/* → /index.html`) is already configured in `netlify.toml`. No `_redirects` file is needed.

---

## Built-in Examples

Each example contains **4 deliberate violations** chosen to represent real-world Angular component patterns:

| Example | What it demonstrates |
|---|---|
| Login Form | Missing `<label>` elements, no `role="alert"` on error messages, missing `type` on submit button, no `autocomplete` on password field |
| Product Card | Missing `alt` on `<img>`, price change communicated by colour only, ambiguous "Buy now" button, unlabelled icon button |
| Navigation Menu | No `<nav>` landmark, dropdown trigger has no keyboard handler, active item not programmatically indicated, no skip link |
| **Modal Dialog** ★ | No focus trap, close button is a `<div>`, no `aria-modal`, no `@HostListener('keydown')` for ESC — requires both template + TS tabs |
| Data Table | Missing `scope` on `<th>`, sortable headers not keyboard accessible, empty cells have no `aria-label`, no `<caption>` |
| Notification Toast | No `aria-live` region, dismiss is a `<span>`, no `role="alert"`, auto-dismiss with no pause on hover |

The **Modal Dialog** is the best demo piece — it's the only example where violations appear from both the *Template* and *TypeScript* source tags, showing the value of the two-tab editor.

---

## WCAG Rules Checked

The tool audits WCAG 2.1 **Level A and Level AA** only. AAA rules are intentionally excluded.

| Principle | Rules checked |
|---|---|
| **1 — Perceivable** | 1.1.1 (alt text), 1.2.x (captions/audio), 1.3.x (adaptable), 1.4.x (distinguishable — contrast, resize, reflow) |
| **2 — Operable** | 2.1.x (keyboard), 2.2.x (timing), 2.4.x (navigable), 2.5.3 (label in name) |
| **3 — Understandable** | 3.1.x (language), 3.2.x (predictable), 3.3.x (input assistance) |
| **4 — Robust** | 4.1.1 (parsing), 4.1.2 (name/role/value), 4.1.3 (status messages) |

Any rule ID returned by Claude that is not in the validated allowlist is automatically relabelled `General Best Practice` and downgraded to `info` severity. This prevents invented rule numbers like `1.4.15` appearing in results.

---

## Hallucination Prevention (technical)

Two-layer defence:

1. **Prompt-level** — the system prompt gives Claude an exhaustive list of 35 valid WCAG 2.1 A/AA rule IDs and instructs it to use `"ARIA"` for anything that doesn't map to a real ID.
2. **Filter-level** — `applyHallucinationFilter()` in `audit.service.ts` splits the returned `wcag_rule` on whitespace, takes the first token (e.g. `"1.1.1"`), and checks it against the `VALID_WCAG_RULES` Set in `violation.model.ts`. Any unknown ID is overwritten. Violations are kept — they likely point at a real problem — but are marked as unverified.

---

## Fix Feature (Phase 5)

Clicking **✦ Fix all** in the results summary bar:

1. Sends the original component code + all violation objects to `POST /api/fix`
2. Claude returns structured JSON: `{ explanation, changes[], full_fixed_code }`
3. The Monaco diff editor opens in the left pane (GitHub-style side-by-side diff)
4. The changes list below the diff explains each modification
5. Copy button copies `full_fixed_code` to clipboard

The structured `changes[]` array (original/fixed string pairs) provides a plain-text fallback explanation even when the visual diff is sufficient.
