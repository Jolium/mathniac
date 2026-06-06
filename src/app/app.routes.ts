import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'game',
    loadComponent: () => import('./features/game/game').then(m => m.GameComponent),
  },
  {
    path: 'levels',
    loadComponent: () => import('./features/levels/levels').then(m => m.LevelsComponent),
  },
  {
    path: 'scores',
    loadComponent: () => import('./features/scores/scores').then(m => m.ScoresComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
  },
  {
    path: 'intro',
    loadComponent: () => import('./features/intro/intro').then(m => m.IntroComponent),
  },
  { path: '**', redirectTo: 'home' },
];
