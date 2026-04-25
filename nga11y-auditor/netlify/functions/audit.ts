import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

const MAX_CODE_LENGTH = 50_000;

function buildSystemPrompt(): string {
  return `You are an expert in WCAG 2.1 accessibility standards, ARIA specifications, and Angular 17+ development.

Your job is to audit Angular component code for accessibility violations.

RULES YOU MUST FOLLOW:
1. Return ONLY a valid JSON array. No preamble, no explanation, no markdown, no backticks. Your entire response must start with [ and end with ].
2. You may ONLY reference WCAG 2.1 rule IDs from this exact list:
   1.1.1, 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5,
   1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5,
   1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.10, 1.4.11, 1.4.12, 1.4.13,
   2.1.1, 2.1.2, 2.1.4,
   2.2.1, 2.2.2,
   2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 2.4.7,
   2.5.3,
   3.1.1, 3.1.2,
   3.2.1, 3.2.2,
   3.3.1, 3.3.2, 3.3.3, 3.3.4,
   4.1.1, 4.1.2, 4.1.3
   If a finding does not map to one of these IDs exactly, use "ARIA" as the wcag_rule value and "Best Practice" as wcag_level.
3. Do NOT audit AAA-level rules. Only audit Level A and Level AA.
4. Do NOT invent violations. Only report what is clearly present in the code provided.
5. For colour contrast: you cannot compute actual ratios from code. Only flag contrast if hex/rgb values are hardcoded AND visually suspicious (e.g. light grey on white). Mark these as severity "warning" with a note that manual verification is needed.
6. Be Angular 17+ aware: @if, @for, @switch are valid syntax. Do not flag these as errors.`;
}

function buildUserPrompt(templateCode: string, tsCode?: string): string {
  const tsSection = tsCode?.trim()
    ? `COMPONENT TYPESCRIPT (component.ts):
\`\`\`typescript
${tsCode}
\`\`\`

For the TypeScript, specifically check:
- Custom interactive elements (click handlers) missing keyboard equivalents via @HostListener('keydown') or @HostListener('keyup')
- @HostListener('click') with no corresponding keyboard handler
- Dynamic ARIA attributes (aria-label, aria-expanded etc.) bound to component properties that may be undefined or never set
- Focus management — dialogs/modals/overlays that don't trap or restore focus using ViewChild or CDK FocusTrap
- Any use of setTimeout for focus management (fragile pattern)
`
    : `No TypeScript file provided. Audit template only.`;

  return `Audit the following Angular component for accessibility violations.
Cover ALL of the following categories:
- Missing or incorrect ARIA roles, labels, and properties
- Keyboard accessibility (focus, tab order, keyboard handlers)
- Semantic HTML — correct use of headings, landmarks, lists, buttons
- Form accessibility — labels, error messages, field descriptions
- Image and media accessibility
- Colour contrast — only flag hardcoded suspicious values
- Dynamic content — live regions, loading states, alerts
- Angular-specific patterns — *ngFor without trackBy on interactive lists, CDK components missing accessibility config

COMPONENT TEMPLATE (template.html):
\`\`\`html
${templateCode}
\`\`\`

${tsSection}

Return a JSON array where each item has EXACTLY this shape:
{
  "id": "string — unique, e.g. v1, v2, v3",
  "title": "string — short issue title, max 8 words",
  "wcag_rule": "string — e.g. '1.1.1 Non-text Content' or 'ARIA'",
  "wcag_level": "string — 'A', 'AA', or 'Best Practice'",
  "severity": "string — exactly one of: critical, warning, info",
  "element": "string — the specific element or selector, e.g. '<img>'",
  "explanation": "string — plain English, max 2 sentences, no jargon",
  "recommendation": "string — exactly one actionable sentence",
  "source": "string — exactly one of: template, typescript"
}

Severity guide:
- critical: blocks access entirely for screen reader or keyboard users
- warning: degrades experience significantly or likely fails audit
- info: best practice improvement, low user impact

If no violations found, return [].`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let templateCode: string;
  let tsCode: string | undefined;

  try {
    const body = JSON.parse(event.body ?? '{}');
    templateCode = body.templateCode ?? '';
    tsCode = body.tsCode;
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  if (!templateCode || typeof templateCode !== 'string') {
    return { statusCode: 400, body: 'templateCode is required' };
  }

  const combinedLength = templateCode.length + (tsCode?.length ?? 0);
  if (combinedLength > MAX_CODE_LENGTH) {
    return { statusCode: 400, body: 'Code exceeds maximum allowed length of 50,000 characters' };
  }

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    return { statusCode: 500, body: 'Server configuration error' };
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(templateCode, tsCode) }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: responseText }),
    };
  } catch (err) {
    console.error('Claude API error:', err);
    return { statusCode: 500, body: 'Audit service temporarily unavailable' };
  }
};
