import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { FixResult, FixChange, Violation } from '../models/violation.model';

@Injectable({ providedIn: 'root' })
export class FixService {
  private readonly apiUrl = '/api/fix';

  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  fix(templateCode: string, violations: Violation[], tsCode?: string): Observable<FixResult | null> {
    this.loading$.next(true);
    this.error$.next(null);

    const body: Record<string, unknown> = { templateCode, violations };
    if (tsCode?.trim()) {
      body['tsCode'] = tsCode;
    }

    return this.http.post<{ raw: string }>(this.apiUrl, body).pipe(
      map(response => this.parseResponse(response.raw)),
      catchError(err => {
        const message =
          err.status === 0
            ? 'Network error — is the server running?'
            : err.error ?? 'Fix service temporarily unavailable';
        this.error$.next(typeof message === 'string' ? message : 'Unexpected error');
        return of(null);
      }),
      finalize(() => this.loading$.next(false)),
    );
  }

  private parseResponse(raw: string): FixResult | null {
    const extracted = this.extractJsonObject(raw);
    if (!extracted) {
      this.error$.next('Could not parse fix response — please try again');
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extracted);
    } catch {
      this.error$.next('Malformed response from AI — please try again');
      return null;
    }

    if (!this.isValidFixResult(parsed)) {
      this.error$.next('Unexpected response shape from AI — please try again');
      return null;
    }

    return parsed as FixResult;
  }

  private extractJsonObject(raw: string): string | null {
    const stripped = raw.replace(/```json|```/gi, '').trim();
    const match = stripped.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
  }

  private isValidFixResult(item: unknown): boolean {
    if (!item || typeof item !== 'object') return false;
    const r = item as Record<string, unknown>;
    return (
      typeof r['explanation'] === 'string' &&
      Array.isArray(r['changes']) &&
      typeof r['full_fixed_code'] === 'string' &&
      r['full_fixed_code'].length > 0
    );
  }
}
