import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-game-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-button.html',
  styleUrl: './game-button.scss',
})
export class GameButtonComponent {
  value     = input(0);
  selected  = input(false);
  level     = input(1);
  isTicking = input(false);

  press = output<void>();

  isPressed = false;

  onPointerDown(e: Event): void {
    e.preventDefault();
    if (!this.isTicking()) return;
    this.isPressed = true;
    this.press.emit();
  }

  onPointerUp(): void {
    this.isPressed = false;
  }

  // Keyboard activation (Enter / Space) for non-pointer users.
  onKeyActivate(e: Event): void {
    e.preventDefault();
    if (!this.isTicking()) return;
    this.press.emit();
  }
}
