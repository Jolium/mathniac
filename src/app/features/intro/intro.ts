import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { GameService } from '../../core/services/game.service';
import { MnTitleComponent } from '../../shared/components/mn-title/mn-title';
import { MnButtonComponent } from '../../shared/components/mn-button/mn-button';

@Component({
  selector: 'app-intro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MnTitleComponent, MnButtonComponent],
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class IntroComponent {
  private readonly location = inject(Location);
  private readonly game     = inject(GameService);

  readonly bgClass = this.game.bgClass;

  back(): void { this.location.back(); }
}
