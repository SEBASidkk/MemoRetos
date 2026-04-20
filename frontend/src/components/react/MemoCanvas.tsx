import { useState, useMemo, useRef, useEffect } from 'react';
import { solve } from '../../lib/solver';
import {
  CANVAS_W, CANVAS_H, MIN_SIZE, COLORS, TOOLS,
  detectNodes, buildFigures, getPoints, centerX, centerY, getHandles,
  getRotationHandlePos, rotatePoint,
} from '../../lib/canvas-utils';
import type { Shape, CanvasNode, DragState } from '../../lib/types';

interface CanvasChangePayload {
  figures: ReturnType<typeof buildFigures>;
  nodes: CanvasNode[];
  solution: Record<number, number> | null;
}

interface Props {
  numberSet?: number[];
  initialShapes?: Shape[];
  onCanvasChange?: (payload: CanvasChangePayload) => void;
}

export default function MemoCanvas({ numberSet = [], initialShapes = [], onCanvasChange }: Props) {
  const [shapes, setShapes] = useState<Shape[]>(() => [...initialShapes]);
  const [tool, setTool] = useState('select');
  const [selId, setSelId] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>(() => detectNodes(initialShapes));
  const [result, setResult] = useState<{ hasSolution: boolean; solution?: Record<number, number>; message?: string } | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (initialShapes.length > 0) {
      setShapes([...initialShapes]);
      setNodes(detectNodes(initialShapes));
      setResult(null);
    }
  }, [initialShapes.length]);

  const liveShapes = useMemo<Shape[]>(() => {
    if (drag?.type === 'create' && drag.shape && drag.shape.w > MIN_SIZE && drag.shape.h > MIN_SIZE) {
      return [...shapes, drag.shape];
    }
    return shapes;
  }, [shapes, drag]);

  const liveNodes = useMemo<CanvasNode[]>(() => {
    if (drag?.type === 'create') return detectNodes(liveShapes);
    return nodes;
  }, [nodes, liveShapes, drag]);

  const sel = useMemo(() => shapes.find(s => s.id === selId), [shapes, selId]);
  const selNodes = useMemo(() => nodes.filter(n => n.shapeIds.includes(selId!)), [nodes, selId]);
  const sharedNodes = useMemo(() => nodes.filter(n => n.shapeIds.length > 1).length, [nodes]);
  const solutionEntries = useMemo<[string, number][]>(() => {
    if (!result?.solution) return [];
    return Object.entries(result.solution) as [string, number][];
  }, [result]);

  function svgPt(e: React.MouseEvent): [number, number] {
    const r = svgRef.current!.getBoundingClientRect();
    // Convert screen px → SVG viewBox coordinates
    const scaleX = CANVAS_W / r.width;
    const scaleY = CANVAS_H / r.height;
    return [(e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY];
  }

  function refresh(sh: Shape[]) {
    const newNodes = detectNodes(sh);
    setNodes(newNodes);
    setResult(null);
    const figs = buildFigures(sh, newNodes);
    onCanvasChange?.({ figures: figs, nodes: newNodes, solution: null });
  }

  function onSvgDown(e: React.MouseEvent) {
    if (tool === 'select') { setSelId(null); return; }
    const [x, y] = svgPt(e);
    setDrag({
      type: 'create',
      start: [x, y],
      shape: {
        id: Date.now(), type: tool as Shape['type'],
        color: COLORS[colorIdx % COLORS.length],
        operacion: 'suma', target: 10,
        x, y, w: 0, h: 0,
      },
    });
  }

  function onShapeDown(e: React.MouseEvent, s: Shape) {
    e.stopPropagation();
    if (tool !== 'select') return;
    setSelId(s.id);
    const [mx, my] = svgPt(e);
    setDrag({ type: 'move', id: s.id, ox: mx - s.x, oy: my - s.y });
  }

  function onHandleDown(e: React.MouseEvent, s: Shape, corner: string) {
    e.stopPropagation();
    const [mx, my] = svgPt(e);
    setDrag({ type: 'resize', id: s.id, corner, mx0: mx, my0: my, ox: s.x, oy: s.y, ow: s.w, oh: s.h });
  }

  function onRotateHandleDown(e: React.MouseEvent, s: Shape) {
    e.stopPropagation();
    setDrag({ type: 'rotate', id: s.id });
  }

  function onMove(e: React.MouseEvent) {
    if (!drag) return;
    const [mx, my] = svgPt(e);

    if (drag.type === 'create' && drag.start && drag.shape) {
      const x = Math.min(drag.start[0], mx), y = Math.min(drag.start[1], my);
      const w = Math.abs(mx - drag.start[0]), h = Math.abs(my - drag.start[1]);
      setDrag(d => d ? { ...d, shape: { ...d.shape!, x, y, w, h } } : d);
      return;
    }

    if (drag.type === 'move' && drag.id !== undefined) {
      setShapes(prev => prev.map(s => s.id === drag.id
        ? { ...s, x: mx - drag.ox!, y: my - drag.oy! } : s));
      return;
    }

    if (drag.type === 'resize' && drag.id !== undefined) {
      const ddx = mx - drag.mx0!, ddy = my - drag.my0!;
      setShapes(prev => prev.map(s => {
        if (s.id !== drag.id) return s;
        let { x, y, w, h } = { x: drag.ox!, y: drag.oy!, w: drag.ow!, h: drag.oh! };
        if (drag.corner === 'tl') { x += ddx; y += ddy; w -= ddx; h -= ddy; }
        if (drag.corner === 'tr') { y += ddy; w += ddx; h -= ddy; }
        if (drag.corner === 'br') { w += ddx; h += ddy; }
        if (drag.corner === 'bl') { x += ddx; w -= ddx; h += ddy; }
        return { ...s, x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) };
      }));
      return;
    }

    if (drag.type === 'rotate' && drag.id !== undefined) {
      setShapes(prev => prev.map(s => {
        if (s.id !== drag.id) return s;
        const cx = centerX(s), cy = centerY(s);
        const angle = Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90;
        return { ...s, rotation: Math.round(angle) };
      }));
    }
  }

  function onUp() {
    if (!drag) return;
    if (drag.type === 'create' && drag.shape) {
      if (drag.shape.w > MIN_SIZE && drag.shape.h > MIN_SIZE) {
        const ns = [...shapes, drag.shape];
        setShapes(ns);
        refresh(ns);
        setSelId(drag.shape.id);
        setColorIdx(c => c + 1);
      }
      setTool('select');
    }
    if (drag.type === 'move' || drag.type === 'resize' || drag.type === 'rotate') {
      refresh(shapes);
    }
    setDrag(null);
  }

  function deleteShape() {
    const ns = shapes.filter(s => s.id !== selId);
    setShapes(ns);
    refresh(ns);
    setSelId(null);
  }

  function setProp(field: string, value: string | number) {
    const ns = shapes.map(s => s.id === selId ? { ...s, [field]: value } : s);
    setShapes(ns);
    refresh(ns);
  }

  function verify() {
    const figs = buildFigures(shapes, nodes);
    if (!numberSet.length) {
      setResult({ hasSolution: false, message: 'Define el número de conjunto primero' });
      return;
    }
    if (!nodes.length) {
      setResult({ hasSolution: false, message: 'No hay intersecciones — superpón figuras para crear nodos' });
      return;
    }
    const r = solve(figs as Parameters<typeof solve>[0], numberSet);
    setResult(r);
    onCanvasChange?.({ figures: figs, nodes, solution: r.hasSolution ? r.solution : null });
  }

  return (
    <div className="memo-canvas-wrap">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <button className={`ctool${tool === 'select' ? ' active' : ''}`} onClick={() => setTool('select')}>↖ Seleccionar</button>
        <span className="ctool-sep" />
        {TOOLS.map(t => (
          <button key={t.id} className={`ctool${tool === t.id ? ' active' : ''}`}
            onClick={() => setTool(t.id)} title={t.label}>
            {t.icon} {t.label}
          </button>
        ))}
        {selId && (
          <>
            <span className="ctool-sep" />
            <button className="ctool danger" onClick={deleteShape}>🗑 Eliminar</button>
          </>
        )}
      </div>

      {/* Canvas body */}
      <div className="canvas-body">
        <svg ref={svgRef} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="memo-svg"
          onMouseDown={onSvgDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}>
          <defs>
            <pattern id="cgrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth={0.5} />
            </pattern>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#cgrid)" rx={6} />

          {/* Shapes */}
          {liveShapes.map(s => {
            const cx = centerX(s), cy = centerY(s);
            const rot = s.rotation ?? 0;
            return (
              <g key={s.id} transform={rot !== 0 ? `rotate(${rot}, ${cx}, ${cy})` : undefined}>
                {(s.type === 'circulo' || s.type === 'elipse') ? (
                  <ellipse
                    cx={cx} cy={cy}
                    rx={s.w / 2} ry={s.h / 2}
                    fill={s.color + '28'} stroke={s.color}
                    strokeWidth={s.id === selId ? 3 : 2}
                    strokeDasharray={s.id === selId ? '8 4' : undefined}
                    style={{ cursor: 'move', userSelect: 'none' }}
                    onMouseDown={e => onShapeDown(e, s)}
                  />
                ) : (
                  <polygon
                    points={getPoints(s)}
                    fill={s.color + '28'} stroke={s.color}
                    strokeWidth={s.id === selId ? 3 : 2}
                    strokeDasharray={s.id === selId ? '8 4' : undefined}
                    style={{ cursor: 'move', userSelect: 'none' }}
                    onMouseDown={e => onShapeDown(e, s)}
                  />
                )}
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={cx - 20} y={cy - 10} width={40} height={20} rx={4}
                    fill="#0f172a" fillOpacity={0.7} />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fill={s.color} fontWeight={600}>
                    {s.operacion === 'suma' ? 'Σ' : s.operacion === 'multiplicacion' ? '×' : '−'}={s.target}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Resize handles (world-space, already rotated by getHandles) */}
          {sel && getHandles(sel).map(h => (
            <circle key={h.corner} cx={h.cx} cy={h.cy} r={7}
              fill="#0f172a" stroke="#38bdf8" strokeWidth={2}
              style={{ cursor: 'nwse-resize' }}
              onMouseDown={e => onHandleDown(e, sel, h.corner)} />
          ))}

          {/* Rotation handle */}
          {sel && (() => {
            const [hx, hy] = getRotationHandlePos(sel);
            const cx = centerX(sel), cy = centerY(sel);
            // Line from top-center (rotated) to handle
            const [tx, ty] = rotatePoint(cx, sel.y, cx, cy, sel.rotation ?? 0);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3 2" />
                <circle cx={hx} cy={hy} r={8}
                  fill="#0f172a" stroke="#a78bfa" strokeWidth={2}
                  style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                  onMouseDown={e => onRotateHandleDown(e, sel)} />
                <text x={hx} y={hy} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9} fill="#a78bfa" style={{ pointerEvents: 'none' }}>↻</text>
              </g>
            );
          })()}

          {/* Intersection nodes */}
          {liveNodes.map(n => (
            <g key={n.id} style={{ pointerEvents: 'none' }}>
              <circle cx={n.x} cy={n.y} r={14}
                fill="#78350f" stroke="#fbbf24" strokeWidth={2.5} />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fontWeight="bold" fill="#fff">{n.id}</text>
            </g>
          ))}
        </svg>

        {/* Properties panel */}
        <div className="canvas-panel">
          {sel ? (
            <div className="panel-props">
              <div className="panel-title">
                Figura {shapes.findIndex(sh => sh.id === sel.id) + 1}
                <span className="panel-type-badge">{sel.type}</span>
              </div>
              <div className="panel-field">
                <label>Color</label>
                <input type="color" value={sel.color} onChange={e => setProp('color', e.target.value)} />
              </div>
              <div className="panel-field">
                <label>Operación</label>
                <select value={sel.operacion} onChange={e => setProp('operacion', e.target.value)}>
                  <option value="suma">Suma (Σ)</option>
                  <option value="resta">Resta (−)</option>
                  <option value="multiplicacion">Multiplicación (×)</option>
                </select>
              </div>
              <div className="panel-field">
                <label>Target (resultado esperado)</label>
                <input type="number" value={sel.target} onChange={e => setProp('target', +e.target.value)} />
              </div>
              <div className="panel-field">
                <label>Rotación (°)</label>
                <input type="number" value={sel.rotation ?? 0} min={-180} max={180}
                  onChange={e => setProp('rotation', +e.target.value)} />
              </div>
              <div className="panel-nodes-section">
                <label>Nodos de esta figura</label>
                {selNodes.length === 0 ? (
                  <p className="panel-no-nodes">Sin intersecciones aún — superpón otra figura</p>
                ) : (
                  <div className="panel-node-chips">
                    {selNodes.map(n => (
                      <span key={n.id} className="nchip shared">N{n.id} 🟡</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="panel-empty">
              <div className="panel-hint">
                <div className="hint-step"><span>Elige una figura y arrastra en el canvas para crearla</span></div>
                <div className="hint-step"><span>Superpón figuras — las intersecciones se detectan automáticamente</span></div>
                <div className="hint-step"><span>Selecciona una figura para editar propiedades</span></div>
                <div className="hint-step"><span>Arrastra las esquinas <b>azules</b> para redimensionar</span></div>
                <div className="hint-step"><span>Arrastra el handle <b>morado ↻</b> para rotar</span></div>
                <div className="hint-step"><span>Verifica si existe solución antes de guardar</span></div>
              </div>
            </div>
          )}

          <div className="panel-footer">
            {nodes.length > 0 && (
              <div className="nodes-summary">
                <span>🟡 {sharedNodes} nodos de intersección</span>
              </div>
            )}
            <button className="btn btn-full" onClick={verify}
              disabled={!shapes.length || !numberSet.length}
              style={{ marginTop: '.5rem' }}>
              🔍 Verificar Solución
            </button>
            {!numberSet.length && shapes.length > 0 && (
              <p className="panel-warn">⚠️ Define el número de conjunto arriba para poder verificar</p>
            )}
            {result && (
              <div className={`solver-badge ${result.hasSolution ? 'ok' : 'fail'}`}>
                {result.hasSolution ? (
                  <>
                    <div className="solver-ok-title">Solución válida encontrada</div>
                    <div className="sol-detail">
                      {solutionEntries.map(([k, v]) => (
                        <span key={k} className="sol-entry">N{k}={v}</span>
                      ))}
                    </div>
                    <div className="solver-ok-sub">El memoreto se puede guardar ↑</div>
                  </>
                ) : (
                  <span>{result.message || 'Sin solución con el número de conjunto actual — ajusta los targets o el número de conjunto'}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="canvas-legend">
        <span><span className="leg-dot gold" />Nodo de intersección</span>
        <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '.75rem' }}>
          {shapes.length} figura{shapes.length !== 1 ? 's' : ''} · {nodes.length} nodo{nodes.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
