import { useState, useMemo } from 'react';
import MemoCanvas from './MemoCanvas';
import { figuraToShapes } from '../../lib/canvas-utils';
import type { Shape } from '../../lib/types';

interface MemoForm {
  title: string;
  nivel: number;
  fase: number;
  dificultad: string;
  number_set: string;
  is_published: boolean;
}

type StoredShape = {
  _geo?: object; center?: number[]; size?: number[]; rotation?: number;
  id: number; type: Shape['type']; color: string; operacion: Shape['operacion']; target: number; nodos?: number[];
};

interface Props {
  memoId?: string;
  initialData?: {
    title: string; nivel: number; fase: number; dificultad: string;
    is_published: boolean; number_set?: number[];
    figuras?: StoredShape[];
    // Unity/server format
    shapes?: StoredShape[];
  };
}

export default function MemoEditor({ memoId, initialData }: Props) {
  const [form, setForm] = useState<MemoForm>({
    title: initialData?.title ?? '',
    nivel: initialData?.nivel ?? 1,
    fase: initialData?.fase ?? 1,
    dificultad: initialData?.dificultad ?? 'easy',
    number_set: (initialData?.number_set ?? [1, 2, 3, 4]).join(', '),
    is_published: initialData?.is_published ?? false,
  });

  const [canvasFigures, setCanvasFigures] = useState<object[]>(initialData?.figuras ?? initialData?.shapes ?? []);
  const [canvasSolution, setCanvasSolution] = useState<Record<number, number> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const initialShapes = useMemo<Shape[]>(() => {
    const src = initialData?.figuras ?? initialData?.shapes ?? [];
    if (!src.length) return [];
    return figuraToShapes(src as Parameters<typeof figuraToShapes>[0]);
  }, []);

  const parsedNumberSet = useMemo<number[]>(() => {
    return form.number_set
      .split(',')
      .map(n => Number(n.trim()))
      .filter(n => !isNaN(n) && n !== 0);
  }, [form.number_set]);

  const hasSolution = canvasSolution !== null && Object.keys(canvasSolution).length > 0;

  function updateForm(field: keyof MemoForm, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function onCanvasChange(e: { figures: object[]; nodes: object[]; solution: Record<number, number> | null }) {
    setCanvasFigures(e.figures);
    setCanvasSolution(e.solution);
    setSaveErr('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setSaveErr('El título es obligatorio'); return; }
    if (canvasFigures.length === 0) { setSaveErr('Dibuja al menos una figura en el canvas'); return; }
    setSaving(true); setSaveErr('');

    const body = {
      title: form.title, nivel: Number(form.nivel), fase: Number(form.fase),
      dificultad: form.dificultad, is_published: form.is_published,
      number_set: parsedNumberSet, figuras: canvasFigures,
      solution: canvasSolution || {},
    };

    const url = memoId ? `/api/proxy/memoretos/${memoId}` : '/api/proxy/memoretos/';
    const method = memoId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      window.location.href = '/memoretos';
    } else {
      const d = await res.json();
      setSaveErr(d.message || 'Error al guardar');
    }
  }

  return (
    <div className="page-content">
      <div className="editor-layout">
        {/* Left: metadata */}
        <div className="editor-meta">
          <form onSubmit={handleSave} id="memo-form">
            <div className="field">
              <label>Título</label>
              <input value={form.title} onChange={e => updateForm('title', e.target.value)}
                placeholder="Nombre del memoreto" required />
            </div>

            <div className="row">
              <div className="field">
                <label>Nivel</label>
                <input type="number" value={form.nivel} onChange={e => updateForm('nivel', e.target.value)} min={1} />
              </div>
              <div className="field">
                <label>Fase</label>
                <input type="number" value={form.fase} onChange={e => updateForm('fase', e.target.value)} min={1} />
              </div>
            </div>

            <div className="field">
              <label>Dificultad</label>
              <select value={form.dificultad} onChange={e => updateForm('dificultad', e.target.value)}>
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            <div className="field">
              <label>Números disponibles (separados por coma)</label>
              <input value={form.number_set} onChange={e => updateForm('number_set', e.target.value)}
                placeholder="1, 2, 3, 4" />
              <span style={{ fontSize: '.7rem', color: '#64748b' }}>
                Conjunto actual: [{parsedNumberSet.join(', ')}]
              </span>
            </div>

            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
              <input type="checkbox" checked={form.is_published}
                onChange={e => updateForm('is_published', e.target.checked)} id="pub" />
              <label htmlFor="pub" style={{ margin: 0 }}>Publicar — visible en Unity</label>
            </div>

            {canvasFigures.length > 0 && (
              <div className="canvas-summary">
                <div className="cs-title">Figuras en el canvas</div>
                {(canvasFigures as { id?: number; type: string; operacion: string; target: number; color: string; nodos?: number[] }[]).map((f, idx) => (
                  <div key={f.id ?? idx} className="cs-row" style={{ borderLeft: `3px solid ${f.color}` }}>
                    <span>{f.type}</span>
                    <span style={{ color: '#64748b' }}>
                      {f.operacion === 'suma' ? 'Σ' : f.operacion === 'multiplicacion' ? '×' : '−'}={f.target}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '.75rem' }}>
                      nodos: [{f.nodos?.join(', ') ?? ''}]
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hasSolution ? (
              <div className="solution-ready">✅ Solución verificada — listo para guardar</div>
            ) : canvasFigures.length > 0 ? (
              <div className="solution-pending">⚠️ Verifica la solución en el canvas antes de guardar</div>
            ) : null}

            {saveErr && <p className="error-msg">{saveErr}</p>}

            <div className="row" style={{ gap: '.5rem', marginTop: '.5rem' }}>
              <button type="submit" className="btn btn-full" disabled={saving}>
                {saving ? 'Guardando...' : hasSolution ? '💾 Guardar con solución' : 'Guardar borrador'}
              </button>
              <button type="button" className="btn btn-outline btn-full"
                onClick={() => window.location.href = '/memoretos'}>
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Right: canvas */}
        <div className="editor-canvas-col">
          <div className="editor-canvas-title">
            Editor visual de figuras
            <span className="editor-canvas-sub">Arrastra para crear · Superpón para intersecciones · Verifica solución</span>
          </div>
          <MemoCanvas
            numberSet={parsedNumberSet}
            initialShapes={initialShapes}
            onCanvasChange={onCanvasChange}
          />
        </div>
      </div>
    </div>
  );
}
