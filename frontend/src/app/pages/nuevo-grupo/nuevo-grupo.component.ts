import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-nuevo-grupo',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-content" style="max-width:560px">
      <form (ngSubmit)="handleCreate()">
        <div class="field">
          <label>Nombre del grupo</label>
          <input [(ngModel)]="name" name="name" placeholder="Ej: TC2005B Gpo 441" autofocus />
        </div>
        @if (msg) {
          <p class="hint" style="color:#15803d;background:#f0fdf4;padding:.6rem .85rem;
             border-radius:var(--r-lg);border:1px solid #86efac;margin-bottom:.75rem">
            {{ msg }}
          </p>
        }
        <div class="row" style="gap:.75rem;margin-top:1.25rem">
          <button class="btn btn-full" type="submit" [disabled]="loading">
            {{ loading ? 'Creando...' : 'Guardar' }}
          </button>
          <button type="button" class="btn btn-outline btn-full"
                  (click)="router.navigate(['/grupos'])">Cancelar</button>
        </div>
      </form>
    </div>
  `,
})
export class NuevoGrupoComponent {
  name = ''; msg = ''; loading = false;

  constructor(private auth: AuthService, private api: ApiService, public router: Router) {}

  async handleCreate() {
    if (!this.name.trim()) return;
    this.loading = true;
    const res = await this.api.createGroup(this.name.trim(), this.auth.token);
    this.loading = false;
    if (res.status === 201) {
      this.msg = `Grupo creado — Código: ${res.data.group.code}`;
      setTimeout(() => this.router.navigate(['/grupos']), 1500);
    } else {
      this.msg = res.data.message || 'Error al crear grupo';
    }
  }
}
