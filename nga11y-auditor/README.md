# NgA11y Auditor

An accessibility auditing tool for Angular components, powered by Claude AI and WCAG 2.1.

## What it does

Paste any Angular component template (and optionally its TypeScript file) and get a structured list of WCAG 2.1 accessibility violations, categorised by severity, rule ID, and affected element.

Checks include:
- Missing ARIA roles, labels, and properties
- Keyboard accessibility (focus, tab order, keyboard handlers)
- Semantic HTML (headings, landmarks, lists, buttons)
- Form accessibility (labels, error associations, field descriptions)
- Image and media alt text
- Colour contrast (hardcoded suspicious values)
- Dynamic content (live regions, alerts, loading states)
- Angular-specific patterns (missing keyboard handlers, CDK config, focus management)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (standalone components) |
| Editor | Monaco Editor via ngx-monaco-editor-v2 |
| AI | Claude claude-sonnet-4-20250514 (Anthropic SDK) |
| Backend | Netlify Functions (serverless Node.js) |
| Hosting | Netlify (free tier) |

## Architecture: Why Netlify Functions?

The Claude API key must never be sent to the browser - it would be fully visible in DevTools to any user. Instead, Angular calls /api/audit, which Netlify routes to a serverless function. The function holds the key as a Netlify environment variable, never in source control. This is a standard serverless proxy pattern used by any production app calling a paid API from a web frontend.

## Run locally

Prerequisites: Node.js 18+, Angular CLI, Netlify CLI

Install Netlify CLI:
  npm install -g netlify-cli

Clone and install:
  git clone <repo-url>
  cd nga11y-auditor
  npm install

Set up environment:
  echo "ANTHROPIC_API_KEY=your_key_here" > .env

Start dev server (runs Angular + Netlify Functions):
  netlify dev

The app will be at http://localhost:8888. Do NOT use ng serve alone - API calls will 404.

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Set ANTHROPIC_API_KEY in Site settings > Environment variables
4. Deploy - build command: npm run build, publish dir: dist/nga11y-auditor/browser

## WCAG Hallucination Prevention

The full WCAG 2.1 A/AA rule ID allowlist is defined in src/app/models/violation.model.ts. Any rule ID Claude returns that is not on this list is automatically replaced with "General Best Practice" and downgraded to info severity. This prevents invented rule numbers like "1.4.15" from appearing in results.
