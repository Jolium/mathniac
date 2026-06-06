import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { AudioService } from './audio.service';
import { LEVEL_CONFIGS } from '../constants/level-config';
import { LevelConfig } from '../models/level.model';

export type GamePhase = 'idle' | 'playing' | 'won' | 'again' | 'highscore';

const POINTS_BY_COUNT: Record<number, number> = { 2: 10, 3: 18, 4: 28, 5: 40, 6: 54 };
const POINTS_TO_EXTRA_TICK = 20;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly storage = inject(StorageService);
  private readonly audio   = inject(AudioService);

  readonly level        = computed(() => this.storage.level());
  readonly bgClass      = computed(() => {
    if (!this.storage.backgroundOn()) return 'bg-off';
    return this.level() === 15 ? 'bg-15' : 'bg-on';
  });

  score         = signal(0);
  countdown     = signal(0);
  isTicking     = signal(false);
  goalRemaining = signal(0);
  buttons       = signal<number[]>([]);
  selected      = signal<boolean[]>([]);
  phase         = signal<GamePhase>('idle');

  private timer?: ReturnType<typeof setInterval>;
  private deadline         = 0;
  private extraTime        = 0;
  private winDetected      = false;
  private recordBeaten     = false;
  private highScoreAtStart = 0;

  get config() { return LEVEL_CONFIGS[this.level() - 1]; }
  get levelColor(): string { return this.config.color; }

  initGame(): void {
    this.stopTimer();
    const cfg = this.config;
    this.buttons.set(Array(cfg.buttonCount).fill(0));
    this.selected.set(Array(cfg.buttonCount).fill(false));
    this.score.set(0);
    this.countdown.set(cfg.timerTicks);
    this.goalRemaining.set(cfg.goalValue);
    this.extraTime        = 0;
    this.winDetected      = false;
    this.recordBeaten     = false;
    this.highScoreAtStart = this.storage.highScore;
    this.phase.set('idle');
  }

  refreshButtons(): void {
    if (!this.isTicking()) return;
    const cfg = this.config;
    this.buttons.set(this.newBoard(cfg));
    this.selected.set(Array(cfg.buttonCount).fill(false));
    this.goalRemaining.set(cfg.goalValue);
    this.audio.play('start');
  }

  startGame(): void {
    if (this.isTicking()) return;
    const cfg = this.config;
    this.score.set(0);
    this.countdown.set(cfg.timerTicks);
    this.goalRemaining.set(cfg.goalValue);
    this.selected.set(Array(cfg.buttonCount).fill(false));
    this.extraTime        = 0;
    this.winDetected      = false;
    this.recordBeaten     = false;
    this.highScoreAtStart = this.storage.highScore;
    this.buttons.set(this.newBoard(cfg));
    this.audio.play('start');
    this.phase.set('playing');
    this.isTicking.set(true);
    this.deadline = performance.now() + cfg.timerTicks * 100;
    this.startTimer();
  }

  pressButton(index: number): void {
    if (!this.isTicking()) return;
    const sel = this.selected();
    const val = this.buttons()[index];

    // Deselect an already-selected button
    if (sel[index]) {
      this.audio.play('press');
      const newSel = [...sel];
      newSel[index] = false;
      this.selected.set(newSel);
      this.goalRemaining.set(this.config.goalValue - this.sum());
      return;
    }

    // Tapping a value already in the selection clears everything
    if (this.currentValues().includes(val)) {
      this.audio.play('repeated');
      this.clearSelection();
      return;
    }

    this.audio.play('press');
    const newSel = [...sel];
    newSel[index] = true;
    this.selected.set(newSel);

    const total = this.sum();
    const goal  = this.config.goalValue;
    this.goalRemaining.set(goal - total);

    if (total > goal) {
      this.audio.play('repeated');
      this.clearSelection();
    } else if (total === goal) {
      this.audio.play('correct');
      this.awardPoints();
      this.replaceSelectedButtons();
      this.clearSelection();
    }
  }

  continueAfterWin(): void {
    this.phase.set('idle');
  }

  private awardPoints(): void {
    const pts = POINTS_BY_COUNT[this.currentValues().length] ?? 0;
    this.score.update(s => s + pts);
    this.extraTime += pts / POINTS_TO_EXTRA_TICK;
    // Pay out every whole second of accrued bonus time at once, so big combos
    // aren't quietly under-paid by a per-combo cap.
    let bonusTicks = 0;
    while (this.extraTime >= 1) {
      this.extraTime -= 1;
      bonusTicks += 10;
    }
    if (bonusTicks > 0) {
      this.deadline += bonusTicks * 100;
      this.countdown.set(this.remainingTicks());
    }
  }

  private replaceSelectedButtons(): void {
    const sel  = this.selected();
    const btns = [...this.buttons()];
    for (let i = 0; i < sel.length; i++) {
      if (sel[i]) btns[i] = this.rand();
    }
    this.ensureSolvable(btns, this.config.goalValue);
    this.buttons.set(btns);
  }

  private clearSelection(): void {
    this.selected.set(Array(this.config.buttonCount).fill(false));
    this.goalRemaining.set(this.config.goalValue);
  }

  private startTimer(): void {
    this.timer = setInterval(() => this.tick(), 100);
  }

  // Ticks (100ms units) left until the deadline, derived from real elapsed
  // time so a throttled or backgrounded tab can't gain time on the clock.
  private remainingTicks(): number {
    return Math.max(0, Math.ceil((this.deadline - performance.now()) / 100));
  }

  private tick(): void {
    const prev   = this.countdown();
    const now    = this.remainingTicks();
    const sc     = this.score();
    const lvl    = this.level();
    const target = this.config.scoreTarget;

    // Beep on each whole-second mark from 5s..1s. Crossing detection (rather
    // than exact equality) so a delayed tick that skips values still beeps.
    for (const mark of [50, 40, 30, 20, 10]) {
      if (prev > mark && now <= mark) { this.audio.play('beep'); break; }
    }

    this.countdown.set(now);

    if (now <= 0) {
      this.audio.play('beepEnd');
      this.stopTimer();
      this.handleTimerEnd(sc, lvl, target);
      return;
    }

    if (!this.winDetected && lvl !== 15 && sc >= target && sc !== 0) {
      this.winDetected = true;
      this.stopTimer();
      this.audio.play('levelup');
      this.advanceLevel();
      this.phase.set('won');
      return;
    }

    // Level 15 is endless: play a one-time cue when the stored record is
    // beaten, but defer persistence and the submission overlay to game end.
    if (lvl === 15 && !this.recordBeaten && sc > this.highScoreAtStart && sc !== 0) {
      this.recordBeaten = true;
      this.audio.play('levelup');
    }
  }

  private handleTimerEnd(sc: number, lvl: number, target: number): void {
    if (this.winDetected) return;

    if (lvl === 15 && sc > this.highScoreAtStart && sc !== 0) {
      this.storage.highScore   = sc;
      this.storage.uploadScore = true;
      this.phase.set('highscore');
    } else if (lvl !== 15 && sc >= target && sc !== 0) {
      this.advanceLevel();
      this.phase.set('won');
    } else {
      this.phase.set('again');
    }
  }

  private advanceLevel(): void {
    const cur = this.level();
    if (cur >= 15) return;
    const next = cur + 1;
    this.storage.setLevel(next);
    const cfg = LEVEL_CONFIGS[next - 1];
    this.buttons.set(Array(cfg.buttonCount).fill(0));
    this.selected.set(Array(cfg.buttonCount).fill(false));
    this.goalRemaining.set(cfg.goalValue);
    this.countdown.set(cfg.timerTicks);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.isTicking.set(false);
  }

  // Values of the currently selected buttons — derived from the signals so
  // there is a single source of truth (no separate array to keep in sync).
  private currentValues(): number[] {
    const btns = this.buttons();
    const sel  = this.selected();
    return btns.filter((_, i) => sel[i]);
  }

  private sum(): number {
    return this.currentValues().reduce((a, b) => a + b, 0);
  }

  private rand(): number {
    return Math.floor(Math.random() * 9) + 1;
  }

  // Builds a fresh board guaranteed to contain at least one valid combo, so
  // the player can never be dealt unsolvable numbers.
  private newBoard(cfg: LevelConfig): number[] {
    const btns = Array.from({ length: cfg.buttonCount }, () => this.rand());
    this.ensureSolvable(btns, cfg.goalValue);
    return btns;
  }

  // If no subset of the distinct values on the board sums to the goal, plant
  // one guaranteed combo over a few random positions. Mutates `btns` in place.
  // Only fires on the rare unsolvable board, so normal boards stay fully random.
  private ensureSolvable(btns: number[], goal: number): void {
    if (this.isSolvable(btns, goal)) return;
    const combo = this.makeCombo(goal);
    const idxs  = this.pickDistinctIndices(btns.length, combo.length);
    combo.forEach((v, i) => (btns[idxs[i]] = v));
  }

  // Can any subset of the distinct values present sum exactly to `goal`?
  // Values are 1..9, so the distinct set has at most 9 elements (subset-sum DP).
  private isSolvable(values: number[], goal: number): boolean {
    const reachable = new Array<boolean>(goal + 1).fill(false);
    reachable[0] = true;
    for (const v of new Set(values)) {
      for (let s = goal; s >= v; s--) {
        if (reachable[s - v]) reachable[s] = true;
      }
    }
    return reachable[goal];
  }

  // A set of distinct values (1..9) summing exactly to `goal`, built greedily
  // from 9 downward. Valid for every goal in this game's range (10..24).
  private makeCombo(goal: number): number[] {
    const combo: number[] = [];
    let remaining = goal;
    for (let v = 9; v >= 1 && remaining > 0; v--) {
      if (v <= remaining) { combo.push(v); remaining -= v; }
    }
    return combo;
  }

  // `count` distinct random indices in [0, length) via a partial Fisher–Yates.
  private pickDistinctIndices(length: number, count: number): number[] {
    const pool = Array.from({ length }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }
}
