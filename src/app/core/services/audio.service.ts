import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';

type SoundKey = 'beep' | 'beepEnd' | 'correct' | 'levelup' | 'press' | 'repeated' | 'start';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly storage = inject(StorageService);

  // Single source of truth — same signal StorageService persists to localStorage,
  // so the saved preference is honored on reload and after reset().
  readonly enabled = this.storage.soundEnabled;

  private ctx?: AudioContext;

  private get audioCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  play(sound: SoundKey): void {
    if (!this.enabled()) return;
    switch (sound) {
      case 'beep':     this.tone(880,  0.08, 'sine');      break;
      case 'beepEnd':  this.tone(220,  0.30, 'sawtooth');  break;
      case 'correct':  this.tone(1320, 0.15, 'sine');      break;
      case 'levelup':  this.chime();                       break;
      case 'press':    this.tone(660,  0.05, 'sine');      break;
      case 'repeated': this.tone(165,  0.15, 'square');    break;
      case 'start':    this.tone(528,  0.10, 'sine');      break;
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, at?: number): void {
    try {
      const ctx   = this.audioCtx;
      const start = at ?? ctx.currentTime;
      const osc   = ctx.createOscillator();
      const gain  = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    } catch { /* silent on autoplay policy errors */ }
  }

  private chime(): void {
    const ctx = this.audioCtx;
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.2, 'sine', ctx.currentTime + i * 0.12));
  }
}
