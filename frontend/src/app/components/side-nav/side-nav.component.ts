import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const NAV_ITEMS = [
  { label: 'Panel General',     icon: 'dashboard',   to: '/dashboard' },
  { label: 'Mis Alumnos',       icon: 'group',       to: '/grupos' },
  { label: 'Retos Matemáticos', icon: 'functions',   to: '/memoretos' },
  { label: 'Estadísticas',      icon: 'leaderboard', to: '/estadisticas' },
  { label: 'Configuración',     icon: 'settings',    to: '/configuracion' },
];

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="side-nav">
      <!-- Brand -->
      <div class="side-nav-brand">
        <h1>UNAE Digital</h1>
        <span class="brand-sub">MemoRetos · Panel Docente</span>
      </div>

      <!-- User -->
      <div class="side-nav-user">
        <div class="side-nav-avatar">
          <span class="material-symbols-outlined">person</span>
        </div>
        <div class="side-nav-user-info">
          <p class="user-role">{{ auth.user?.rol || 'Docente' }}</p>
          <p class="user-dept">{{ auth.user?.name }} {{ auth.user?.lastname }}</p>
        </div>
      </div>

      <!-- Nav Items -->
      <span class="side-nav-section-label">Navegación</span>
      <nav>
        @for (item of navItems; track item.to) {
          <a [routerLink]="item.to"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.to === '/dashboard' }">
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- Logout -->
      <div class="side-nav-footer">
        <button (click)="logout()">
          <span class="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  `,
})
export class SideNavComponent {
  navItems = NAV_ITEMS;

  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
