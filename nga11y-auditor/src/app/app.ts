import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuditService } from './services/audit.service';
import { FixService } from './services/fix.service';
import { Violation, FixResult } from './models/violation.model';
import { CodeEditorComponent, EditorContent } from './components/code-editor/code-editor.component';
import { ResultsPanelComponent, PanelState } from './components/results-panel/results-panel.component';
import { ExamplePickerComponent } from './components/example-picker/example-picker.component';
import { FixPanelComponent } from './components/fix-panel/fix-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CodeEditorComponent, ResultsPanelComponent, ExamplePickerComponent, FixPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  @ViewChild(CodeEditorComponent) codeEditor!: CodeEditorComponent;

  panelState: PanelState = 'empty';
  violations: Violation[] = [];
  loading$!: Observable<boolean>;
  errorMessage: string | null = null;
  lastContent: EditorContent | null = null;

  // Fix feature state
  view: 'audit' | 'fix' = 'audit';
  fixResult: FixResult | null = null;
  fixLoading = false;
  fixLanguage = 'html';

  constructor(
    private auditService: AuditService,
    private fixService: FixService,
  ) {}

  ngOnInit(): void {
    this.loading$ = this.auditService.loading$;

    this.auditService.loading$.subscribe(loading => {
      if (loading) {
        this.panelState = 'loading';
        this.errorMessage = null;
      }
    });

    this.auditService.error$.subscribe(err => {
      if (err) {
        this.errorMessage = err;
        this.panelState = 'error';
      }
    });

    this.fixService.loading$.subscribe(loading => (this.fixLoading = loading));
  }

  onAuditRequest(content: EditorContent): void {
    this.lastContent = content;
    this.view = 'audit';
    this.fixResult = null;
    this.auditService
      .audit(content.templateCode, content.tsCode || undefined)
      .subscribe(violations => {
        if (!this.auditService.error$.value) {
          this.violations = violations;
          this.panelState = 'results';
        }
      });
  }

  onRetry(): void {
    if (this.lastContent) {
      this.onAuditRequest(this.lastContent);
    }
  }

  onExampleSelected(content: EditorContent): void {
    this.codeEditor?.loadContent(content);
    this.panelState = 'empty';
    this.violations = [];
    this.fixResult = null;
    this.view = 'audit';
  }

  onFixAll(): void {
    if (!this.lastContent || !this.violations.length) return;
    const tsViolations = this.violations.filter(v => v.source === 'typescript');
    const hasTs = tsViolations.length > 0 && !!this.lastContent.tsCode?.trim();

    // Fix TS violations using TS code; template violations using template code
    const codeToFix = hasTs ? this.lastContent.tsCode! : this.lastContent.templateCode;
    this.fixLanguage = hasTs ? 'typescript' : 'html';

    this.fixService
      .fix(this.lastContent.templateCode, this.violations, this.lastContent.tsCode || undefined)
      .subscribe(result => {
        if (result) {
          this.fixResult = result;
          this.view = 'fix';
        }
      });
  }

  backToAudit(): void {
    this.view = 'audit';
  }
}
