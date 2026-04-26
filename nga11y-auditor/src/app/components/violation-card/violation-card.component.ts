import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Violation } from '../../models/violation.model';

@Component({
  selector: 'app-violation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './violation-card.component.html',
  styleUrls: ['./violation-card.component.scss'],
})
export class ViolationCardComponent {
  @Input({ required: true }) violation!: Violation;
  @Input() expanded = false;

  toggle(): void {
    this.expanded = !this.expanded;
  }

  expand(): void {
    this.expanded = true;
  }

  collapse(): void {
    this.expanded = false;
  }

  get sourceLabel(): string {
    return this.violation.source === 'typescript' ? 'TypeScript' : 'Template';
  }
}
