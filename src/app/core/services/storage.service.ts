import { Injectable, signal } from '@angular/core';
import { LEVEL_CONFIGS } from '../constants/level-config';

export type AppTheme = 'classic' | 'synthwave' | 'modern';

const K = {
  level:       'mn_level',
  sound:       'mn_sound',
  background:  'mn_background',
  highScore:   'mn_highScore',
  nickname:    'mn_nickname',
  uploadScore: 'mn_uploadScore',
  theme:       'mn_theme',
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly level         = signal(this.clampLevel(this.readInt(K.level, 1)));
  readonly soundEnabled  = signal(this.readBool(K.sound, true));
  readonly backgroundOn  = signal(this.readBool(K.background, true));
  readonly theme         = signal<AppTheme>((localStorage.getItem(K.theme) as AppTheme) ?? 'classic');

  setLevel(v: number): void {
    const lvl = this.clampLevel(v);
    this.level.set(lvl);
    localStorage.setItem(K.level, String(lvl));
  }

  setTheme(v: AppTheme): void {
    this.theme.set(v);
    localStorage.setItem(K.theme, v);
  }

  get sound(): boolean       { return this.soundEnabled(); }
  set sound(v: boolean)      { this.soundEnabled.set(v); localStorage.setItem(K.sound, String(v)); }

  get background(): boolean  { return this.backgroundOn(); }
  set background(v: boolean) { this.backgroundOn.set(v); localStorage.setItem(K.background, String(v)); }

  get highScore(): number    { return Math.max(0, this.readInt(K.highScore, 0)); }
  set highScore(v: number)   { localStorage.setItem(K.highScore, String(v)); }

  get nickname(): string     { return localStorage.getItem(K.nickname) ?? ''; }
  set nickname(v: string)    { localStorage.setItem(K.nickname, v); }

  get uploadScore(): boolean { return localStorage.getItem(K.uploadScore) === 'true'; }
  set uploadScore(v: boolean){ localStorage.setItem(K.uploadScore, String(v)); }

  reset(): void {
    const nick = this.nickname;
    const hs   = this.highScore;
    Object.values(K).forEach(k => localStorage.removeItem(k));
    this.setLevel(1);
    if (nick) this.nickname  = nick;
    if (hs)   this.highScore = hs;
    this.soundEnabled.set(true);
    this.backgroundOn.set(true);
  }

  private readInt(key: string, def: number): number {
    const n = parseInt(localStorage.getItem(key) ?? '', 10);
    return Number.isFinite(n) ? n : def;
  }

  // Keep the level within the valid range so a corrupt or out-of-range
  // localStorage value can never produce an undefined LevelConfig.
  private clampLevel(n: number): number {
    if (!Number.isFinite(n)) return 1;
    return Math.min(LEVEL_CONFIGS.length, Math.max(1, Math.floor(n)));
  }

  private readBool(key: string, def: boolean): boolean {
    const v = localStorage.getItem(key);
    return v === null ? def : v === 'true';
  }
}
