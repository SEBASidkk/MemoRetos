import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [],
  template: `
    <div class="page-content" style="max-width:800px">
      <div>
        <button class="btn btn-full" style="margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem;justify-content:center"
                (click)="router.navigate(['/grupos/nuevo'])">
          <span class="material-symbols-outlined">group_add</span>
          Nuevo Grupo
        </button>
        @if (loading) {
          <p class="empty">Cargando...</p>
        } @else if (groups.length === 0) {
          <p class="empty">No has creado grupos.</p>
        } @else {
          <div class="card-list">
            @for (g of groups; track g.id) {
              <div class="level-card" (click)="router.navigate(['/grupos', g.id])">
                <div class="level-header">
                  <span class="level-title">{{ g.name }}</span>
                  <span class="badge small">Código: {{ g.code }}</span>
                </div>
                <div class="level-meta">
                  <span>{{ g.student_count }} estudiantes · {{ g.memoreto_count }} memoretos</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class GruposComponent implements OnInit {
  groups: any[] = [];
  loading = true;

  constructor(private auth: AuthService, private api: ApiService, public router: Router, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const r = await this.api.getMyGroups(this.auth.token);
      this.groups = r.data.groups || [];
    } catch (e) {
      console.error('grupos load error', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
