import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { MemoCanvasComponent, figuraToShapes } from '../../components/memo-canvas/memo-canvas.component';

@Component({
  selector: 'app-memo-editor',
  standalone: true,
  imports: [FormsModule, MemoCanvasComponent],
  template: `
    <div class="page-content">
      @if (loading) {
        <p class="empty">...</p>
      } @else {
        <div class="editor-layout">

          <!-- Columna izquierda: metadatos -->
          <div class="editor-meta">
            <form (ngSubmit)="handleSave()" id="memo-form">

              <div class="field">
                <label>Título</label>
                <input [(ngModel)]="form.title" name="title" placeholder="Nombre del memoreto" required />
              </div>

              <div class="row">
                <div class="field">
                  <label>Nivel</label>
                  <input type="number" [(ngModel)]="form.nivel" name="nivel" min="1" />
                </div>
                <div class="field">
                  <label>Fase</label>
                  <input type="number" [(ngModel)]="form.fase" name="fase" min="1" />
                </div>
              </div>

              <div class="field">
                <label>Dificultad</label>
                <select [(ngModel)]="form.dificultad" name="dificultad">
                  <option value="easy">Fácil</option>
                  <option value="medium">Medio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div class="field">
                <label>Números disponibles (separados por coma)</label>
                <input [(ngModel)]="form.number_set" name="number_set" placeholder="1, 2, 3, 4" />
                <span style="font-size:.7rem;color:#64748b">
                  Conjunto actual: [{{ parsedNumberSet.join(', ') }}]
                </span>
              </div>

              <div class="field" style="flex-direction:row;align-items:center;gap:.5rem">
                <input type="checkbox" [(ngModel)]="form.is_published" name="is_published" id="pub" />
                <label for="pub" style="margin:0">Publicar — visible en Unity</label>
              </div>

              @if (canvasFigures.length > 0) {
                <div class="canvas-summary">
                  <div class="cs-title">Figuras en el canvas</div>
                  @for (f of canvasFigures; track f.id ?? $index) {
                    <div class="cs-row" [style.border-left]="'3px solid ' + f.color">
                      <span>{{ f.type }}</span>
                      <span style="color:#64748b">
                        {{ f.operacion === 'suma' ? 'Σ' : f.operacion === 'multiplicacion' ? '×' : '−' }}={{ f.target }}
                      </span>
                      <span style="color:#64748b;font-size:.75rem">nodos: [{{ f.nodos?.join(', ') }}]</span>
                    </div>
                  }
                </div>
              }

              @if (hasSolution) {
                <div class="solution-ready">✅ Solución verificada — listo para guardar</div>
              } @else if (canvasFigures.length > 0) {
                <div class="solution-pending">⚠️ Verifica la solución en el canvas antes de guardar</div>
              }

              @if (saveErr) { <p class="error-msg">{{ saveErr }}</p> }

              <div class="row" style="gap:.5rem;margin-top:.5rem">
                <button type="submit" form="memo-form" class="btn btn-full" [disabled]="saving">
                  {{ saving ? 'Guardando...' : hasSolution ? '💾 Guardar con solución' : 'Guardar borrador' }}
                </button>
                <button type="button" class="btn btn-outline btn-full" (click)="router.navigate(['/memoretos'])">
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          <!-- Columna derecha: canvas -->
          <div class="editor-canvas-col">
            <div class="editor-canvas-title">
              Editor visual de figuras
              <span class="editor-canvas-sub">Arrastra para crear · Superpón para intersecciones · Verifica solución</span>
            </div>
            <app-memo-canvas
              [numberSet]="parsedNumberSet"
              [initialShapes]="initialShapes"
              (canvasChange)="onCanvasChange($event)"
            />
          </div>

        </div>
      }
    </div>
  `,
})
export class MemoEditorComponent implements OnInit {
  id: string | null = null;
  get isEdit(): boolean { return !!this.id; }

  form = { title: '', nivel: 1, fase: 1, dificultad: 'easy', number_set: '1, 2, 3, 4', is_published: false };
  canvasFigures: any[] = [];
  canvasSolution: any = null;
  initialShapes: any[] = [];
  saving = false;
  loading = false;
  saveErr = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private auth: AuthService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.isEdit) {
      this.loading = true;
      try {
        const r = await this.api.getMemoreto(this.id!, this.auth.token);
        const m = r.data.memoreto;
        if (m) {
          this.form = {
            title: m.title, nivel: m.nivel, fase: m.fase || 1,
            dificultad: m.dificultad, is_published: m.is_published,
            number_set: (m.number_set || []).join(', '),
          };
          if (m.figuras?.some((f: any) => f._geo)) {
            this.initialShapes = figuraToShapes(m.figuras);
            this.canvasFigures = m.figuras;
          }
        }
      } catch (e) {
        console.error('memo-editor load error', e);
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  get parsedNumberSet(): number[] {
    return this.form.number_set
      .split(',')
      .map(n => Number(n.trim()))
      .filter(n => !isNaN(n) && n !== 0);
  }

  get hasSolution(): boolean {
    return !!this.canvasSolution && Object.keys(this.canvasSolution).length > 0;
  }

  onCanvasChange(e: { figures: any[], nodes: any[], solution: any }) {
    this.canvasFigures = e.figures;
    this.canvasSolution = e.solution;
    this.saveErr = '';
  }

  async handleSave() {
    if (!this.form.title.trim()) { this.saveErr = 'El título es obligatorio'; return; }
    if (this.canvasFigures.length === 0) { this.saveErr = 'Dibuja al menos una figura en el canvas'; return; }
    this.saving = true; this.saveErr = '';
    const body = {
      title: this.form.title, nivel: Number(this.form.nivel), fase: Number(this.form.fase),
      dificultad: this.form.dificultad, is_published: this.form.is_published,
      number_set: this.parsedNumberSet, figuras: this.canvasFigures,
      solution: this.canvasSolution || {},
    };
    const res = this.isEdit
      ? await this.api.updateMemoreto(this.id!, body, this.auth.token)
      : await this.api.createMemoreto(body, this.auth.token);
    this.saving = false;
    if (res.status === 200 || res.status === 201) {
      this.router.navigate(['/memoretos']);
    } else {
      this.saveErr = res.data.message || 'Error al guardar';
    }
  }
}
