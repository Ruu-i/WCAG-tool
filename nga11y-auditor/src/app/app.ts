import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuditService } from './services/audit.service';
import { Violation } from './models/violation.model';
import { CodeEditorComponent, EditorContent } from './components/code-editor/code-editor.component';
import { ResultsPanelComponent, PanelState } from './components/results-panel/results-panel.component';
import { ExamplePickerComponent } from './components/example-picker/example-picker.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CodeEditorComponent, ResultsPanelComponent, ExamplePickerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  @ViewChild(CodeEditorComponent) codeEditor!: CodeEditorComponent;

  panelState: PanelState = 'empty';
  violations: Violation[] = [];
  loading$!: Observable<boolean>;
  errorMessage: string | null = null;
  private lastContent: EditorContent | null = null;

  constructor(private auditService: AuditService) {}

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
  }

  onAuditRequest(content: EditorContent): void {
    this.lastContent = content;
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
    // auto-run audit after loading example
    this.onAuditRequest(content);
  }
}
