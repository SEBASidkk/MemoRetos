import { useState } from 'react';

export default function NuevoGrupoForm() {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/proxy/groups/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim() }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.status === 201) {
      setMsg(`Grupo creado — Código: ${d.group.code}`);
      setTimeout(() => { window.location.href = '/grupos'; }, 1500);
    } else {
      setMsg(d.message || 'Error al crear grupo');
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: '560px' }}>
      <form onSubmit={handleCreate}>
        <div className="field">
          <label>Nombre del grupo</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: TC2005B Gpo 441" autoFocus required />
        </div>
        {msg && (
          <p className="hint" style={{
            color: '#15803d', background: '#f0fdf4', padding: '.6rem .85rem',
            borderRadius: 'var(--r-lg)', border: '1px solid #86efac', marginBottom: '.75rem'
          }}>{msg}</p>
        )}
        <div className="row" style={{ gap: '.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-full" type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Guardar'}
          </button>
          <button type="button" className="btn btn-outline btn-full"
            onClick={() => window.location.href = '/grupos'}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
