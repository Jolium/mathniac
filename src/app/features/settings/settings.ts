import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { StorageService } from '../../core/services/storage.service';
import { GameService } from '../../core/services/game.service';
import { APP_VERSION } from '../../core/constants/version';
import { AppTheme } from '../../core/services/storage.service';
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
  private readonly location = inject(Location);
  readonly storage          = inject(StorageService);
  private readonly game   = inject(GameService);

  readonly bgClass  = this.game.bgClass;
  readonly version  = APP_VERSION;

  showResetConfirm = signal(false);
  readonly resetBg = 'linear-gradient(135deg, #330000 0%, #880000 25%, #cc0000 50%, #880000 75%, #330000 100%)';

  setTheme(t: AppTheme): void { this.storage.setTheme(t); }

  toggleSound(): void {
    this.storage.sound = !this.storage.soundEnabled();
  }

  toggleBackground(): void {
    this.storage.background = !this.storage.backgroundOn();
  }

  reset(): void      { this.showResetConfirm.set(true); }
  cancelReset(): void { this.showResetConfirm.set(false); }

  confirmReset(): void {
    this.storage.reset();
    this.game.initGame();
    this.showResetConfirm.set(false);
  }

  back(): void { this.location.back(); }
}
