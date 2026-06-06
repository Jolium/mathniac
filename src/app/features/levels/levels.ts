import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { LEVEL_CONFIGS } from '../../core/constants/level-config';
import { LevelConfig } from '../../core/models/level.model';
import { MnTitleComponent } from '../../shared/components/mn-title/mn-title';
import { MnButtonComponent } from '../../shared/components/mn-button/mn-button';

@Component({
  selector: 'app-levels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MnTitleComponent, MnButtonComponent],
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
      green:  'linear-gradient(135deg, #001400, #005500, #00aa00, #005500, #001400)',
      blue:   'linear-gradient(135deg, #000010, #000055, #0000cc, #000055, #000010)',
      violet: 'linear-gradient(135deg, #0d0020, #3d0066, #7700cc, #3d0066, #0d0020)',
      red:    'linear-gradient(135deg, #1a0000, #660000, #cc0000, #660000, #1a0000)',
      silver: 'linear-gradient(135deg, #1a1a22, #3a3a4a, #6a6a7a, #3a3a4a, #1a1a22)',
    };
    return g[tier] ?? g['green'];
  }

  badgePosition(index: number): { top: string; left: string } {
    const angle = (index / 14) * 2 * Math.PI - Math.PI / 2;
    const cx = 180, cy = 180, r = 135, size = 72;
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
    this.router.navigate(['/game'], { replaceUrl: true });
  }

  back(): void { this.router.navigate(['/home'], { replaceUrl: true }); }
}
