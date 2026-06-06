import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { LEVEL_CONFIGS } from '../../core/constants/level-config';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly game   = inject(GameService);
  readonly storage        = inject(StorageService);

  readonly level       = this.game.level;
  readonly bgClass     = this.game.bgClass;
  readonly levelConfig = computed(() => LEVEL_CONFIGS[this.level() - 1]);

  play(): void {
    this.game.initGame();
    this.router.navigate(['/game']);
  }

  levelUp(): void {
    const current = this.level();
    if (current >= 15) return;
    this.storage.setLevel(current + 1);
    this.game.initGame();
  }

  nav(path: string): void {
    this.router.navigate([path]);
  }
}
