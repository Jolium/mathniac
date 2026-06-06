import { Component, inject, signal, computed, effect, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { GameButtonComponent } from './components/game-button/game-button';

interface ButtonCell { value: number; index: number; selected: boolean; }

@Component({
  selector: 'app-game',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameButtonComponent],
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

  timerDisplay = computed(() => {
    const secs = this.game.countdown() / 10;
    return secs.toFixed(1) + 's';
  });

  timerClass = computed(() => {
    const c = this.game.countdown();
    if (c <= 10) return 'danger';
    if (c <= 30) return 'warning';
    return '';
  });

  scoreTarget = computed(() => this.game.config.scoreTarget);

  actionLabel = computed((): string => {
    switch (this.game.phase()) {
      case 'playing': return 'Refresh';
      case 'again':   return 'Again';
      default:        return 'Start';
    }
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
    if (!this.storage.nickname && await this.firebase.nicknameExists(name)) {
      this.nicknameError.set('This nickname is already taken.');
      this.submitting.set(false);
      return;
    }
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
