import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-grupo-detalle',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (!group) {
      <p class="empty">Cargando...</p>
    } @else {
      <div class="page-content" style="max-width:800px">
        <div>
          <div class="group-code-bar">
            <span>Código de acceso:</span>
            <span class="code-display">{{ group.code }}</span>
          </div>

          <div class="dash-tabs" style="width:fit-content;margin-bottom:1.25rem">
            <button [class.active]="tab === 'personas'" (click)="setTab('personas')">
              Personas ({{ students.length }})
            </button>
            <button [class.active]="tab === 'tareas'" (click)="setTab('tareas')">
              Tareas ({{ memos.length }})
            </button>
          </div>

          @if (tab === 'personas') {
            <div class="card-list">
              @if (students.length === 0) {
                <p class="empty">Sin estudiantes. Comparte el código para que se unan.</p>
              } @else {
                @for (s of students; track s.id) {
                  <div class="simple-row">
                    <span>{{ s.name }} {{ s.lastname }}</span>
                    <span style="font-size:.78rem;color:var(--on-surface-variant)">&#64;{{ s.username }}</span>
                    <span style="font-size:.83rem;font-weight:700;color:var(--secondary)">{{ s.total_score }} pts</span>
                  </div>
                }
              }
            </div>
          }

          @if (tab === 'tareas') {
            <div class="assign-section">
              <h4>Asignar memoreto</h4>
              <div class="row" style="align-items:flex-end">
                <div class="field" style="flex:1">
                  <select [(ngModel)]="selMemo">
                    <option value="">Seleccionar...</option>
                    @for (m of available; track m.id) {
                      <option [value]="m.id">{{ m.title }} ({{ m.dificultad }})</option>
                    }
                  </select>
                </div>
                <button class="btn btn-sm" (click)="handleAssign()" [disabled]="!selMemo">Asignar</button>
              </div>
              @if (msg) { <p class="hint">{{ msg }}</p> }
            </div>

            <div class="card-list" style="margin-top:.75rem">
              @if (memos.length === 0) {
                <p class="empty">Sin memoretos asignados.</p>
              } @else {
                @for (m of memos; track m.id) {
                  <div class="simple-row">
                    <span>{{ m.title }}</span>
                    <span class="badge small">{{ m.dificultad }}</span>
                    <button class="btn btn-sm btn-danger" (click)="handleRemove(m.id)">Quitar</button>
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`:host { display: block; }`],
})
export class GrupoDetalleComponent implements OnInit {
  id!: string;
  group: any = null;
  students: any[] = [];
  memos: any[] = [];
  allMemos: any[] = [];
  tab: 'personas' | 'tareas' = 'personas';
  selMemo = '';
  msg = '';

  constructor(private route: ActivatedRoute, private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.fetchData();
  }

  async fetchData() {
    try {
      const [g, st, mm, all] = await Promise.all([
        this.api.getGroup(this.id, this.auth.token),
        this.api.getGroupStudents(this.id, this.auth.token),
        this.api.getGroupMemoretos(this.id, this.auth.token),
        this.api.getMyMemoretos(this.auth.token),
      ]);
      this.group = g.data.group;
      this.students = st.data.students || [];
      this.memos = mm.data.memoretos || [];
      this.allMemos = all.data.memoretos || [];
    } catch (e) {
      console.error('grupo-detalle load error', e);
    } finally {
      this.cdr.detectChanges();
    }
  }

  get available(): any[] {
    return this.allMemos.filter(m => !this.memos.some(am => am.id === m.id));
  }

  setTab(t: 'personas' | 'tareas') { this.tab = t; this.cdr.detectChanges(); }

  async handleAssign() {
    if (!this.selMemo) return;
    const res = await this.api.assignMemoreto(this.id, Number(this.selMemo), this.auth.token);
    this.msg = res.status === 201 ? 'Memoreto asignado' : (res.data.message || 'Error al asignar');
    this.fetchData();
  }

  async handleRemove(memoId: number) {
    await this.api.removeMemoretoFromGroup(this.id, memoId, this.auth.token);
    this.fetchData();
  }
}
