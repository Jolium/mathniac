import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { LEVEL_CONFIGS } from '../../core/constants/level-config';
import { LevelConfig } from '../../core/models/level.model';

@Component({
  selector: 'app-levels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './levels.html',
  styleUrl: './levels.scss',
})
export class LevelsComponent {
  private readonly router  = inject(Router);
  private readonly game    = inject(GameService);
  readonly storage         = inject(StorageService);

  configs        = LEVEL_CONFIGS;
  readonly bgClass       = this.game.bgClass;
  readonly currentLevel  = this.game.level;

  isUnlocked(cfg: LevelConfig): boolean {
    return cfg.level <= this.currentLevel();
  }

  timerSeconds(cfg: LevelConfig): string {
    return (cfg.timerTicks / 10).toFixed(0) + 's';
  }

  playLevel(cfg: LevelConfig): void {
    if (!this.isUnlocked(cfg)) return;
    this.storage.setLevel(cfg.level);
    this.game.initGame();
    this.router.navigate(['/game']);
  }

  back(): void { this.router.navigate(['/home']); }
}
