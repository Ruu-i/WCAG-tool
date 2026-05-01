import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Violation } from '../../models/violation.model';
import { ViolationCardComponent } from '../violation-card/violation-card.component';

export type PanelState = 'empty' | 'loading' | 'error' | 'results';

@Component({
  selector: 'app-results-panel',
  standalone: true,
  imports: [CommonModule, ViolationCardComponent],
  templateUrl: './results-panel.component.html',
  styleUrls: ['./results-panel.component.scss'],
})
export class ResultsPanelComponent implements OnChanges {
  @Input() state: PanelState = 'empty';
  @Input() violations: Violation[] = [];
  @Input() errorMessage: string | null = null;
  @Input() fixLoading = false;
  @Output() retryClicked = new EventEmitter<void>();
  @Output() fixAllClicked = new EventEmitter<void>();

  allExpanded = false;
  expandStates: Record<string, boolean> = {};

  get criticalCount(): number {
    return this.violations.filter(v => v.severity === 'critical').length;
  }

  get warningCount(): number {
    return this.violations.filter(v => v.severity === 'warning').length;
  }

  get infoCount(): number {
    return this.violations.filter(v => v.severity === 'info').length;
  }

  readonly skeletonItems = [1, 2, 3];

  ngOnChanges(): void {
    if (this.violations.length) {
      // initialise expand states
      this.violations.forEach(v => {
        if (!(v.id in this.expandStates)) {
          this.expandStates[v.id] = false;
        }
      });
    }
  }

  expandAll(): void {
    this.allExpanded = true;
    this.violations.forEach(v => (this.expandStates[v.id] = true));
  }

  collapseAll(): void {
    this.allExpanded = false;
    this.violations.forEach(v => (this.expandStates[v.id] = false));
  }

  trackById(_: number, v: Violation): string {
    return v.id;
  }
}
