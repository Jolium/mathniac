import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { GameService } from '../../core/services/game.service';
import { APP_VERSION } from '../../core/constants/version';
import { MnTitleComponent } from '../../shared/components/mn-title/mn-title';
import { MnButtonComponent } from '../../shared/components/mn-button/mn-button';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MnTitleComponent, MnButtonComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private readonly router = inject(Router);
  readonly storage        = inject(StorageService);
  private readonly game   = inject(GameService);

  readonly bgClass  = this.game.bgClass;
  readonly version  = APP_VERSION;

  toggleSound(): void {
    this.storage.sound = !this.storage.soundEnabled();
  }

  toggleBackground(): void {
    this.storage.background = !this.storage.backgroundOn();
  }

  reset(): void {
    if (!confirm('Reset progress to Level 1? Your nickname and high score will be kept.')) return;
    this.storage.reset();
    this.game.initGame();
  }

  back(): void { this.router.navigate(['/home']); }
}
