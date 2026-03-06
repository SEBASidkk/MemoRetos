
import { useState, useRef, useCallback } from "react";
import { solve } from "../utils/solver";

const W = 560;
const H = 390;
const MERGE_DIST = 15;
const MIN_SIZE   = 40;

const COLORS = ["#8B5CF6", "#06B6D4", "#EF4444", "#10B981", "#F59E0B", "#EC4899", "#F97316", "#14B8A6"];

const EMPTY_SHAPES = [];
const EMPTY_NUMBER_SET = [];

const TOOLS = [
  { id: "triangulo",  icon: "▲", label: "Triángulo" },
  { id: "rectangulo", icon: "▬", label: "Rectángulo" },
  { id: "circulo",    icon: "◯", label: "Círculo" },
  { id: "pentagono",  icon: "⬠", label: "Pentágono" },
];


function getVerts(s) {
  const { x, y, w, h, type } = s;
  if (type === "triangulo")  return [[x + w / 2, y], [x, y + h], [x + w, y + h]];
  if (type === "rectangulo") return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  if (type === "circulo") {
    const cx = x + w / 2, cy = y + h / 2;
    return Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return [cx + (w / 2) * Math.cos(a), cy + (h / 2) * Math.sin(a)];
    });
  }
  if (type === "pentagono") {
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
    return Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  }
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

function segIntersect(a1, a2, b1, b2) {
  const dx1 = a2[0] - a1[0], dy1 = a2[1] - a1[1];
  const dx2 = b2[0] - b1[0], dy2 = b2[1] - b1[1];
  const d = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(d) < 1e-8) return null;
  const t = ((b1[0] - a1[0]) * dy2 - (b1[1] - a1[1]) * dx2) / d;
  const u = ((b1[0] - a1[0]) * dy1 - (b1[1] - a1[1]) * dx1) / d;
  if (t > 0.005 && t < 0.995 && u > 0.005 && u < 0.995)
    return [a1[0] + t * dx1, a1[1] + t * dy1];
  return null;
}

function detectNodes(shapes) {
  const nodes = [];
  let nid = 1;

  const addOrMerge = (x, y, ...ids) => {
    const ex = nodes.find(n => Math.hypot(n.x - x, n.y - y) < MERGE_DIST);
    if (ex) {
      ids.forEach(id => { if (!ex.shapeIds.includes(id)) ex.shapeIds.push(id); });
    } else {
      nodes.push({ id: nid++, x: Math.round(x), y: Math.round(y), shapeIds: [...ids] });
    }
  };

  for (let i = 0; i < shapes.length; i++) {
    const va = getVerts(shapes[i]);
    const ea = va.map((v, k) => [v, va[(k + 1) % va.length]]);

    for (let j = i + 1; j < shapes.length; j++) {
      const vb = getVerts(shapes[j]);
      const eb = vb.map((v, k) => [v, vb[(k + 1) % vb.length]]);

      ea.forEach(([a1, a2]) =>
        eb.forEach(([b1, b2]) => {
          const pt = segIntersect(a1, a2, b1, b2);
          if (pt) addOrMerge(pt[0], pt[1], shapes[i].id, shapes[j].id);
        })
      );
    }
  }

  return nodes;
}

function buildFigures(shapes, nodes) {
  return shapes.map((s, idx) => ({
    id: idx + 1,
    type: s.type,
    color: s.color,
    operacion: s.operacion,
    target: s.target,
    nodos: nodes.filter(n => n.shapeIds.includes(s.id)).map(n => n.id),
    _geo: { x: Math.round(s.x), y: Math.round(s.y), w: Math.round(s.w), h: Math.round(s.h) },
  }));
}

export function figuraToShapes(figuras) {
  return figuras
    .filter(f => f._geo)
    .map(f => ({
      id: f.id,
      type: f.type,
      color: f.color,
      operacion: f.operacion,
      target: f.target,
      ...f._geo,
    }));
}


