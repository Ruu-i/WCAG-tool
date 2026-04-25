import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { Violation, AuditResult, VALID_WCAG_RULES, Severity } from '../models/violation.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiUrl = '/api/audit';

  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  audit(templateCode: string, tsCode?: string): Observable<Violation[]> {
    this.loading$.next(true);
    this.error$.next(null);

    const body: Record<string, string> = { templateCode };
    if (tsCode?.trim()) {
      body['tsCode'] = tsCode;
    }

    return this.http.post<{ raw: string }>(this.apiUrl, body).pipe(
      map(response => this.parseResponse(response.raw)),
      catchError(err => {
        const message = err.status === 0
          ? 'Network error — is the server running?'
          : err.error ?? 'Audit service temporarily unavailable';
        this.error$.next(typeof message === 'string' ? message : 'Unexpected error');
        return of([]);
      }),
      finalize(() => this.loading$.next(false)),
    );
  }

  private parseResponse(raw: string): Violation[] {
    const extracted = this.extractJsonArray(raw);
    if (!extracted) {
      this.error$.next('Could not parse audit response — please try again');
      return [];
    }

    let parsed: unknown[];
    try {
      parsed = JSON.parse(extracted);
    } catch {
      this.error$.next('Malformed response from AI — please try again');
      return [];
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    const violations = parsed
      .filter(item => this.isValidViolationShape(item))
      .map(item => this.applyHallucinationFilter(item as Violation));

    return violations;
  }

  private extractJsonArray(raw: string): string | null {
    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const match = cleaned.match(/\[[\s\S]*\]/);
    return match ? match[0] : null;
  }

  private isValidViolationShape(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    const v = obj as Record<string, unknown>;
    const validSeverities: Severity[] = ['critical', 'warning', 'info'];
    return (
      typeof v['id'] === 'string' &&
      typeof v['title'] === 'string' &&
      typeof v['severity'] === 'string' &&
      validSeverities.includes(v['severity'] as Severity)
    );
  }

  private applyHallucinationFilter(violation: Violation): Violation {
    if (!violation.wcag_rule) return violation;

    const ruleId = violation.wcag_rule.split(' ')[0].trim();

    if (ruleId !== 'ARIA' && !VALID_WCAG_RULES.has(ruleId)) {
      return {
        ...violation,
        wcag_rule: 'General Best Practice',
        wcag_level: 'Info' as const,
        severity: 'info',
      };
    }

    return violation;
  }
}
