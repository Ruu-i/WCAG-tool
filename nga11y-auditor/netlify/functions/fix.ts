import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

const MAX_CODE_LENGTH = 50_000;

interface Violation {
  id: string;
  title: string;
  wcag_rule: string;
  severity: string;
  element: string;
  explanation: string;
  recommendation: string;
  source: string;
}

function buildFixSystemPrompt(): string {
  return `You are an expert in WCAG 2.1 accessibility standards, ARIA specifications, and Angular 17+ development.

Your job is to fix accessibility violations in Angular component code.

RULES YOU MUST FOLLOW:
1. Return ONLY a valid JSON object. No preamble, no explanation, no markdown, no backticks. Your entire response must start with { and end with }.
2. Apply ONLY the fixes that address the violations listed. Do not refactor, rename, or reformat anything else.
3. Preserve all existing logic, class names, Angular bindings, and component structure.
4. Be Angular 17+ aware: @if, @for, @switch are valid syntax.
5. Your response must have exactly this shape:
{
  "explanation": "string — 1-2 sentences summarising what was fixed",
  "changes": [
    {
      "original": "string — the exact original snippet that was changed",
      "fixed": "string — the replacement snippet",
      "explanation": "string — one sentence why this change fixes the violation"
    }
  ],
  "full_fixed_code": "string — the complete corrected file content"
}`;
}

function buildFixUserPrompt(templateCode: string, violations: Violation[], tsCode?: string): string {
  const violationList = violations
    .map(v => `- [${v.severity.toUpperCase()}] ${v.title} (${v.wcag_rule}) — ${v.recommendation}`)
    .join('\n');

  const tsSection = tsCode?.trim()
    ? `\nCOMPONENT TYPESCRIPT (component.ts):\n\`\`\`typescript\n${tsCode}\n\`\`\``
    : '';

  return `Fix the following accessibility violations in this Angular component.

VIOLATIONS TO FIX:
${violationList}

COMPONENT TEMPLATE (template.html):
\`\`\`html
${templateCode}
\`\`\`
${tsSection}

Rules:
- Only fix what is listed. Do not change anything else.
- full_fixed_code must be the complete fixed template (not a diff, not a partial).
- If a violation is in TypeScript (source: typescript), fix it in the TS file and put the corrected TS content in full_fixed_code instead.
- Do not add explanatory comments to the code.

Return a single JSON object matching the schema. No markdown.`;
}

function looksLikeJsonObject(text: string): boolean {
  return /\{[\s\S]*\}/.test(text.replace(/```json|```/gi, '').trim());
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let templateCode: string;
  let tsCode: string | undefined;
  let violations: Violation[];

  try {
    const body = JSON.parse(event.body ?? '{}');
    templateCode = body.templateCode ?? '';
    tsCode = body.tsCode;
    violations = Array.isArray(body.violations) ? body.violations : [];
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  if (!templateCode || typeof templateCode !== 'string') {
    return { statusCode: 400, body: 'templateCode is required' };
  }

  if (!violations.length) {
    return { statusCode: 400, body: 'violations array is required and must not be empty' };
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

  const callClaude = (messages: Anthropic.MessageParam[]): Promise<string> =>
    client.messages
      .create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: buildFixSystemPrompt(),
        messages,
      })
      .then(msg => (msg.content[0].type === 'text' ? msg.content[0].text : ''));

  try {
    const userMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: buildFixUserPrompt(templateCode, violations, tsCode) },
    ];

    let responseText = await callClaude(userMessages);

    // Silent retry if Claude didn't return a JSON object
    if (!looksLikeJsonObject(responseText)) {
      console.warn('Fix: first response was not a JSON object — retrying silently');
      responseText = await callClaude([
        ...userMessages,
        { role: 'assistant', content: responseText },
        {
          role: 'user',
          content:
            'Your previous response was not valid JSON. Return ONLY a JSON object starting with {. No explanation, no markdown.',
        },
      ]);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: responseText }),
    };
  } catch (err) {
    console.error('Claude API error (fix):', err);
    return { statusCode: 500, body: 'Fix service temporarily unavailable' };
  }
};
