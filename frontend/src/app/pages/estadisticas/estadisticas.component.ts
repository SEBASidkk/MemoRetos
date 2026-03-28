import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgStyle } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

const COLORS = ['#550042','#feae1e','#002a57','#76135d','#825500','#00407e','#f884cf','#ffb94e','#82adf3','#a8c8ff'];
const DIFS: Record<string,string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };
const DIF_COLOR: Record<string,string> = { easy: '#15803d', medium: '#825500', hard: '#ba1a1a' };

interface ChartEntry { label: string; value: number; color: string; }

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="page-content">
      @if (loading) {
        <p class="empty">Cargando...</p>
      } @else {
        <div class="dash-content">

          <!-- Tarjetas métricas -->
          <div class="dash-stats-row">
            <div class="dash-stat-card">
              <div class="dash-stat-top">
                <span class="dash-stat-label">Jugadores totales</span>
              </div>
              <div class="dash-stat-value">{{ total }}</div>
              <div class="dash-stat-foot"><span class="dash-stat-sub">Promedio {{ avg.toLocaleString() }} pts</span></div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-top">
                <span class="dash-stat-label">Puntuación promedio</span>
              </div>
              <div class="dash-stat-value" style="color:var(--tertiary)">{{ avg.toLocaleString() }}</div>
              <div class="dash-stat-foot"><span class="dash-stat-sub">Global</span></div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-top">
                <span class="dash-stat-label">Puntaje más alto</span>
              </div>
              <div class="dash-stat-value" style="color:var(--secondary)">{{ top.toLocaleString() }}</div>
              <div class="dash-stat-foot"><span class="dash-stat-sub">{{ users[0] ? '@' + users[0].username : '—' }}</span></div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-top">
                <span class="dash-stat-label">Mis memoretos</span>
              </div>
              <div class="dash-stat-value" style="color:#15803d">{{ memos.length }}</div>
              <div class="dash-stat-foot"><span class="dash-stat-sub">{{ published }} publicados</span></div>
            </div>
          </div>

          <!-- Área principal -->
          <div class="dash-main">

            <!-- Gráfica SVG -->
            <div class="dash-chart-card">
              <div class="dash-chart-header">
                <div class="dash-tabs">
                  <button [class.active]="tab === 'puntajes'" (click)="setTab('puntajes')">Puntajes</button>
                  <button [class.active]="tab === 'dificultad'" (click)="setTab('dificultad')">Por Dificultad</button>
                </div>
              </div>
              @if (chartData.length === 0) {
                <p class="empty">Sin datos para mostrar</p>
              } @else {
                <svg width="100%" [attr.height]="chartH + 40" style="overflow:visible">
                  @for (item of chartData; track item.label; let i = $index) {
                    <g>
                      <rect
                        [attr.x]="barX(i)"
                        [attr.y]="barY(item.value)"
                        [attr.width]="barW"
                        [attr.height]="barHeight(item.value)"
                        [attr.fill]="item.color"
                        rx="4"
                      />
                      <text
                        [attr.x]="barX(i) + barW / 2"
                        [attr.y]="chartH + 16"
                        text-anchor="middle"
                        font-size="10"
                        fill="#64748b"
                      >{{ item.label }}</text>
                    </g>
                  }
                </svg>
              }
            </div>

            <!-- Ranking lateral -->
            <div class="dash-ranking-card">
              <div class="dash-ranking-title">🏅 Ranking Global</div>
              <div class="dash-ranking-list">
                @for (u of users.slice(0, 7); track u.id; let i = $index) {
                  <div class="dash-rank-row">
                    <span class="dash-rank-pos">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }}</span>
                    <div class="dash-rank-info">
                      <span class="dash-rank-name">{{ u.name }} {{ u.lastname }}</span>
                      <span class="dash-rank-user">&#64;{{ u.username }}</span>
                    </div>
                    <span class="dash-rank-score">{{ u.total_score.toLocaleString() }}</span>
                  </div>
                }
                @if (users.length === 0) { <p class="empty">Sin datos</p> }
              </div>
            </div>
          </div>

          <!-- Fila inferior -->
          <div class="dash-bottom-row">
            <div class="dash-bottom-card">
              <div class="dash-card-title">Memoretos por Dificultad</div>
              @if (difEntries.length === 0) {
                <p class="empty">Sin memoretos</p>
              } @else {
                @for (e of difEntries; track e[0]) {
                  <div class="diff-row">
                    <span class="diff-label" [ngStyle]="{ color: difColor(e[0]) }">{{ difLabel(e[0]) }}</span>
                    <div class="diff-bar-track">
                      <div class="diff-bar-fill" [ngStyle]="{ width: pct(e[1]) + '%', background: difColor(e[0]) }"></div>
                    </div>
                    <span class="diff-count">{{ e[1] }}</span>
                  </div>
                }
              }
            </div>
            <div class="dash-bottom-card">
              <div class="dash-card-title">Estado de Publicación</div>
              <div class="memo-status-grid">
                <div class="memo-status-item">
                  <span class="memo-status-num" style="color:#15803d">{{ published }}</span>
                  <span class="memo-status-lbl">Publicados</span>
                </div>
                <div class="memo-status-item">
                  <span class="memo-status-num" style="color:var(--secondary)">{{ memos.length - published }}</span>
                  <span class="memo-status-lbl">Borradores</span>
                </div>
                <div class="memo-status-item">
                  <span class="memo-status-num">{{ memos.length }}</span>
                  <span class="memo-status-lbl">Total</span>
                </div>
              </div>
              @if (memos.length > 0) {
                <div class="pub-progress-track">
                  <div class="pub-progress-fill" [ngStyle]="{ width: pubPct + '%' }"></div>
                </div>
                <p class="pub-pct">{{ pubPct }}% publicado</p>
              }
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    svg text { fill: var(--on-surface-variant); }
  `],
})
export class EstadisticasComponent implements OnInit {
  users: any[] = [];
  memos: any[] = [];
  loading = true;
  tab: 'puntajes' | 'dificultad' = 'puntajes';

  chartH = 220;
  barPad = 8;

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const [rk, mm] = await Promise.all([
        this.api.globalRanking(this.auth.token),
        this.api.getMyMemoretos(this.auth.token),
      ]);
      this.users = rk.data.ranking || [];
      this.memos = mm.data.memoretos || [];
    } catch (e) {
      console.error('estadisticas load error', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  get total(): number { return this.users.length; }
  get avg(): number {
    return this.total ? Math.round(this.users.reduce((s, u) => s + u.total_score, 0) / this.total) : 0;
  }
  get top(): number { return this.users[0]?.total_score || 0; }
  get published(): number { return this.memos.filter((m: any) => m.is_published).length; }
  get pubPct(): number { return this.memos.length ? Math.round((this.published / this.memos.length) * 100) : 0; }

  get difCount(): Record<string, number> {
    return this.memos.reduce((acc: any, m: any) => {
      acc[m.dificultad] = (acc[m.dificultad] || 0) + 1;
      return acc;
    }, {});
  }
  get difEntries(): [string, number][] { return Object.entries(this.difCount); }

  get chartData(): ChartEntry[] {
    if (this.tab === 'puntajes') {
      return [...this.users]
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 10)
        .map((u, i) => ({ label: u.username.slice(0, 8), value: u.total_score, color: COLORS[i % COLORS.length] }));
    }
    return Object.entries(this.difCount).map(([k, v]) => ({
      label: DIFS[k] || k, value: v, color: DIF_COLOR[k] || '#3b82f6',
    }));
  }

  get barW(): number {
    const n = this.chartData.length;
    return n ? Math.min(52, (400 - this.barPad * (n + 1)) / n) : 40;
  }

  private get maxVal(): number {
    return Math.max(...this.chartData.map(d => d.value), 1);
  }

  barX(i: number): number {
    return this.barPad + i * (this.barW + this.barPad);
  }

  barHeight(val: number): number {
    return Math.max(4, (val / this.maxVal) * this.chartH);
  }

  barY(val: number): number {
    return this.chartH - this.barHeight(val);
  }

  setTab(t: 'puntajes' | 'dificultad') { this.tab = t; this.cdr.detectChanges(); }

  difLabel(k: string): string { return DIFS[k] || k; }
  difColor(k: string): string { return DIF_COLOR[k] || '#94a3b8'; }
  pct(cnt: number): number { return this.memos.length ? Math.round((cnt / this.memos.length) * 100) : 0; }
}
