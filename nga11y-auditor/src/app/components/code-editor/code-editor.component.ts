import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxMonacoEditorConfig, MonacoEditorModule } from 'ngx-monaco-editor-v2';

export interface EditorContent {
  templateCode: string;
  tsCode: string;
}

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements OnInit, OnDestroy {
  @Output() contentChange = new EventEmitter<EditorContent>();
  @Output() auditRequest = new EventEmitter<EditorContent>();

  activeTab: 'template' | 'typescript' = 'template';

  templateCode = '';
  tsCode = '';

  templateEditorOptions: NgxMonacoEditorConfig['defaultOptions'] = {
    language: 'html',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    wordWrap: 'on',
    tabSize: 2,
  };

  tsEditorOptions: NgxMonacoEditorConfig['defaultOptions'] = {
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    wordWrap: 'on',
    tabSize: 2,
  };

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  setTab(tab: 'template' | 'typescript'): void {
    this.activeTab = tab;
  }

  onTemplateChange(value: string): void {
    this.templateCode = value;
    this.contentChange.emit({ templateCode: this.templateCode, tsCode: this.tsCode });
  }

  onTsChange(value: string): void {
    this.tsCode = value;
    this.contentChange.emit({ templateCode: this.templateCode, tsCode: this.tsCode });
  }

  clear(): void {
    this.templateCode = '';
    this.tsCode = '';
    this.contentChange.emit({ templateCode: '', tsCode: '' });
  }

  runAudit(): void {
    if (!this.templateCode.trim()) return;
    this.auditRequest.emit({ templateCode: this.templateCode, tsCode: this.tsCode });
  }

  loadContent(content: EditorContent): void {
    this.templateCode = content.templateCode;
    this.tsCode = content.tsCode;
    this.contentChange.emit(content);
  }
}
