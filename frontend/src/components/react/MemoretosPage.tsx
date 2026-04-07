import { useState } from 'react';

const DIF: Record<string, string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };
const DIF_C: Record<string, string> = { easy: '#15803d', medium: '#825500', hard: '#ba1a1a' };

interface Memo {
  id: number;
  title: string;
  nivel: number;
  fase?: number;
  dificultad: string;
  is_published: boolean;
}

interface Results {
  total_attempts: number;
  unique_solvers: number;
  avg_score: number;
  answers: {
    name: string;
    intentos: number;
    score: number;
    resuelto: boolean;
    submitted_at?: string;
  }[];
}

interface Props {
  initialMemos: Memo[];
}

export default function MemoretosPage({ initialMemos }: Props) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [openResultsId, setOpenResultsId] = useState<number | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este memoreto?')) return;
    await fetch(`/api/proxy/memoretos/${id}`, { method: 'DELETE', credentials: 'include' });
    setMemos(prev => prev.filter(m => m.id !== id));
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
    if (openResultsId === id) { setOpenResultsId(null); setResults(null); return; }
    setOpenResultsId(id); setResults(null); setResultsLoading(true);
    const res = await fetch(`/api/proxy/memoretos/${id}/answers`, { credentials: 'include' });
    const data = await res.json();
    setResults(data);
    setResultsLoading(false);
  }

  return (
    <div className="page-content" style={{ maxWidth: '800px' }}>
      <div>
        <button className="btn btn-full"
          style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}
          onClick={() => window.location.href = '/memoretos/nuevo'}>
          <span className="material-symbols-outlined">add_circle</span>
          Nuevo Memoreto
        </button>

        {memos.length === 0 ? (
          <p className="empty">No has creado memoretos aún.</p>
        ) : (
          <div className="card-list">
            {memos.map(m => (
              <div key={m.id} className="level-card">
                <div className="level-header">
                  <span className="level-title">{m.title}</span>
                  <span className="dif-badge" style={{ background: DIF_C[m.dificultad] || '#94a3b8' }}>
                    {DIF[m.dificultad] || m.dificultad}
                  </span>
                </div>
                <div className="level-meta">
                  <span>Nivel {m.nivel}</span>
                  {m.fase && <span> · Fase {m.fase}</span>}
                  <span> · {m.is_published ? '✅ Publicado en Unity' : '📝 Borrador'}</span>
                </div>
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => window.location.href = `/memoretos/editar/${m.id}`}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => togglePublish(m)}>
                    {m.is_published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => toggleResults(m.id)}>
                    📊 Resultados
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>
                    Borrar
                  </button>
                </div>

                {openResultsId === m.id && (
                  resultsLoading ? (
                    <p style={{ margin: '.75rem 0 0', color: '#94a3b8', fontSize: '.85rem' }}>Cargando resultados...</p>
                  ) : results ? (
                    <div className="results-panel">
                      <div className="results-stats">
                        <div className="rstat">
                          <span className="rstat-val">{results.total_attempts}</span>
                          <span className="rstat-lbl">intentos totales</span>
                        </div>
                        <div className="rstat">
                          <span className="rstat-val">{results.unique_solvers}</span>
                          <span className="rstat-lbl">alumnos que lo resolvieron</span>
                        </div>
                        <div className="rstat">
                          <span className="rstat-val">{results.avg_score}</span>
                          <span className="rstat-lbl">puntaje promedio</span>
                        </div>
                      </div>
                      {results.answers.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '.85rem', margin: '.5rem 0 0' }}>Nadie ha jugado este memoreto aún.</p>
                      ) : (
                        <>
                          <table className="results-table">
                            <thead>
                              <tr>
                                <th>Alumno</th><th>Intentos</th><th>Puntaje</th><th>Resuelto</th><th>Fecha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.answers.slice(0, 10).map((a, i) => (
                                <tr key={i}>
                                  <td>{a.name}</td>
                                  <td style={{ textAlign: 'center' }}>{a.intentos}</td>
                                  <td style={{ textAlign: 'center' }}>{a.score}</td>
                                  <td style={{ textAlign: 'center' }}>{a.resuelto ? '✅' : '❌'}</td>
                                  <td style={{ color: '#64748b', fontSize: '.78rem' }}>
                                    {a.submitted_at?.slice(0, 16).replace('T', ' ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {results.answers.length > 10 && (
                            <p style={{ color: '#64748b', fontSize: '.8rem', margin: '.4rem 0 0' }}>
                              Mostrando 10 de {results.answers.length} resultados
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ) : null
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .results-panel { margin-top:.75rem; padding:.75rem; background:#0f172a; border-radius:8px; border:1px solid #1e293b; }
        .results-stats { display:flex; gap:1.5rem; margin-bottom:.75rem; }
        .rstat { display:flex; flex-direction:column; align-items:center; }
        .rstat-val { font-size:1.4rem; font-weight:700; color:#38bdf8; }
        .rstat-lbl { font-size:.72rem; color:#64748b; }
        .results-table { width:100%; border-collapse:collapse; font-size:.82rem; }
        .results-table th { text-align:left; color:#64748b; padding:.3rem .5rem; border-bottom:1px solid #1e293b; }
        .results-table td { padding:.3rem .5rem; border-bottom:1px solid #1e293b; color:#e2e8f0; }
        .results-table tr:last-child td { border-bottom:none; }
      `}</style>
    </div>
  );
}
