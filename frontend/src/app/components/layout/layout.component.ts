import { Component } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';
import { Location } from '@angular/common';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AuthService } from '../../services/auth.service';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':    'Panel Principal',
  '/estadisticas': 'Estadísticas',
  '/memoretos':    'Mis Memoretos',
  '/grupos':       'Grupos',
  '/configuracion':'Configuración',
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SideNavComponent],
  template: `
    <div class="app-layout">
      <app-side-nav />
      <div class="app-shell">
        <!-- Top Bar -->
        <header class="app-topbar">
          <div class="app-topbar-left">
            @if (showBack) {
              <button class="topbar-back-btn" (click)="goBack()" title="Volver">
                <span class="material-symbols-outlined">arrow_back</span>
              </button>
            }
            <h2 class="app-topbar-title">{{ pageTitle }}</h2>
          </div>
          <div class="app-topbar-actions">
            <button class="topbar-icon-btn" title="Notificaciones">
              <span class="material-symbols-outlined">notifications</span>
            </button>
            <button class="topbar-icon-btn" title="Ayuda">
              <span class="material-symbols-outlined">help</span>
            </button>
            <div class="topbar-avatar" title="{{ auth.user?.name }}">
              {{ initials }}
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="app-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent {
  pageTitle = 'Panel Principal';
  showBack = false;

  constructor(
    public auth: AuthService,
    private router: Router,
    private location: Location,
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
    ).subscribe(() => {
      const url = this.router.url.split('?')[0];
      this.pageTitle = ROUTE_TITLES[url] || this.titleFromUrl(url);
      this.showBack = !ROUTE_TITLES[url] && url !== '/dashboard';
    });
  }

  get initials(): string {
    const u = this.auth.user;
    if (!u) return '?';
    return `${u.name?.[0] ?? ''}${u.lastname?.[0] ?? ''}`.toUpperCase();
  }

  goBack() { this.location.back(); }

  private titleFromUrl(url: string): string {
    if (url.startsWith('/memoretos/nuevo')) return 'Nuevo Memoreto';
    if (url.startsWith('/memoretos/editar')) return 'Editar Memoreto';
    if (url.startsWith('/grupos/nuevo')) return 'Nuevo Grupo';
    if (url.startsWith('/grupos/')) return 'Detalle del Grupo';
    return 'UNAE Digital';
  }
}
