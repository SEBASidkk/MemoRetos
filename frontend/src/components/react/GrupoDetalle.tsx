import { useState } from 'react';

interface Student { id: number; name: string; lastname: string; username: string; total_score: number; }
interface Memo { id: number; title: string; dificultad: string; }
interface Group { id: number; name: string; code: string; }

interface Props {
  groupId: string;
  initialGroup: Group;
  initialStudents: Student[];
  initialMemos: Memo[];
  allMemos: Memo[];
}

export default function GrupoDetalle({ groupId, initialGroup, initialStudents, initialMemos, allMemos }: Props) {
  const [tab, setTab] = useState<'personas' | 'tareas'>('personas');
  const [students] = useState<Student[]>(initialStudents);
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [selMemo, setSelMemo] = useState('');
  const [msg, setMsg] = useState('');

  const available = allMemos.filter(m => !memos.some(am => am.id === m.id));

  async function handleAssign() {
    if (!selMemo) return;
    const res = await fetch(`/api/proxy/groups/${groupId}/memoretos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ memoreto_id: Number(selMemo) }),
    });
    const d = await res.json();
    setMsg(res.status === 201 ? 'Memoreto asignado' : (d.message || 'Error al asignar'));
    const assigned = allMemos.find(m => m.id === Number(selMemo));
    if (assigned && res.status === 201) {
      setMemos(prev => [...prev, assigned]);
      setSelMemo('');
    }
  }

  async function handleRemove(memoId: number) {
    await fetch(`/api/proxy/groups/${groupId}/memoretos/${memoId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setMemos(prev => prev.filter(m => m.id !== memoId));
  }

  return (
    <div className="page-content" style={{ maxWidth: '800px' }}>
      <div>
        <div className="group-code-bar">
          <span>Código de acceso:</span>
          <span className="code-display">{initialGroup.code}</span>
        </div>

        <div className="dash-tabs" style={{ width: 'fit-content', marginBottom: '1.25rem' }}>
          <button className={tab === 'personas' ? 'active' : ''} onClick={() => setTab('personas')}>
            Personas ({students.length})
          </button>
          <button className={tab === 'tareas' ? 'active' : ''} onClick={() => setTab('tareas')}>
            Tareas ({memos.length})
          </button>
        </div>

        {tab === 'personas' && (
          <div className="card-list">
            {students.length === 0 ? (
              <p className="empty">Sin estudiantes. Comparte el código para que se unan.</p>
            ) : students.map(s => (
              <div key={s.id} className="simple-row">
                <span>{s.name} {s.lastname}</span>
                <span style={{ fontSize: '.78rem', color: 'var(--on-surface-variant)' }}>@{s.username}</span>
                <span style={{ fontSize: '.83rem', fontWeight: 700, color: 'var(--secondary)' }}>{s.total_score} pts</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'tareas' && (
          <>
            <div className="assign-section">
              <h4>Asignar memoreto</h4>
              <div className="row" style={{ alignItems: 'flex-end' }}>
                <div className="field" style={{ flex: 1 }}>
                  <select value={selMemo} onChange={e => setSelMemo(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {available.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.dificultad})</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-sm" onClick={handleAssign} disabled={!selMemo}>Asignar</button>
              </div>
              {msg && <p className="hint">{msg}</p>}
            </div>

            <div className="card-list" style={{ marginTop: '.75rem' }}>
              {memos.length === 0 ? (
                <p className="empty">Sin memoretos asignados.</p>
              ) : memos.map(m => (
                <div key={m.id} className="simple-row">
                  <span>{m.title}</span>
                  <span className="badge small">{m.dificultad}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => handleRemove(m.id)}>Quitar</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
