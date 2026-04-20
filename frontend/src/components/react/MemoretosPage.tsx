import { useState, useMemo } from 'react';

const DIF: Record<string, string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };
const DIF_C: Record<string, string> = { easy: '#15803d', medium: '#b45309', hard: '#ba1a1a' };
const NIVEL_LABEL: Record<number, string> = { 1: 'Bosque', 2: 'Río', 3: 'Montaña', 4: 'Desierto', 5: 'Volcán' };

interface Memo {
  id: number;
  title: string;
  nivel: number;
  fase?: number;
  dificultad: string;
  is_published: boolean;
}

interface Answer {
  name: string;
  intentos: number;
  score: number;
  resuelto: boolean;
  submitted_at?: string;
}

interface Results {
  total_attempts: number;
  unique_solvers: number;
  avg_score: number;
  answers: Answer[];
}

type SortKey = 'score' | 'intentos' | 'name' | 'submitted_at';

interface Props {
  initialMemos: Memo[];
}

export default function MemoretosPage({ initialMemos }: Props) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [openResultsId, setOpenResultsId] = useState<number | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // ── Filtros de la lista ────────────────────────────────────────────────────
  const [filterDif, setFilterDif] = useState('all');
  const [filterPub, setFilterPub] = useState('all');

  const visibleMemos = useMemo(() => memos.filter(m => {
    if (filterDif !== 'all' && m.dificultad !== filterDif) return false;
    if (filterPub === 'published' && !m.is_published) return false;
    if (filterPub === 'draft' && m.is_published) return false;
    return true;
  }), [memos, filterDif, filterPub]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este memoreto?')) return;
    await fetch(`/api/proxy/memoretos/${id}`, { method: 'DELETE', credentials: 'include' });
    setMemos(prev => prev.filter(m => m.id !== id));
    if (openResultsId === id) { setOpenResultsId(null); setResults(null); }
  }

  async function togglePublish(m: Memo) {
    await fetch(`/api/proxy/memoretos/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_published: !m.is_published }),
    });
    setMemos(prev => prev.map(x => x.id === m.id ? { ...x, is_published: !m.is_published } : x));
  }

  async function toggleResults(id: number) {
    if (openResultsId === id) { setOpenResultsId(null); setResults(null); setShowAll(false); return; }
    setOpenResultsId(id); setResults(null); setResultsLoading(true); setShowAll(false);
    const res = await fetch(`/api/proxy/memoretos/${id}/answers`, { credentials: 'include' });
    const data = await res.json();
    setResults(data);
    setResultsLoading(false);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  }

  const sortedAnswers = useMemo(() => {
    if (!results) return [];
    return [...results.answers].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'score') cmp = a.score - b.score;
      else if (sortKey === 'intentos') cmp = a.intentos - b.intentos;
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'submitted_at') cmp = (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '');
      return sortAsc ? cmp : -cmp;
    });
  }, [results, sortKey, sortAsc]);

  const displayedAnswers = showAll ? sortedAnswers : sortedAnswers.slice(0, 8);

  function scoreColor(score: number, max: number) {
    if (max === 0) return 'var(--on-surface-variant)';
    const pct = score / max;
    if (pct >= 0.7) return '#15803d';
    if (pct >= 0.4) return '#b45309';
    return '#ba1a1a';
  }

  const maxScore = results ? Math.max(...(results.answers.map(a => a.score)), 1) : 1;
  const solveRate = results && results.total_attempts > 0
    ? Math.round((results.unique_solvers / results.total_attempts) * 100) : 0;

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span style={{ fontSize: '.65rem', color: sortKey === k ? 'var(--primary)' : 'var(--on-surface-variant)', marginLeft: '.2rem' }}>
      {sortKey === k ? (sortAsc ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div className="page-content" style={{ maxWidth: '860px' }}>

      {/* ── Botón nuevo + filtros ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}
          onClick={() => window.location.href = '/memoretos/nuevo'}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_circle</span>
          Nuevo Memoreto
        </button>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <select className="memo-filter-select" value={filterDif} onChange={e => setFilterDif(e.target.value)}>
            <option value="all">Todas las dificultades</option>
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
          <select className="memo-filter-select" value={filterPub} onChange={e => setFilterPub(e.target.value)}>
            <option value="all">Publicados y borradores</option>
            <option value="published">Solo publicados</option>
            <option value="draft">Solo borradores</option>
          </select>
        </div>
      </div>

      {visibleMemos.length === 0
        ? <p className="empty">{memos.length === 0 ? 'No has creado memoretos aún.' : 'Ningún memoreto coincide con los filtros.'}</p>
        : (
          <div className="card-list">
            {visibleMemos.map(m => (
              <div key={m.id} className={`memo-card${openResultsId === m.id ? ' memo-card--open' : ''}`}>

                {/* ── Cabecera ─────────────────────────────────────────── */}
                <div className="memo-card-head">
                  <div className="memo-card-titles">
                    <span className="memo-card-title">{m.title}</span>
                    <div className="memo-card-meta">
                      <span className="memo-meta-tag">{NIVEL_LABEL[m.nivel] ?? `Nivel ${m.nivel}`}</span>
                      {m.fase && <span className="memo-meta-tag">Fase {m.fase}</span>}
                      <span className="dif-badge" style={{ background: DIF_C[m.dificultad] || '#94a3b8' }}>
                        {DIF[m.dificultad] || m.dificultad}
                      </span>
                    </div>
                  </div>
                  <span className={`pub-chip ${m.is_published ? 'pub-chip--on' : 'pub-chip--off'}`}>
                    {m.is_published ? '● Publicado' : '○ Borrador'}
                  </span>
                </div>

                {/* ── Acciones ─────────────────────────────────────────── */}
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => window.location.href = `/memoretos/editar/${m.id}`}>Editar</button>
                  <button className="btn btn-sm btn-outline" onClick={() => togglePublish(m)}>
                    {m.is_published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button className={`btn btn-sm btn-outline${openResultsId === m.id ? ' btn-active' : ''}`}
                    onClick={() => toggleResults(m.id)}>
                    Resultados {openResultsId === m.id ? '▲' : '▼'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>Borrar</button>
                </div>

                {/* ── Panel de resultados ───────────────────────────────── */}
                {openResultsId === m.id && (
                  <div className="results-panel">
                    {resultsLoading ? (
                      <div className="results-loading">
                        <span className="material-symbols-outlined spin">progress_activity</span>
                        Cargando resultados…
                      </div>
                    ) : results ? (
                      <>
                        {/* Stat cards */}
                        <div className="results-stats">
                          <div className="rstat-card">
                            <span className="rstat-icon material-symbols-outlined">sports_esports</span>
                            <span className="rstat-val">{results.total_attempts}</span>
                            <span className="rstat-lbl">intentos totales</span>
                          </div>
                          <div className="rstat-card">
                            <span className="rstat-icon material-symbols-outlined">group</span>
                            <span className="rstat-val">{results.unique_solvers}</span>
                            <span className="rstat-lbl">alumnos que lo resolvieron</span>
                          </div>
                          <div className="rstat-card">
                            <span className="rstat-icon material-symbols-outlined">emoji_events</span>
                            <span className="rstat-val">{results.avg_score.toLocaleString()}</span>
                            <span className="rstat-lbl">puntaje promedio</span>
                          </div>
                          <div className="rstat-card rstat-card--wide">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                              <span className="rstat-lbl" style={{ margin: 0 }}>Tasa de resolución</span>
                              <span className="rstat-val" style={{ fontSize: '1.1rem', color: solveRate >= 50 ? '#15803d' : '#ba1a1a' }}>{solveRate}%</span>
                            </div>
                            <div className="rstat-bar-track">
                              <div className="rstat-bar-fill" style={{ width: `${solveRate}%`, background: solveRate >= 50 ? '#15803d' : solveRate >= 25 ? '#b45309' : '#ba1a1a' }} />
                            </div>
                          </div>
                        </div>

                        {/* Tabla */}
                        {results.answers.length === 0 ? (
                          <p className="results-empty">Nadie ha jugado este memoreto aún.</p>
                        ) : (
                          <>
                            <div className="results-table-wrap">
                              <table className="results-table">
                                <thead>
                                  <tr>
                                    <th onClick={() => handleSort('name')} className="sortable">
                                      Alumno <SortIcon k="name" />
                                    </th>
                                    <th onClick={() => handleSort('intentos')} className="sortable" style={{ textAlign: 'center' }}>
                                      Intentos <SortIcon k="intentos" />
                                    </th>
                                    <th onClick={() => handleSort('score')} className="sortable" style={{ textAlign: 'center' }}>
                                      Puntaje <SortIcon k="score" />
                                    </th>
                                    <th style={{ textAlign: 'center' }}>Estado</th>
                                    <th onClick={() => handleSort('submitted_at')} className="sortable">
                                      Fecha <SortIcon k="submitted_at" />
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayedAnswers.map((a, i) => (
                                    <tr key={i} className={a.resuelto ? 'row-solved' : 'row-unsolved'}>
                                      <td className="td-name">{a.name}</td>
                                      <td style={{ textAlign: 'center' }}>
                                        <span className={`intentos-badge ${a.intentos <= 2 ? 'int-good' : a.intentos <= 5 ? 'int-mid' : 'int-bad'}`}>
                                          {a.intentos}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'center', fontWeight: 600, color: scoreColor(a.score, maxScore) }}>
                                        {a.score > 0 ? a.score.toLocaleString() : '—'}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        <span className={`solved-badge ${a.resuelto ? 'solved-yes' : 'solved-no'}`}>
                                          {a.resuelto ? 'Resuelto' : 'Sin resolver'}
                                        </span>
                                      </td>
                                      <td className="td-date">
                                        {a.submitted_at?.slice(0, 16).replace('T', ' ') ?? '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {sortedAnswers.length > 8 && (
                              <button className="show-more-btn" onClick={() => setShowAll(v => !v)}>
                                {showAll ? `Mostrar menos ▲` : `Ver todos (${sortedAnswers.length}) ▼`}
                              </button>
                            )}
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <style>{`
        .memo-filter-select {
          background: var(--surface-container); border: 1px solid var(--outline-variant);
          color: var(--on-surface); border-radius: var(--r-md); padding: .35rem .7rem; font-size: .82rem;
        }

        /* Memo card */
        .memo-card {
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          border-radius: var(--r-xl); padding: 1.1rem 1.25rem;
          margin-bottom: .75rem; transition: border-color .15s;
        }
        .memo-card--open { border-color: var(--primary); }
        .memo-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: .75rem; }
        .memo-card-titles { display: flex; flex-direction: column; gap: .35rem; }
        .memo-card-title { font-size: 1rem; font-weight: 700; color: var(--on-surface); }
        .memo-card-meta { display: flex; gap: .4rem; flex-wrap: wrap; align-items: center; }
        .memo-meta-tag {
          font-size: .72rem; color: var(--on-surface-variant);
          background: var(--surface-container); border: 1px solid var(--outline-variant);
          border-radius: 99px; padding: .1rem .5rem;
        }
        .pub-chip { font-size: .72rem; font-weight: 600; white-space: nowrap; padding: .25rem .65rem; border-radius: 99px; }
        .pub-chip--on { background: #dcfce7; color: #15803d; }
        .pub-chip--off { background: var(--surface-container); color: var(--on-surface-variant); border: 1px solid var(--outline-variant); }
        .btn-active { background: var(--primary-fixed); border-color: var(--primary); color: var(--primary); }

        /* Results panel */
        .results-panel {
          margin-top: 1rem; padding: 1.1rem;
          background: var(--surface-container); border-radius: var(--r-lg);
          border: 1px solid var(--outline-variant);
        }
        .results-loading { display: flex; align-items: center; gap: .5rem; color: var(--on-surface-variant); font-size: .85rem; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .results-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin-bottom: 1rem; }
        .rstat-card {
          background: var(--surface-container-lowest); border: 1px solid var(--outline-variant);
          border-radius: var(--r-lg); padding: .75rem 1rem;
          display: flex; flex-direction: column; align-items: center; gap: .15rem; text-align: center;
        }
        .rstat-card--wide { grid-column: 1 / -1; align-items: stretch; }
        .rstat-icon { font-size: 1.25rem; color: var(--primary); }
        .rstat-val { font-size: 1.5rem; font-weight: 800; color: var(--on-surface); line-height: 1; }
        .rstat-lbl { font-size: .72rem; color: var(--on-surface-variant); }
        .rstat-bar-track { height: 8px; background: var(--outline-variant); border-radius: 99px; overflow: hidden; }
        .rstat-bar-fill { height: 100%; border-radius: 99px; transition: width .5s ease; }

        .results-empty { color: var(--on-surface-variant); font-size: .85rem; margin: .5rem 0 0; }
        .results-table-wrap { overflow-x: auto; border-radius: var(--r-lg); border: 1px solid var(--outline-variant); }
        .results-table { width: 100%; border-collapse: collapse; font-size: .83rem; }
        .results-table thead { background: var(--surface-container-lowest); }
        .results-table th {
          text-align: left; color: var(--on-surface-variant); font-weight: 600;
          padding: .55rem .75rem; border-bottom: 1px solid var(--outline-variant);
          white-space: nowrap; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em;
        }
        .results-table th.sortable { cursor: pointer; user-select: none; }
        .results-table th.sortable:hover { color: var(--primary); }
        .results-table td { padding: .5rem .75rem; border-bottom: 1px solid var(--outline-variant); color: var(--on-surface); }
        .results-table tr:last-child td { border-bottom: none; }
        .row-solved td { background: rgba(21,128,61,.04); }
        .row-unsolved { opacity: .85; }
        .td-name { font-weight: 500; }
        .td-date { color: var(--on-surface-variant); font-size: .75rem; }
        .intentos-badge { font-size: .78rem; font-weight: 700; padding: .15rem .55rem; border-radius: 99px; }
        .int-good { background: #dcfce7; color: #15803d; }
        .int-mid  { background: #fef3c7; color: #92400e; }
        .int-bad  { background: #fee2e2; color: #991b1b; }
        .solved-badge { font-size: .72rem; font-weight: 600; padding: .2rem .55rem; border-radius: 99px; white-space: nowrap; }
        .solved-yes { background: #dcfce7; color: #15803d; }
        .solved-no  { background: #fee2e2; color: #991b1b; }
        .show-more-btn {
          display: block; width: 100%; margin-top: .6rem; padding: .4rem;
          background: none; border: 1px solid var(--outline-variant); border-radius: var(--r-md);
          color: var(--on-surface-variant); font-size: .78rem; cursor: pointer; text-align: center;
        }
        .show-more-btn:hover { border-color: var(--primary); color: var(--primary); }

        @media (max-width: 600px) {
          .results-stats { grid-template-columns: 1fr 1fr; }
          .rstat-card--wide { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  );
}
