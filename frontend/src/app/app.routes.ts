import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  // Unauthenticated
  {
    path: '',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard],
  },
  // Authenticated – wrapped in sidebar layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent),
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
      },
      {
        path: 'memoretos',
        loadComponent: () => import('./pages/memoretos/memoretos.component').then(m => m.MemoretosComponent),
      },
      {
        path: 'memoretos/nuevo',
        loadComponent: () => import('./pages/memo-editor/memo-editor.component').then(m => m.MemoEditorComponent),
      },
      {
        path: 'memoretos/editar/:id',
        loadComponent: () => import('./pages/memo-editor/memo-editor.component').then(m => m.MemoEditorComponent),
      },
      {
        path: 'grupos',
        loadComponent: () => import('./pages/grupos/grupos.component').then(m => m.GruposComponent),
      },
      {
        path: 'grupos/nuevo',
        loadComponent: () => import('./pages/nuevo-grupo/nuevo-grupo.component').then(m => m.NuevoGrupoComponent),
      },
      {
        path: 'grupos/:id',
        loadComponent: () => import('./pages/grupo-detalle/grupo-detalle.component').then(m => m.GrupoDetalleComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
