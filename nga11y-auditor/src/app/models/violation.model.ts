export type Severity = 'critical' | 'warning' | 'info';
export type ViolationSource = 'template' | 'typescript';
export type WcagLevel = 'A' | 'AA' | 'Best Practice' | 'Info';

export interface Violation {
  id: string;
  title: string;
  wcag_rule: string;
  wcag_level: WcagLevel;
  severity: Severity;
  element: string;
  explanation: string;
  recommendation: string;
  source: ViolationSource;
}

export interface AuditResult {
  violations: Violation[];
  rawResponse: string;
}

export const VALID_WCAG_RULES = new Set<string>([
  '1.1.1',
  '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5',
  '1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5',
  '1.4.1', '1.4.2', '1.4.3', '1.4.4', '1.4.5',
  '1.4.10', '1.4.11', '1.4.12', '1.4.13',
  '2.1.1', '2.1.2', '2.1.4',
  '2.2.1', '2.2.2',
  '2.4.1', '2.4.2', '2.4.3', '2.4.4', '2.4.6', '2.4.7',
  '2.5.3',
  '3.1.1', '3.1.2',
  '3.2.1', '3.2.2',
  '3.3.1', '3.3.2', '3.3.3', '3.3.4',
  '4.1.1', '4.1.2', '4.1.3',
]);
