import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'mn-title',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mn-title.html',
  styleUrl: './mn-title.scss',
})
export class MnTitleComponent {
  @Input() label = '';
}
