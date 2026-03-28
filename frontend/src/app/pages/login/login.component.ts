import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="auth-card">

        <!-- Logos -->
        <div class="auth-logos">
          <div class="logo-pill"><img src="/logo.png" alt="UNAE" /></div>
          <div class="logo-pill"><img src="/logotec.jpg" alt="Tec de Monterrey" /></div>
        </div>

        <!-- Headline -->
        <div class="auth-headline">
          <h1>MemoRetos</h1>
          <p>Panel de Administración Docente</p>
        </div>

        <!-- Card -->
        <div class="auth-panel">
          <!-- Tabs -->
          <div class="auth-tabs">
            <button class="auth-tab" [class.active]="mode === 'login'"
                    (click)="switchMode('login')">Iniciar Sesión</button>
            <button class="auth-tab" [class.active]="mode === 'register'"
                    (click)="switchMode('register')">Registrarse</button>
          </div>

          @if (mode === 'login') {
            <form (ngSubmit)="handleLogin()">
              <div class="auth-field">
                <span class="auth-field-icon material-symbols-outlined">person</span>
                <input class="auth-input" [(ngModel)]="username" name="username"
                       placeholder="Usuario" autocomplete="username" />
              </div>
              <div class="auth-field">
                <span class="auth-field-icon material-symbols-outlined">lock</span>
                <input type="password" class="auth-input" [(ngModel)]="password"
                       name="password" placeholder="Contraseña" autocomplete="current-password" />
              </div>
              @if (error) { <p class="auth-error">{{ error }}</p> }
              <button class="auth-btn" type="submit" [disabled]="loading">
                {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
              </button>
            </form>
          } @else {
            <form (ngSubmit)="handleRegister()">
              <div class="auth-row">
                <div class="auth-field">
                  <input class="auth-input no-icon" [(ngModel)]="regName"
                         name="regName" placeholder="Nombre" />
                </div>
                <div class="auth-field">
                  <input class="auth-input no-icon" [(ngModel)]="regLastname"
                         name="regLastname" placeholder="Apellido" />
                </div>
              </div>
              <div class="auth-field">
                <span class="auth-field-icon material-symbols-outlined">person</span>
                <input class="auth-input" [(ngModel)]="regUsername"
                       name="regUsername" placeholder="Usuario" />
              </div>
              <div class="auth-field">
                <span class="auth-field-icon material-symbols-outlined">mail</span>
                <input type="email" class="auth-input" [(ngModel)]="regEmail"
                       name="regEmail" placeholder="Correo electrónico" />
              </div>
              <div class="auth-field">
                <span class="auth-field-icon material-symbols-outlined">lock</span>
                <input type="password" class="auth-input" [(ngModel)]="regPassword"
                       name="regPassword" placeholder="Contraseña" autocomplete="new-password" />
              </div>
              @if (error) { <p class="auth-error">{{ error }}</p> }
              <button class="auth-btn" type="submit" [disabled]="loading">
                {{ loading ? 'Registrando...' : 'Crear cuenta' }}
              </button>
            </form>
          }
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  mode: 'login' | 'register' = 'login';
  username = ''; password = '';
  regName = ''; regLastname = ''; regUsername = ''; regEmail = ''; regPassword = '';
  error = ''; loading = false;

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  switchMode(m: 'login' | 'register') { this.mode = m; this.error = ''; }

  async handleLogin() {
    this.error = ''; this.loading = true;
    const res = await this.api.login(this.username, this.password);
    this.loading = false;
    if (res.data.token) {
      this.auth.saveAuth(res.data.token, res.data.user);
      this.router.navigate(['/dashboard']);
    } else {
      this.error = res.data.message || 'Credenciales incorrectas';
    }
  }

  async handleRegister() {
    this.error = ''; this.loading = true;
    const res = await this.api.register({
      name: this.regName, lastname: this.regLastname,
      username: this.regUsername, email: this.regEmail,
      password: this.regPassword, rol: 'docente',
    });
    this.loading = false;
    if (res.data.token) {
      this.auth.saveAuth(res.data.token, res.data.user);
      this.router.navigate(['/dashboard']);
    } else {
      this.error = res.data.message || 'Error al registrar';
    }
  }
}
