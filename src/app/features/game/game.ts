import { Component, inject, signal, computed, effect, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { GameButtonComponent } from './components/game-button/game-button';
import { MnButtonComponent } from '../../shared/components/mn-button/mn-button';
import { LEVEL_CONFIGS } from '../../core/constants/level-config';

interface ButtonCell { value: number; index: number; selected: boolean; }

@Component({
  selector: 'app-game',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameButtonComponent, MnButtonComponent],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class GameComponent implements OnDestroy {
  readonly game     = inject(GameService);
  readonly storage  = inject(StorageService);
  private readonly router   = inject(Router);
  private readonly firebase = inject(FirebaseService);

  winCountdown   = signal(5);
  nickname       = signal(this.storage.nickname);
  submitting     = signal(false);
  submitted      = signal(false);
  nicknameError  = signal('');

  readonly bgClass = this.game.bgClass;

  private winTimer?: ReturnType<typeof setInterval>;

  buttonRows = computed((): ButtonCell[][] => {
    const btns    = this.game.buttons();
    const sel     = this.game.selected();
    const gridRows = this.game.config.gridRows;
    const rows: ButtonCell[][] = [];
    let start = 0;
    for (const count of gridRows) {
      const row: ButtonCell[] = [];
      for (let i = start; i < start + count; i++) {
        row.push({ value: btns[i] ?? 0, index: i, selected: sel[i] ?? false });
      }
      rows.push(row);
      start += count;
    }
    return rows;
  });

  timerDisplay = computed(() => Math.ceil(this.game.countdown() / 10).toString());

  timerClass = computed(() => {
    const c = this.game.countdown();
    if (c <= 10) return 'danger';
    if (c <= 30) return 'warning';
    return '';
  });

  headerBoxBg = computed(() => {
    if (this.storage.theme() !== 'classic') return '';
    const tier = LEVEL_CONFIGS[this.game.level() - 1].tier;
    const gradients: Record<string, string> = {
      green:  'linear-gradient(135deg, #003300 0%, #005500 25%, #00aa00 50%, #005500 75%, #003300 100%)',
      blue:   'linear-gradient(135deg, #000033 0%, #000066 25%, #0000cc 50%, #000066 75%, #000033 100%)',
      violet: 'linear-gradient(135deg, #1a0033 0%, #3d0066 25%, #7700cc 50%, #3d0066 75%, #1a0033 100%)',
      red:    'linear-gradient(135deg, #330000 0%, #660000 25%, #cc0000 50%, #660000 75%, #330000 100%)',
      silver: 'linear-gradient(135deg, #1a1a22 0%, #3a3a4a 25%, #6a6a7a 50%, #3a3a4a 75%, #1a1a22 100%)',
    };
    return gradients[tier] ?? gradients['green'];
  });

  timerBoxBg = computed(() => {
    const c = this.game.countdown();
    if (c <= 10) return 'linear-gradient(135deg, #330000 0%, #880000 25%, #cc0000 50%, #880000 75%, #330000 100%)';
    if (c <= 30) return 'linear-gradient(135deg, #331100 0%, #883300 25%, #cc6600 50%, #883300 75%, #331100 100%)';
    return this.headerBoxBg();
  });

  scoreTarget = computed(() => this.game.config.scoreTarget);

  actionLabel = computed((): string => {
    switch (this.game.phase()) {
      case 'playing': return 'Refresh';
      case 'again':   return 'Again';
      default:        return 'Start';
    }
  });

  actionBg = computed((): string => {
    if (this.game.phase() !== 'playing' || this.storage.theme() !== 'classic') return '';
    const tier = LEVEL_CONFIGS[this.game.level() - 1].tier;
    const gradients: Record<string, string> = {
      green:  'linear-gradient(135deg, #003300 0%, #005500 25%, #00aa00 50%, #005500 75%, #003300 100%)',
      blue:   'linear-gradient(135deg, #000033 0%, #000066 25%, #0000cc 50%, #000066 75%, #000033 100%)',
      violet: 'linear-gradient(135deg, #1a0033 0%, #3d0066 25%, #7700cc 50%, #3d0066 75%, #1a0033 100%)',
      red:    'linear-gradient(135deg, #330000 0%, #660000 25%, #cc0000 50%, #660000 75%, #330000 100%)',
      silver: 'linear-gradient(135deg, #1a1a22 0%, #3a3a4a 25%, #6a6a7a 50%, #3a3a4a 75%, #1a1a22 100%)',
    };
    return gradients[tier] ?? '';
  });

  constructor() {
    this.game.initGame();

    effect(() => {
      if (this.game.phase() === 'won') {
        this.startWinCountdown();
      } else {
        this.clearWinTimer();
      }
    });

    effect(() => {
      if (this.game.phase() === 'highscore' && this.storage.nickname) {
        this.submitHighScore();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearWinTimer();
  }

  onActionClick(): void {
    if (this.game.phase() === 'playing') {
      this.game.refreshButtons();
    } else {
      this.game.startGame();
    }
  }

  continueAfterWin(): void {
    this.clearWinTimer();
    this.game.continueAfterWin();
  }

  async submitHighScore(): Promise<void> {
    const name = this.nickname().trim();
    if (!name || this.submitting()) return;
    this.submitting.set(true);
    this.nicknameError.set('');
    const ok = await this.firebase.submitScore(name, this.storage.highScore);
    if (ok) {
      this.storage.nickname    = name;
      this.storage.uploadScore = false;
      this.submitted.set(true);
    }
    this.submitting.set(false);
  }

  continueHighscore(): void {
    this.storage.uploadScore = false;
    this.game.continueAfterWin();
  }

  goHome(): void {
    if (this.game.isTicking()) return;
    this.router.navigate(['/home']);
  }

  goLevels(): void {
    if (this.game.isTicking()) return;
    this.router.navigate(['/levels']);
  }

  private startWinCountdown(): void {
    this.clearWinTimer();
    this.winCountdown.set(5);
    this.winTimer = setInterval(() => {
      this.winCountdown.update(v => {
        if (v <= 1) { this.clearWinTimer(); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  private clearWinTimer(): void {
    if (this.winTimer !== undefined) {
      clearInterval(this.winTimer);
      this.winTimer = undefined;
    }
  }
}
