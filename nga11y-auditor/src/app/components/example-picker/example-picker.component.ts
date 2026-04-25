import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamplesService, Example } from '../../services/examples.service';
import { EditorContent } from '../code-editor/code-editor.component';

@Component({
  selector: 'app-example-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './example-picker.component.html',
  styleUrls: ['./example-picker.component.scss'],
})
export class ExamplePickerComponent {
  @Output() exampleSelected = new EventEmitter<EditorContent>();

  constructor(readonly examplesService: ExamplesService) {}

  load(example: Example): void {
    this.exampleSelected.emit(example.content);
  }
}
