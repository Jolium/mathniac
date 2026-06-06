import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';

@Component({
  selector: 'app-intro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class IntroComponent {
  private readonly router = inject(Router);
  private readonly game   = inject(GameService);

  readonly bgClass = this.game.bgClass;

  back(): void { this.router.navigate(['/home']); }
}
