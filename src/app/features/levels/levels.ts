import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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

  readonly outerConfigs = LEVEL_CONFIGS.slice(0, 14);
  readonly centerConfig = LEVEL_CONFIGS[14];

  readonly bgClass      = this.game.bgClass;
  readonly currentLevel = this.game.level;

  selectedLevel = signal(this.game.level());

  readonly selectedConfig = computed(() => LEVEL_CONFIGS[this.selectedLevel() - 1]);

  isUnlocked(level: number): boolean {
    return level <= this.currentLevel();
  }

  tierGradient(tier: string): string {
    const g: Record<string, string> = {
      green:  'linear-gradient(180deg, #002800, #005500, #002800)',
      blue:   'linear-gradient(180deg, #000025, #000070, #000025)',
      violet: 'linear-gradient(180deg, #1a0028, #440070, #1a0028)',
      red:    'linear-gradient(180deg, #280000, #700000, #280000)',
      silver: 'linear-gradient(180deg, #303040, #707090, #303040)',
    };
    return g[tier] ?? g['green'];
  }

  badgePosition(index: number): { top: string; left: string } {
    const angle = (index / 14) * 2 * Math.PI - Math.PI / 2;
    const cx = 140, cy = 140, r = 105, size = 52;
    return {
      left: `${Math.round(cx + r * Math.cos(angle) - size / 2)}px`,
      top:  `${Math.round(cy + r * Math.sin(angle) - size / 2)}px`,
    };
  }

  selectLevel(level: number): void {
    if (!this.isUnlocked(level)) return;
    this.selectedLevel.set(level);
  }

  timerSeconds(cfg: LevelConfig): string {
    return Math.round(cfg.timerTicks / 10).toString();
  }

  playSelected(): void {
    const level = this.selectedLevel();
    if (!this.isUnlocked(level)) return;
    this.storage.setLevel(level);
    this.game.initGame();
    this.router.navigate(['/game']);
  }

  back(): void { this.router.navigate(['/home']); }
}
