import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'mn-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mn-button.html',
  styleUrl: './mn-button.scss',
})
export class MnButtonComponent {
  @Input() label = '';
  @Input() variant: 'default' | 'highlight' | 'success' = 'default';
  @Input() size: 'normal' | 'small' = 'normal';
  @Input() disabled = false;
  @Output() press = new EventEmitter<void>();
}
