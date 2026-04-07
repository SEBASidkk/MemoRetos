import { useState } from 'react';
import PlotlyChart from './PlotlyChart';
import type * as Plotly from 'plotly.js';

const DIFS: Record<string, string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };
const DIF_COLOR: Record<string, string> = { easy: '#15803d', medium: '#825500', hard: '#ba1a1a' };
const LINE_COLORS = ['#550042','#feae1e','#002a57','#76135d','#825500','#00407e','#f884cf','#ffb94e','#82adf3','#a8c8ff'];
const BAR_COLORS = ['#550042','#feae1e','#002a57','#76135d','#825500','#00407e','#f884cf','#ffb94e','#82adf3','#a8c8ff'];

interface User { id: number; name: string; lastname: string; username: string; total_score: number; }
interface Memo { id: number; dificultad: string; is_published: boolean; }
interface ScatterPoint { dificultad: string; time_seconds: number; score: number; username: string; memoreto: string; }
type ProgresoData = Record<string, { date: string; score_acumulado: number }[]>;

interface Props {
  users: User[];
  memos: Memo[];
  scatter: ScatterPoint[];
  progreso: ProgresoData;
}

export default function EstadisticasPage({ users, memos, scatter, progreso }: Props) {
  const [tab, setTab] = useState<'puntajes' | 'dificultad'>('puntajes');
  const chartH = 220;
  const barPad = 8;

  const total = users.length;
  const avg = total ? Math.round(users.reduce((s, u) => s + u.total_score, 0) / total) : 0;
  const top = users[0]?.total_score || 0;
  const published = memos.filter(m => m.is_published).length;
  const pubPct = memos.length ? Math.round((published / memos.length) * 100) : 0;

  const difCount = memos.reduce<Record<string, number>>((acc, m) => {
    acc[m.dificultad] = (acc[m.dificultad] || 0) + 1;
    return acc;
  }, {});
  const difEntries = Object.entries(difCount);

  const chartData = tab === 'puntajes'
    ? [...users].sort((a, b) => b.total_score - a.total_score).slice(0, 10)
        .map((u, i) => ({ label: u.username.slice(0, 8), value: u.total_score, color: BAR_COLORS[i % BAR_COLORS.length] }))
    : Object.entries(difCount).map(([k, v]) => ({ label: DIFS[k] || k, value: v, color: DIF_COLOR[k] || '#550042' }));

  const n = chartData.length;
  const barW = n ? Math.min(52, (400 - barPad * (n + 1)) / n) : 40;
  const maxVal = Math.max(...chartData.map(d => d.value), 1);
  const barX = (i: number) => barPad + i * (barW + barPad);
  const barH = (val: number) => Math.max(4, (val / maxVal) * chartH);
  const barY = (val: number) => chartH - barH(val);

  // Scatter traces
  const groups: Record<string, { x: number[]; y: number[]; text: string[] }> = {};
  for (const d of scatter) {
    const key = d.dificultad || 'desconocido';
    if (!groups[key]) groups[key] = { x: [], y: [], text: [] };
    groups[key].x.push(d.time_seconds);
    groups[key].y.push(d.score);
    groups[key].text.push(`${d.username} · ${d.memoreto}`);
  }
  const colorMap: Record<string, string> = { easy: '#15803d', medium: '#825500', hard: '#ba1a1a' };
  const scatterTraces: Plotly.Data[] = Object.entries(groups).map(([dif, vals]) => ({
    type: 'scatter', mode: 'markers',
    name: DIFS[dif] || dif,
    x: vals.x, y: vals.y, text: vals.text,
    hovertemplate: '<b>%{text}</b><br>Tiempo: %{x}s<br>Puntuación: %{y}<extra></extra>',
    marker: { size: 8, color: colorMap[dif] || '#550042', opacity: 0.8 },
  } as Plotly.Data));

  // Progreso traces
  const progresoTraces: Plotly.Data[] = Object.entries(progreso).map(([username, entries], i) => ({
    type: 'scatter', mode: 'lines+markers',
    name: username,
    x: entries.map(e => e.date),
    y: entries.map(e => e.score_acumulado),
    hovertemplate: `<b>${username}</b><br>%{x}<br>Acumulado: %{y} pts<extra></extra>`,
    line: { color: LINE_COLORS[i % LINE_COLORS.length], width: 2 },
    marker: { size: 5, color: LINE_COLORS[i % LINE_COLORS.length] },
  } as Plotly.Data));

  return (
    <div className="page-content">
      {/* Tarjetas métricas */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Jugadores totales</span></div>
          <div className="dash-stat-value">{total}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">Promedio {avg.toLocaleString()} pts</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Puntuación promedio</span></div>
          <div className="dash-stat-value" style={{ color: 'var(--tertiary)' }}>{avg.toLocaleString()}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">Global</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Puntaje más alto</span></div>
          <div className="dash-stat-value" style={{ color: 'var(--secondary)' }}>{top.toLocaleString()}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">{users[0] ? '@' + users[0].username : '—'}</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Mis memoretos</span></div>
          <div className="dash-stat-value" style={{ color: '#15803d' }}>{memos.length}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">{published} publicados</span></div>
        </div>
      </div>

      {/* Barchart + Ranking */}
      <div className="dash-main">
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <div className="dash-tabs">
              <button className={tab === 'puntajes' ? 'active' : ''} onClick={() => setTab('puntajes')}>Puntajes</button>
              <button className={tab === 'dificultad' ? 'active' : ''} onClick={() => setTab('dificultad')}>Por Dificultad</button>
            </div>
          </div>
          {chartData.length === 0 ? (
            <p className="empty">Sin datos para mostrar</p>
          ) : (
            <svg width="100%" height={chartH + 40} style={{ overflow: 'visible' }}>
              {chartData.map((item, i) => (
                <g key={item.label}>
                  <rect x={barX(i)} y={barY(item.value)} width={barW} height={barH(item.value)} fill={item.color} rx={4} />
                  <text x={barX(i) + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={10} fill="var(--on-surface-variant)">
                    {item.label}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>

        <div className="dash-ranking-card">
          <div className="dash-ranking-title">🏅 Ranking Global</div>
          <div className="dash-ranking-list">
            {users.slice(0, 7).map((u, i) => (
              <div key={u.id} className="dash-rank-row">
                <span className="dash-rank-pos">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <div className="dash-rank-info">
                  <span className="dash-rank-name">{u.name} {u.lastname}</span>
                  <span className="dash-rank-user">@{u.username}</span>
                </div>
                <span className="dash-rank-score">{u.total_score.toLocaleString()}</span>
              </div>
            ))}
            {users.length === 0 && <p className="empty">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-bottom-row" style={{ marginBottom: '2rem' }}>
        <div className="dash-bottom-card">
          <div className="dash-card-title">Memoretos por Dificultad</div>
          {difEntries.length === 0 ? <p className="empty">Sin memoretos</p> : difEntries.map(([k, v]) => (
            <div key={k} className="diff-row">
              <span className="diff-label" style={{ color: DIF_COLOR[k] }}>{DIFS[k] || k}</span>
              <div className="diff-bar-track">
                <div className="diff-bar-fill" style={{ width: `${memos.length ? Math.round((v / memos.length) * 100) : 0}%`, background: DIF_COLOR[k] }} />
              </div>
              <span className="diff-count">{v}</span>
            </div>
          ))}
        </div>
        <div className="dash-bottom-card">
          <div className="dash-card-title">Estado de Publicación</div>
          <div className="memo-status-grid">
            <div className="memo-status-item">
              <span className="memo-status-num" style={{ color: '#15803d' }}>{published}</span>
              <span className="memo-status-lbl">Publicados</span>
            </div>
            <div className="memo-status-item">
              <span className="memo-status-num" style={{ color: 'var(--secondary)' }}>{memos.length - published}</span>
              <span className="memo-status-lbl">Borradores</span>
            </div>
            <div className="memo-status-item">
              <span className="memo-status-num">{memos.length}</span>
              <span className="memo-status-lbl">Total</span>
            </div>
          </div>
          {memos.length > 0 && (
            <>
              <div className="pub-progress-track">
                <div className="pub-progress-fill" style={{ width: `${pubPct}%` }} />
              </div>
              <p className="pub-pct">{pubPct}% publicado</p>
            </>
          )}
        </div>
      </div>

      {/* Scatter plot */}
      <div className="dash-plotly-section">
        <div className="dash-plotly-card">
          <div className="dash-plotly-header">
            <span className="material-symbols-outlined dash-plotly-icon">scatter_plot</span>
            <div>
              <div className="dash-card-title" style={{ marginBottom: '.25rem' }}>Tiempo vs Puntuación por Dificultad</div>
              <p className="dash-plotly-desc">Cada punto es un intento resuelto. Eje X: tiempo empleado (seg), Eje Y: puntuación.</p>
            </div>
          </div>
          {scatter.length === 0 ? <p className="empty">Sin datos de intentos resueltos</p> : (
            <PlotlyChart data={scatterTraces} height={340} title="Tiempo vs Puntuación"
              layout={{ xaxis: { title: { text: 'Tiempo (segundos)' } } as Plotly.LayoutAxis, yaxis: { title: { text: 'Puntuación' } } as Plotly.LayoutAxis }} />
          )}
        </div>
      </div>

      {/* Progreso line */}
      <div className="dash-plotly-section">
        <div className="dash-plotly-card">
          <div className="dash-plotly-header">
            <span className="material-symbols-outlined dash-plotly-icon">show_chart</span>
            <div>
              <div className="dash-card-title" style={{ marginBottom: '.25rem' }}>Progreso de Puntaje Acumulado por Estudiante</div>
              <p className="dash-plotly-desc">Evolución del puntaje acumulado de cada estudiante a lo largo del tiempo.</p>
            </div>
          </div>
          {progresoTraces.length === 0 ? <p className="empty">Sin datos de progreso de estudiantes</p> : (
            <PlotlyChart data={progresoTraces} height={340} title="Progreso acumulado"
              layout={{ xaxis: { title: { text: 'Fecha' }, type: 'date' } as Plotly.LayoutAxis, yaxis: { title: { text: 'Puntaje Acumulado' } } as Plotly.LayoutAxis }} />
          )}
        </div>
      </div>

      <style>{`
        .dash-plotly-section { margin-bottom: 1.5rem; }
        .dash-plotly-card { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--r-xl); padding: 1.5rem; }
        .dash-plotly-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
        .dash-plotly-icon { font-size: 1.75rem; color: var(--primary); background: rgba(85,0,66,.08); padding: .5rem; border-radius: var(--r-lg); flex-shrink: 0; }
        .dash-plotly-desc { font-size: .8rem; color: var(--on-surface-variant); line-height: 1.5; }
      `}</style>
    </div>
  );
}
