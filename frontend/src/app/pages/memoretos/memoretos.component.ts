import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

const DIF: Record<string, string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };
const DIF_C: Record<string, string> = { easy: '#15803d', medium: '#825500', hard: '#ba1a1a' };

@Component({
  selector: 'app-memoretos',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="page-content" style="max-width:800px">
      <div>
        <button class="btn btn-full" style="margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem;justify-content:center"
                (click)="router.navigate(['/memoretos/nuevo'])">
          <span class="material-symbols-outlined">add_circle</span>
          Nuevo Memoreto
        </button>
        @if (loading) {
          <p class="empty">Cargando...</p>
        } @else if (memos.length === 0) {
          <p class="empty">No has creado memoretos aún.</p>
        } @else {
          <div class="card-list">
            @for (m of memos; track m.id) {
              <div class="level-card">
                <div class="level-header">
                  <span class="level-title">{{ m.title }}</span>
                  <span class="dif-badge" [ngStyle]="{ background: difColor(m.dificultad) }">{{ difLabel(m.dificultad) }}</span>
                </div>
                <div class="level-meta">
                  <span>Nivel {{ m.nivel }}</span>
                  @if (m.fase) { <span> · Fase {{ m.fase }}</span> }
                  <span> · {{ m.is_published ? 'Publicado' : '📝 Borrador' }}</span>
                </div>
                <div class="card-actions">
                  <button class="btn btn-sm" (click)="router.navigate(['/memoretos/editar', m.id])">Editar</button>
                  <button class="btn btn-sm btn-outline" (click)="togglePublish(m)">
                    {{ m.is_published ? 'Despublicar' : 'Publicar' }}
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="handleDelete(m.id)">Borrar</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class MemoretosComponent implements OnInit {
  memos: any[] = [];
  loading = true;

  constructor(private auth: AuthService, private api: ApiService, public router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.fetch(); }

  async fetch() {
    try {
      const r = await this.api.getMyMemoretos(this.auth.token);
      this.memos = r.data.memoretos || [];
    } catch (e) {
      console.error('memoretos load error', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async handleDelete(id: number) {
    if (!confirm('¿Eliminar este memoreto?')) return;
    await this.api.deleteMemoreto(id, this.auth.token);
    this.fetch();
  }

  async togglePublish(m: any) {
    await this.api.updateMemoreto(m.id, { is_published: !m.is_published }, this.auth.token);
    this.fetch();
  }

  difLabel(d: string): string { return DIF[d] || d; }
  difColor(d: string): string { return DIF_C[d] || '#94a3b8'; }
}
