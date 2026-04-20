import { useState, useMemo } from 'react';
import PlotlyChart from './PlotlyChart';
import type * as Plotly from 'plotly.js';

const DIFS: Record<string, string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };
const DIF_COLOR: Record<string, string> = { easy: '#15803d', medium: '#b45309', hard: '#ba1a1a' };
const LINE_COLORS = ['#550042','#feae1e','#002a57','#76135d','#825500','#00407e','#f884cf','#ffb94e','#82adf3','#a8c8ff'];

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

const LAYOUT_BASE: Partial<Plotly.Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
  margin: { t: 10, r: 16, b: 50, l: 56 },
  legend: { bgcolor: 'transparent', font: { color: '#94a3b8' } },
  xaxis: { gridcolor: '#1e293b', zerolinecolor: '#1e293b' } as Partial<Plotly.LayoutAxis>,
  yaxis: { gridcolor: '#1e293b', zerolinecolor: '#1e293b' } as Partial<Plotly.LayoutAxis>,
};

export default function EstadisticasPage({ users, memos, scatter, progreso }: Props) {
  const [filterDif, setFilterDif] = useState<string>('all');
  const [filterSolved, setFilterSolved] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('all');

  // ── Métricas globales ──────────────────────────────────────────────────────
  const total = users.length;
  const avg = total ? Math.round(users.reduce((s, u) => s + u.total_score, 0) / total) : 0;
  const top = users[0]?.total_score || 0;
  const published = memos.filter(m => m.is_published).length;
  const totalAttempts = scatter.length;
  const solvedAttempts = scatter.filter(d => d.score > 0).length;
  const solveRate = totalAttempts ? Math.round((solvedAttempts / totalAttempts) * 100) : 0;

  // ── Datos filtrados ────────────────────────────────────────────────────────
  const filtered = useMemo(() => scatter.filter(d => {
    if (filterDif !== 'all' && d.dificultad !== filterDif) return false;
    if (filterSolved && d.score === 0) return false;
    if (filterUser !== 'all' && d.username !== filterUser) return false;
    return true;
  }), [scatter, filterDif, filterSolved, filterUser]);

  const allUsers = useMemo(() => [...new Set(scatter.map(d => d.username))].sort(), [scatter]);

  // ── Chart 1: Intentos por memoreto ────────────────────────────────────────
  const byMemo = useMemo(() => {
    const map: Record<string, { total: number; solved: number; scores: number[]; times: number[] }> = {};
    for (const d of filtered) {
      if (!map[d.memoreto]) map[d.memoreto] = { total: 0, solved: 0, scores: [], times: [] };
      map[d.memoreto].total++;
      if (d.score > 0) { map[d.memoreto].solved++; map[d.memoreto].scores.push(d.score); }
      map[d.memoreto].times.push(d.time_seconds);
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filtered]);

  const memoNames = byMemo.map(([name]) => name.length > 18 ? name.slice(0, 18) + '…' : name);
  const memoFullNames = byMemo.map(([name]) => name);

  const intentosPorMemoTrace: Plotly.Data[] = [{
    type: 'bar', orientation: 'h',
    x: byMemo.map(([, v]) => v.total),
    y: memoNames,
    customdata: memoFullNames,
    text: byMemo.map(([, v]) => String(v.total)),
    textposition: 'outside',
    hovertemplate: '<b>%{customdata}</b><br>Intentos: %{x}<extra></extra>',
    marker: { color: byMemo.map(([, v]) => {
      const rate = v.total ? v.solved / v.total : 0;
      return rate > 0.6 ? '#15803d' : rate > 0.3 ? '#b45309' : '#ba1a1a';
    })},
  }];

  // ── Chart 2: Tasa de resolución por memoreto ──────────────────────────────
  const resolucionTrace: Plotly.Data[] = [{
    type: 'bar', orientation: 'h',
    x: byMemo.map(([, v]) => v.total ? Math.round((v.solved / v.total) * 100) : 0),
    y: memoNames,
    customdata: memoFullNames,
    text: byMemo.map(([, v]) => `${v.total ? Math.round((v.solved / v.total) * 100) : 0}%`),
    textposition: 'outside',
    hovertemplate: '<b>%{customdata}</b><br>Tasa: %{x}%<extra></extra>',
    marker: { color: '#550042' },
  }];

  // ── Chart 3: Tiempo promedio por dificultad ───────────────────────────────
  const tiempoPorDifTraces: Plotly.Data[] = Object.entries(
    filtered.reduce<Record<string, number[]>>((acc, d) => {
      const k = d.dificultad || 'desconocido';
      if (!acc[k]) acc[k] = [];
      acc[k].push(d.time_seconds);
      return acc;
    }, {})
  ).map(([dif, times]) => ({
    type: 'box',
    name: DIFS[dif] || dif,
    y: times,
    boxpoints: 'outliers',
    marker: { color: DIF_COLOR[dif] || '#550042' },
    line: { color: DIF_COLOR[dif] || '#550042' },
    hovertemplate: `<b>${DIFS[dif] || dif}</b><br>Tiempo: %{y}s<extra></extra>`,
  } as Plotly.Data));

  // ── Chart 4: Scatter tiempo vs puntuación (filtrado) ─────────────────────
  const scatterTraces: Plotly.Data[] = Object.entries(
    filtered.filter(d => d.score > 0).reduce<Record<string, { x: number[]; y: number[]; text: string[] }>>((acc, d) => {
      const k = d.dificultad || 'desconocido';
      if (!acc[k]) acc[k] = { x: [], y: [], text: [] };
      acc[k].x.push(d.time_seconds);
      acc[k].y.push(d.score);
      acc[k].text.push(`${d.username} · ${d.memoreto}`);
      return acc;
    }, {})
  ).map(([dif, vals]) => ({
    type: 'scatter', mode: 'markers',
    name: DIFS[dif] || dif,
    x: vals.x, y: vals.y, text: vals.text,
    hovertemplate: '<b>%{text}</b><br>Tiempo: %{x}s<br>Puntuación: %{y}<extra></extra>',
    marker: { size: 9, color: DIF_COLOR[dif] || '#550042', opacity: 0.85 },
  } as Plotly.Data));

  // ── Chart 5: Progreso por estudiante (filtrado por usuario) ───────────────
  const progresoEntries = Object.entries(progreso)
    .filter(([u]) => filterUser === 'all' || u === filterUser);
  const progresoTraces: Plotly.Data[] = progresoEntries.map(([username, entries], i) => ({
    type: 'scatter', mode: 'lines+markers',
    name: username,
    x: entries.map(e => e.date),
    y: entries.map(e => e.score_acumulado),
    hovertemplate: `<b>${username}</b><br>%{x}<br>Acumulado: %{y} pts<extra></extra>`,
    line: { color: LINE_COLORS[i % LINE_COLORS.length], width: 2 },
    marker: { size: 5 },
  } as Plotly.Data));

  const barH = byMemo.length > 0 ? Math.max(260, byMemo.length * 36) : 260;

  return (
    <div className="page-content">

      {/* ── Métricas ──────────────────────────────────────────────────────── */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Jugadores totales</span></div>
          <div className="dash-stat-value">{total}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">Promedio {avg.toLocaleString()} pts</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Puntaje más alto</span></div>
          <div className="dash-stat-value" style={{ color: 'var(--secondary)' }}>{top.toLocaleString()}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">{users[0] ? '@' + users[0].username : '—'}</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Intentos registrados</span></div>
          <div className="dash-stat-value" style={{ color: 'var(--tertiary)' }}>{totalAttempts}</div>
          <div className="dash-stat-foot"><span className="dash-stat-sub">{solvedAttempts} resueltos</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top"><span className="dash-stat-label">Tasa de resolución</span></div>
          <div className="dash-stat-value" style={{ color: solveRate >= 50 ? '#15803d' : '#ba1a1a' }}>{solveRate}%</div>
          <div className="dash-stat-foot">
            <div className="dash-stat-bar-track"><div className="dash-stat-bar-fill" style={{ width: `${solveRate}%`, background: solveRate >= 50 ? '#15803d' : '#ba1a1a' }} /></div>
          </div>
        </div>
      </div>

      {/* ── Barra de filtros ──────────────────────────────────────────────── */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filtros</span>
        <div className="filter-group">
          <label>Dificultad</label>
          <select value={filterDif} onChange={e => setFilterDif(e.target.value)}>
            <option value="all">Todas</option>
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Estudiante</label>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
            <option value="all">Todos</option>
            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <label className="filter-check">
          <input type="checkbox" checked={filterSolved} onChange={e => setFilterSolved(e.target.checked)} />
          Solo intentos resueltos
        </label>
        {(filterDif !== 'all' || filterUser !== 'all' || filterSolved) && (
          <button className="filter-clear" onClick={() => { setFilterDif('all'); setFilterUser('all'); setFilterSolved(false); }}>
            × Limpiar
          </button>
        )}
        <span className="filter-count">{filtered.length} registros</span>
      </div>

      {/* ── Fila principal: intentos + ranking ────────────────────────────── */}
      <div className="dash-main" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-chart-card" style={{ padding: '1.25rem' }}>
          <div className="dash-card-title" style={{ marginBottom: '1rem' }}>Intentos por Memoreto</div>
          {byMemo.length === 0
            ? <p className="empty">Sin datos con los filtros actuales</p>
            : <PlotlyChart data={intentosPorMemoTrace} height={barH}
                layout={{ ...LAYOUT_BASE, margin: { t: 10, r: 60, b: 32, l: 160 },
                  xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Intentos' } } as Partial<Plotly.LayoutAxis>,
                  yaxis: { ...LAYOUT_BASE.yaxis, automargin: true } as Partial<Plotly.LayoutAxis> }} />}
        </div>
        <div className="dash-ranking-card">
          <div className="dash-ranking-title">🏅 Ranking Global</div>
          <div className="dash-ranking-list">
            {users.slice(0, 7).map((u, i) => (
              <div key={u.id} className="dash-rank-row">
                <span className="dash-rank-pos">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
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

      {/* ── Tasa de resolución por memoreto ───────────────────────────────── */}
      <div className="dash-plotly-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-plotly-header">
          <span className="material-symbols-outlined dash-plotly-icon">verified</span>
          <div>
            <div className="dash-card-title" style={{ marginBottom: '.2rem' }}>Tasa de Resolución por Memoreto</div>
            <p className="dash-plotly-desc">Porcentaje de intentos que resultaron en solución correcta. Identifica qué memoretos son más difíciles.</p>
          </div>
        </div>
        {byMemo.length === 0
          ? <p className="empty">Sin datos con los filtros actuales</p>
          : <PlotlyChart data={resolucionTrace} height={barH}
              layout={{ ...LAYOUT_BASE, margin: { t: 10, r: 60, b: 32, l: 160 },
                xaxis: { ...LAYOUT_BASE.xaxis, title: { text: '% Resueltos' }, range: [0, 110] } as Partial<Plotly.LayoutAxis>,
                yaxis: { ...LAYOUT_BASE.yaxis, automargin: true } as Partial<Plotly.LayoutAxis> }} />}
      </div>

      {/* ── Distribución de tiempo por dificultad (box plot) ──────────────── */}
      <div className="dash-plotly-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-plotly-header">
          <span className="material-symbols-outlined dash-plotly-icon">timer</span>
          <div>
            <div className="dash-card-title" style={{ marginBottom: '.2rem' }}>Distribución de Tiempo por Dificultad</div>
            <p className="dash-plotly-desc">Diagrama de caja del tiempo empleado agrupado por dificultad. Muestra mediana, cuartiles y valores atípicos.</p>
          </div>
        </div>
        {tiempoPorDifTraces.length === 0
          ? <p className="empty">Sin datos con los filtros actuales</p>
          : <PlotlyChart data={tiempoPorDifTraces} height={300}
              layout={{ ...LAYOUT_BASE,
                yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Tiempo (segundos)' } } as Partial<Plotly.LayoutAxis>,
                xaxis: { ...LAYOUT_BASE.xaxis } as Partial<Plotly.LayoutAxis> }} />}
      </div>

      {/* ── Scatter tiempo vs puntuación ──────────────────────────────────── */}
      <div className="dash-plotly-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-plotly-header">
          <span className="material-symbols-outlined dash-plotly-icon">scatter_plot</span>
          <div>
            <div className="dash-card-title" style={{ marginBottom: '.2rem' }}>Tiempo vs Puntuación (intentos resueltos)</div>
            <p className="dash-plotly-desc">Cada punto es un intento resuelto. Permite ver si los estudiantes más rápidos obtienen mejores puntajes.</p>
          </div>
        </div>
        {scatterTraces.length === 0
          ? <p className="empty">Sin intentos resueltos con los filtros actuales</p>
          : <PlotlyChart data={scatterTraces} height={320}
              layout={{ ...LAYOUT_BASE,
                xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Tiempo (segundos)' } } as Partial<Plotly.LayoutAxis>,
                yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Puntuación' } } as Partial<Plotly.LayoutAxis> }} />}
      </div>

      {/* ── Progreso acumulado ────────────────────────────────────────────── */}
      <div className="dash-plotly-card" style={{ marginBottom: '2rem' }}>
        <div className="dash-plotly-header">
          <span className="material-symbols-outlined dash-plotly-icon">show_chart</span>
          <div>
            <div className="dash-card-title" style={{ marginBottom: '.2rem' }}>Progreso de Puntaje Acumulado</div>
            <p className="dash-plotly-desc">Evolución del puntaje acumulado por estudiante. Usa el filtro de estudiante para enfocarte en uno.</p>
          </div>
        </div>
        {progresoTraces.length === 0
          ? <p className="empty">Sin datos de progreso</p>
          : <PlotlyChart data={progresoTraces} height={320}
              layout={{ ...LAYOUT_BASE,
                xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Fecha' }, type: 'date' } as Partial<Plotly.LayoutAxis>,
                yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Puntaje acumulado' } } as Partial<Plotly.LayoutAxis> }} />}
      </div>

      <style>{`
        .dash-plotly-card { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--r-xl); padding: 1.5rem; }
        .dash-plotly-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
        .dash-plotly-icon { font-size: 1.75rem; color: var(--primary); background: rgba(85,0,66,.08); padding: .5rem; border-radius: var(--r-lg); flex-shrink: 0; }
        .dash-plotly-desc { font-size: .8rem; color: var(--on-surface-variant); line-height: 1.5; }
        .dash-stat-bar-track { height: 4px; background: var(--surface-container); border-radius: 99px; margin-top: .35rem; overflow: hidden; }
        .dash-stat-bar-fill { height: 100%; border-radius: 99px; transition: width .4s; }

        /* Filter bar */
        .filter-bar {
          display: flex; align-items: center; flex-wrap: wrap; gap: .75rem;
          background: var(--surface-container); border: 1px solid var(--outline-variant);
          border-radius: var(--r-xl); padding: .75rem 1.25rem; margin-bottom: 1.5rem;
        }
        .filter-bar-label { font-size: .75rem; font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: .06em; margin-right: .25rem; }
        .filter-group { display: flex; align-items: center; gap: .4rem; }
        .filter-group label { font-size: .78rem; color: var(--on-surface-variant); white-space: nowrap; }
        .filter-group select {
          background: var(--surface-container-lowest); border: 1px solid var(--outline-variant);
          color: var(--on-surface); border-radius: var(--r-md); padding: .3rem .6rem; font-size: .82rem;
        }
        .filter-check { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: var(--on-surface); cursor: pointer; }
        .filter-check input { accent-color: var(--primary); cursor: pointer; }
        .filter-clear {
          background: var(--error-container); color: var(--error); border: none;
          border-radius: var(--r-md); padding: .3rem .7rem; font-size: .78rem; cursor: pointer;
        }
        .filter-count { margin-left: auto; font-size: .75rem; color: var(--on-surface-variant); }
      `}</style>
    </div>
  );
}
