import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';
import { StorageService } from '../../core/services/storage.service';
import { GameService } from '../../core/services/game.service';

@Component({
  selector: 'app-scores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scores.html',
  styleUrl: './scores.scss',
})
export class ScoresComponent {
  private readonly router   = inject(Router);
  private readonly firebase = inject(FirebaseService);
  readonly storage          = inject(StorageService);
  private readonly game     = inject(GameService);

  scores            = toSignal(this.firebase.getTopScores(), { initialValue: [] });
  firebaseAvailable = this.firebase.isAvailable;

  nickname      = signal(this.storage.nickname);
  submitting    = signal(false);
  submitted     = signal(false);
  nicknameError = signal('');

  readonly bgClass = this.game.bgClass;

  get canSubmit(): boolean {
    return this.game.level() === 15
        && this.storage.uploadScore
        && !this.storage.nickname
        && !this.submitted();
  }

  get highScore(): number { return this.storage.highScore; }

  async submit(): Promise<void> {
    const name = this.nickname().trim();
    if (!name || this.submitting()) return;
    this.submitting.set(true);
    this.nicknameError.set('');
    if (await this.firebase.nicknameExists(name)) {
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

  back(): void { this.router.navigate(['/home']); }
}
