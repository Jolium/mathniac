import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (updateReady()) {
      <div class="update-banner">
        <span>A new version is available.</span>
        <button type="button" (click)="reload()">Reload</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .update-banner {
      position: fixed;
      left: 50%;
      bottom: 16px;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 90%;
      padding: 12px 18px;
      border-radius: 12px;
      background: rgba(10, 10, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      font-family: 'Courgette', cursive;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }
    .update-banner button {
      appearance: none;
      border: 2px solid #ffd700;
      background: linear-gradient(135deg, #ffd700, #ffa500);
      color: #000;
      border-radius: 8px;
      padding: 6px 14px;
      font-family: inherit;
      font-weight: bold;
      cursor: pointer;
    }
  `],
})
export class AppComponent {
  private readonly updates = inject(SwUpdate);
  readonly updateReady = signal(false);

  constructor() {
    // Only active in production builds where the service worker is enabled.
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.subscribe(e => {
        if (e.type === 'VERSION_READY') this.updateReady.set(true);
      });
    }
  }

  reload(): void {
    this.updates.activateUpdate().then(() => document.location.reload());
  }
}
