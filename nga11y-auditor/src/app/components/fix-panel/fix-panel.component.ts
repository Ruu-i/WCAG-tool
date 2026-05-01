import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FixResult, FixChange } from '../../models/violation.model';

declare const monaco: typeof import('monaco-editor');

@Component({
  selector: 'app-fix-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fix-panel.component.html',
  styleUrls: ['./fix-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixPanelComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) fixResult!: FixResult;
  @Input() originalCode = '';
  @Input() language = 'html';

  @ViewChild('diffContainer') diffContainer!: ElementRef<HTMLDivElement>;

  copyLabel = 'Copy fixed code';
  private diffEditor: import('monaco-editor').editor.IStandaloneDiffEditor | null = null;

  ngAfterViewInit(): void {
    this.initDiffEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fixResult'] || changes['originalCode']) && this.diffEditor) {
      this.updateModels();
    }
  }

  ngOnDestroy(): void {
    this.diffEditor?.dispose();
  }

  private initDiffEditor(): void {
    if (!this.diffContainer?.nativeElement) return;
    const monacoGlobal = (window as unknown as { monaco: typeof monaco }).monaco;
    if (!monacoGlobal) return;

    this.diffEditor = monacoGlobal.editor.createDiffEditor(this.diffContainer.nativeElement, {
      readOnly: true,
      renderSideBySide: true,
      automaticLayout: true,
      theme: 'vs-dark',
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
    });

    this.updateModels();
  }

  private updateModels(): void {
    if (!this.diffEditor) return;
    const monacoGlobal = (window as unknown as { monaco: typeof monaco }).monaco;
    if (!monacoGlobal) return;

    const lang = this.language;
    const original = monacoGlobal.editor.createModel(this.originalCode ?? '', lang);
    const modified = monacoGlobal.editor.createModel(this.fixResult?.full_fixed_code ?? '', lang);
    this.diffEditor.setModel({ original, modified });
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.fixResult.full_fixed_code);
      this.copyLabel = 'Copied!';
      setTimeout(() => (this.copyLabel = 'Copy fixed code'), 2000);
    } catch {
      this.copyLabel = 'Copy failed';
      setTimeout(() => (this.copyLabel = 'Copy fixed code'), 2000);
    }
  }
}