function ShapeEl({ shape, selected, onMouseDown }) {
  const verts = getVerts(shape);
  const strokeW = selected ? 3 : 2;
  const dash    = selected ? "8 4" : undefined;
  const fill    = shape.color + "28";
  const common  = { fill, stroke: shape.color, strokeWidth: strokeW, strokeDasharray: dash,
                    onMouseDown, style: { cursor: "move", userSelect: "none" } };

  if (shape.type === "circulo") {
    const cx = shape.x + shape.w / 2, cy = shape.y + shape.h / 2;
    return <ellipse cx={cx} cy={cy} rx={shape.w / 2} ry={shape.h / 2} {...common} />;
  }
  return <polygon points={verts.map(v => v.join(",")).join(" ")} {...common} />;
}

export default function MemoCanvas({ onChange, numberSet = EMPTY_NUMBER_SET, initialShapes = EMPTY_SHAPES }) {
  const [shapes,   setShapes]   = useState(initialShapes);
  const [tool,     setTool]     = useState("select");
  const [selId,    setSelId]    = useState(null);
  const [drag,     setDrag]     = useState(null);
  const [nodes,    setNodes]    = useState(() => detectNodes(initialShapes));
  const [result,   setResult]   = useState(null);
  const [colorIdx, setColorIdx] = useState(0);
  const svgRef = useRef();

  const svgPt = e => {
    const r = svgRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const refresh = useCallback((sh) => {
    const n = detectNodes(sh);
    setNodes(n);
    setResult(null);
    onChange?.(buildFigures(sh, n), n, null);
  }, [onChange]);


  const onSvgDown = e => {
    if (tool === "select") { setSelId(null); return; }
    const [x, y] = svgPt(e);
    setDrag({
      type: "create",
      start: [x, y],
      shape: {
        id: Date.now(), type: tool,
        color: COLORS[colorIdx % COLORS.length],
        operacion: "suma", target: 10,
        x, y, w: 0, h: 0,
      },
    });
  };

  const onShapeDown = (e, s) => {
    e.stopPropagation();
    if (tool !== "select") return;
    setSelId(s.id);
    const [mx, my] = svgPt(e);
    setDrag({ type: "move", id: s.id, ox: mx - s.x, oy: my - s.y });
  };

  const onHandleDown = (e, s, corner) => {
    e.stopPropagation();
    const [mx, my] = svgPt(e);
    setDrag({ type: "resize", id: s.id, corner, mx0: mx, my0: my,
              ox: s.x, oy: s.y, ow: s.w, oh: s.h });
  };

  const onMove = e => {
    if (!drag) return;
    const [mx, my] = svgPt(e);

    if (drag.type === "create") {
      const x = Math.min(drag.start[0], mx), y = Math.min(drag.start[1], my);
      const w = Math.abs(mx - drag.start[0]), h = Math.abs(my - drag.start[1]);
      setDrag(d => ({ ...d, shape: { ...d.shape, x, y, w, h } }));
    }

    if (drag.type === "move") {
      setShapes(ss => ss.map(s => s.id === drag.id
        ? { ...s, x: mx - drag.ox, y: my - drag.oy } : s));
    }

    if (drag.type === "resize") {
      const dx = mx - drag.mx0, dy = my - drag.my0;
      setShapes(ss => ss.map(s => {
        if (s.id !== drag.id) return s;
        let { x, y, w, h } = { x: drag.ox, y: drag.oy, w: drag.ow, h: drag.oh };
        if (drag.corner === "tl") { x += dx; y += dy; w -= dx; h -= dy; }
        if (drag.corner === "tr") { y += dy; w += dx; h -= dy; }
        if (drag.corner === "br") { w += dx; h += dy; }
        if (drag.corner === "bl") { x += dx; w -= dx; h += dy; }
        return { ...s, x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) };
      }));
    }
  };

  const onUp = () => {
    if (!drag) return;
    if (drag.type === "create") {
      if (drag.shape.w > MIN_SIZE && drag.shape.h > MIN_SIZE) {
        const ns = [...shapes, drag.shape];
        setShapes(ns);
        refresh(ns);
        setSelId(drag.shape.id);
        setColorIdx(c => c + 1);
      }
      setTool("select");
    }
    if (drag.type === "move" || drag.type === "resize") {
      refresh(shapes);
    }
    setDrag(null);
  };

  const deleteShape = () => {
    const ns = shapes.filter(s => s.id !== selId);
    setShapes(ns); refresh(ns); setSelId(null);
  };

  const setProp = (field, value) => {
    const ns = shapes.map(s => s.id === selId ? { ...s, [field]: value } : s);
    setShapes(ns); refresh(ns);
  };

  const verify = () => {
    const figs = buildFigures(shapes, nodes);
    if (!numberSet.length) {
      setResult({ hasSolution: false, message: "Define el número de conjunto primero" });
      return;
    }
    if (!nodes.length) {
      setResult({ hasSolution: false, message: "No hay intersecciones — superpón figuras para crear nodos" });
      return;
    }
    const r = solve(figs, numberSet);
    setResult(r);
    onChange?.(figs, nodes, r.hasSolution ? r.solution : null);
  };


  const liveShapes = (drag?.type === "create" && drag.shape.w > MIN_SIZE && drag.shape.h > MIN_SIZE)
    ? [...shapes, drag.shape] : shapes;
  const liveNodes = drag?.type === "create" ? detectNodes(liveShapes) : nodes;
  const sel = shapes.find(s => s.id === selId);

  return (
    <div className="memo-canvas-wrap">

      {/* ── Barra de herramientas ── */}
      <div className="canvas-toolbar">
        <button className={`ctool ${tool === "select" ? "active" : ""}`} onClick={() => setTool("select")}>
          ↖ Seleccionar
        </button>
        <span className="ctool-sep" />
        {TOOLS.map(t => (
          <button key={t.id}
            className={`ctool ${tool === t.id ? "active" : ""}`}
            onClick={() => setTool(t.id)}
            title={t.label}>
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

      {/* ── Cuerpo ── */}
      <div className="canvas-body">

        {/* SVG Canvas */}
        <svg
          ref={svgRef} width={W} height={H}
          className="memo-svg"
          onMouseDown={onSvgDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          style={{ cursor: tool === "select" ? "default" : "crosshair" }}
        >
          {/* Grid de fondo */}
          <defs>
            <pattern id="cgrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#cgrid)" rx={6} />

          {/* Figuras */}
          {liveShapes.map(s => (
            <ShapeEl key={s.id} shape={s} selected={s.id === selId}
              onMouseDown={e => onShapeDown(e, s)} />
          ))}

          {/* Labels de target en cada figura */}
          {liveShapes.map(s => {
            const vs = getVerts(s);
            const cx = vs.reduce((a, v) => a + v[0], 0) / vs.length;
            const cy = vs.reduce((a, v) => a + v[1], 0) / vs.length;
            return (
              <g key={"lbl" + s.id} style={{ pointerEvents: "none" }}>
                <rect x={cx - 20} y={cy - 10} width={40} height={20} rx={4}
                  fill="#0f172a" fillOpacity={0.7} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fill={s.color} fontWeight="600">
                  {s.operacion === "suma" ? "Σ" : s.operacion === "multiplicacion" ? "×" : "−"}={s.target}
                </text>
              </g>
            );
          })}

          {/* Handles de resize para figura seleccionada */}
          {sel && [
            ["tl", sel.x, sel.y], ["tr", sel.x + sel.w, sel.y],
            ["br", sel.x + sel.w, sel.y + sel.h], ["bl", sel.x, sel.y + sel.h],
          ].map(([corner, cx, cy]) => (
            <circle key={corner} cx={cx} cy={cy} r={7}
              fill="#0f172a" stroke="#38bdf8" strokeWidth={2}
              style={{ cursor: "nwse-resize" }}
              onMouseDown={e => onHandleDown(e, sel, corner)} />
          ))}

          {/* Nodos de intersección */}
          {liveNodes.map(n => (
            <g key={n.id} style={{ pointerEvents: "none" }}>
              <circle cx={n.x} cy={n.y} r={14}
                fill={n.shapeIds.length > 1 ? "#78350f" : "#1e3a5f"}
                stroke={n.shapeIds.length > 1 ? "#fbbf24" : "#38bdf8"}
                strokeWidth={2.5} />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fontWeight="bold" fill="#fff">
                {n.id}
              </text>
            </g>
          ))}
        </svg>

        {/* ── Panel de propiedades ── */}
        <div className="canvas-panel">
          {sel ? (
            <div className="panel-props">
              <div className="panel-title">
                Figura {shapes.findIndex(s => s.id === selId) + 1}
                <span className="panel-type-badge">{sel.type}</span>
              </div>

              <div className="panel-field">
                <label htmlFor="panel-color">Color</label>
                <input id="panel-color" type="color" value={sel.color} onChange={e => setProp("color", e.target.value)} />
              </div>

              <div className="panel-field">
                <label htmlFor="panel-op">Operación</label>
                <select id="panel-op" value={sel.operacion} onChange={e => setProp("operacion", e.target.value)}>
                  <option value="suma">Suma (Σ)</option>
                  <option value="resta">Resta (−)</option>
                  <option value="multiplicacion">Multiplicación (×)</option>
                </select>
              </div>

              <div className="panel-field">
                <label htmlFor="panel-target">Target (resultado esperado)</label>
                <input id="panel-target" type="number" value={sel.target}
                  onChange={e => setProp("target", Number(e.target.value))} />
              </div>

              <div className="panel-nodes-section">
                <label>Nodos de esta figura</label>
                {nodes.filter(n => n.shapeIds.includes(selId)).length === 0
                  ? <p className="panel-no-nodes">Sin intersecciones aún — superpón otra figura</p>
                  : <div className="panel-node-chips">
                      {nodes.filter(n => n.shapeIds.includes(selId)).map(n => (
                        <span key={n.id} className={`nchip ${n.shapeIds.length > 1 ? "shared" : "solo"}`}>
                          N{n.id} {n.shapeIds.length > 1 ? "🟡" : "🔵"}
                        </span>
                      ))}
                    </div>
                }
              </div>
            </div>
          ) : (
            <div className="panel-empty">
              <div className="panel-hint">
                <div className="hint-step"> <span>Elige una figura y arrastra en el canvas para crearla</span></div>
                <div className="hint-step"> <span>Superpón figuras — las intersecciones se detectan automáticamente</span></div>
                <div className="hint-step"> <span>Selecciona una figura para editar propiedades</span></div>
                <div className="hint-step"> <span>Arrastra las esquinas <b>azules</b> para redimensionar</span></div>
                <div className="hint-step"> <span>Verifica si existe solución antes de guardar</span></div>
              </div>
            </div>
          )}

          {/* Footer del panel */}
          <div className="panel-footer">
            {nodes.length > 0 && (
              <div className="nodes-summary">
                <span>🔵 {nodes.filter(n => n.shapeIds.length === 1).length} exclusivos</span>
                <span>🟡 {nodes.filter(n => n.shapeIds.length > 1).length} compartidos</span>
              </div>
            )}

            <button className="btn btn-full"
              onClick={verify}
              disabled={!shapes.length || !numberSet.length}
              style={{ marginTop: ".5rem" }}>
              🔍 Verificar Solución
            </button>

            {!numberSet.length && shapes.length > 0 && (
              <p className="panel-warn">⚠️ Define el número de conjunto arriba para poder verificar</p>
            )}

            {result && (
              <div className={`solver-badge ${result.hasSolution ? "ok" : "fail"}`}>
                {result.hasSolution ? (
                  <>
                    <div className="solver-ok-title">Solución válida encontrada</div>
                    <div className="sol-detail">
                      {Object.entries(result.solution).map(([k, v]) => (
                        <span key={k} className="sol-entry">N{k}={v}</span>
                      ))}
                    </div>
                    <div className="solver-ok-sub">El memoreto se puede guardar ↑</div>
                  </>
                ) : (
                  <span>{result.message || "Sin solución con el número de conjunto actual — ajusta los targets o el número de conjunto"}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Leyenda ── */}
      <div className="canvas-legend">
        <span><span className="leg-dot blue" />Nodo exclusivo</span>
        <span><span className="leg-dot gold" />Nodo compartido (intersección)</span>
        <span style={{ marginLeft: "auto", color: "#475569", fontSize: ".75rem" }}>
          {shapes.length} figura{shapes.length !== 1 ? "s" : ""} · {nodes.length} nodo{nodes.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
