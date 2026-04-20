import type { Shape, CanvasNode, Figure } from './types';

export const CANVAS_W = 700;
export const CANVAS_H = 440;
export const MIN_SIZE = 20;

export const COLORS = [
  '#38bdf8', '#f472b6', '#4ade80', '#fb923c',
  '#a78bfa', '#facc15', '#34d399', '#f87171',
];

export const TOOLS = [
  { id: 'circulo',    label: 'Círculo',    icon: '⬭' },
  { id: 'elipse',     label: 'Elipse',     icon: '⬯' },
  { id: 'triangulo',  label: 'Triángulo',  icon: '△' },
  { id: 'cuadrado',   label: 'Cuadrado',   icon: '□' },
  { id: 'rectangulo', label: 'Rectángulo', icon: '▭' },
  { id: 'hexagono',   label: 'Hexágono',   icon: '⬡' },
  { id: 'pentagono',  label: 'Pentágono',  icon: '⬠' },
];

export function centerX(s: Shape): number { return s.x + s.w / 2; }
export function centerY(s: Shape): number { return s.y + s.h / 2; }

// ── Rotation helpers ──────────────────────────────────────────────────────────

export function rotatePoint(
  px: number, py: number,
  cx: number, cy: number,
  deg: number,
): [number, number] {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const dx = px - cx, dy = py - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

/** Position of the rotation handle (above top-center of the shape, in world space). */
export function getRotationHandlePos(s: Shape): [number, number] {
  const cx = centerX(s), cy = centerY(s);
  // 28px above the top edge in local space, then rotate to world space
  return rotatePoint(cx, s.y - 28, cx, cy, s.rotation ?? 0);
}

// ── SVG polygon points (for rendering, respects rotation via SVG transform) ──

export function getPoints(s: Shape): string {
  if (s.type === 'triangulo') {
    return `${s.x},${s.y + s.h} ${s.x + s.w},${s.y + s.h} ${s.x + s.w / 2},${s.y}`;
  }
  if (s.type === 'hexagono' || s.type === 'pentagono') {
    const n = s.type === 'hexagono' ? 6 : 5;
    const cx = centerX(s), cy = centerY(s), rx = s.w / 2, ry = s.h / 2;
    return Array.from({ length: n }, (_, k) => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
      return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
    }).join(' ');
  }
  return `${s.x},${s.y} ${s.x + s.w},${s.y} ${s.x + s.w},${s.y + s.h} ${s.x},${s.y + s.h}`;
}

export function getHandles(s: Shape): { corner: string; cx: number; cy: number }[] {
  const cx = centerX(s), cy = centerY(s), rot = s.rotation ?? 0;
  return [
    { corner: 'tl', ...( ([bx, by]) => ({ cx: bx, cy: by }) )(rotatePoint(s.x,       s.y,       cx, cy, rot)) },
    { corner: 'tr', ...( ([bx, by]) => ({ cx: bx, cy: by }) )(rotatePoint(s.x + s.w, s.y,       cx, cy, rot)) },
    { corner: 'br', ...( ([bx, by]) => ({ cx: bx, cy: by }) )(rotatePoint(s.x + s.w, s.y + s.h, cx, cy, rot)) },
    { corner: 'bl', ...( ([bx, by]) => ({ cx: bx, cy: by }) )(rotatePoint(s.x,       s.y + s.h, cx, cy, rot)) },
  ];
}

// ── Geometry helpers (rotation-aware) ────────────────────────────────────────

function isEllipseType(type: string): boolean {
  return type === 'circulo' || type === 'elipse';
}

/** Unrotated polygon vertices in local space, then rotated to world space. */
function getVertices(s: Shape): [number, number][] {
  const cx = centerX(s), cy = centerY(s), rx = s.w / 2, ry = s.h / 2;
  const rot = s.rotation ?? 0;

  let local: [number, number][];
  if (s.type === 'triangulo') {
    local = [[s.x, s.y + s.h], [s.x + s.w, s.y + s.h], [s.x + s.w / 2, s.y]];
  } else if (s.type === 'hexagono') {
    local = Array.from({ length: 6 }, (_, k) => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / 6;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as [number, number];
    });
  } else if (s.type === 'pentagono') {
    local = Array.from({ length: 5 }, (_, k) => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / 5;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as [number, number];
    });
  } else {
    local = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]];
  }

  return rot === 0 ? local : local.map(([px, py]) => rotatePoint(px, py, cx, cy, rot));
}

/** Segment-segment intersection. Returns point or null. */
function segSegIntersect(
  p1: [number, number], p2: [number, number],
  p3: [number, number], p4: [number, number],
): [number, number] | null {
  const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1];
  const d2x = p4[0] - p3[0], d2y = p4[1] - p3[1];
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;
  const dx = p3[0] - p1[0], dy = p3[1] - p1[1];
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;
  if (t >= -1e-6 && t <= 1 + 1e-6 && u >= -1e-6 && u <= 1 + 1e-6) {
    return [p1[0] + t * d1x, p1[1] + t * d1y];
  }
  return null;
}

/**
 * Ellipse-segment intersections in world space, accounting for ellipse rotation.
 * Transforms segment into ellipse local frame, solves, transforms results back.
 */
function ellipseSegIntersect(
  cx: number, cy: number, rx: number, ry: number, rot: number,
  p1: [number, number], p2: [number, number],
): [number, number][] {
  // Transform p1, p2 into unrotated ellipse frame
  const unrot = -rot;
  const lp1 = rotatePoint(p1[0], p1[1], cx, cy, unrot);
  const lp2 = rotatePoint(p2[0], p2[1], cx, cy, unrot);

  const ux1 = (lp1[0] - cx) / rx, uy1 = (lp1[1] - cy) / ry;
  const ux2 = (lp2[0] - cx) / rx, uy2 = (lp2[1] - cy) / ry;
  const dx = ux2 - ux1, dy = uy2 - uy1;
  const a = dx * dx + dy * dy;
  if (a < 1e-10) return [];
  const b = 2 * (ux1 * dx + uy1 * dy);
  const c = ux1 * ux1 + uy1 * uy1 - 1;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const sq = Math.sqrt(Math.max(0, disc));
  const results: [number, number][] = [];
  for (const sign of [-1, 1]) {
    const t = (-b + sign * sq) / (2 * a);
    if (t >= -1e-6 && t <= 1 + 1e-6) {
      // Point in unrotated ellipse frame
      const wx = lp1[0] + t * (lp2[0] - lp1[0]);
      const wy = lp1[1] + t * (lp2[1] - lp1[1]);
      // Rotate back to world frame
      results.push(rotatePoint(wx, wy, cx, cy, rot));
    }
  }
  return results;
}

/** Exact circle-circle intersection points. */
function circleCircleIntersections(a: Shape, b: Shape): [number, number][] {
  const ax = centerX(a), ay = centerY(a), ar = a.w / 2;
  const bx = centerX(b), by = centerY(b), br = b.w / 2;
  const dx = bx - ax, dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > ar + br + 0.01 || d < Math.abs(ar - br) - 0.01 || d < 0.01) return [];
  const aVal = (ar * ar - br * br + d * d) / (2 * d);
  const hSq = ar * ar - aVal * aVal;
  if (hSq < 0) return [];
  const h = Math.sqrt(hSq);
  const mx = ax + aVal * dx / d, my = ay + aVal * dy / d;
  return [
    [mx + h * dy / d, my - h * dx / d],
    [mx - h * dy / d, my + h * dx / d],
  ];
}

/** Remove duplicate points within threshold pixels. */
function dedupe(pts: [number, number][], thr = 5): [number, number][] {
  const out: [number, number][] = [];
  for (const pt of pts) {
    if (!out.some(p => Math.abs(p[0] - pt[0]) < thr && Math.abs(p[1] - pt[1]) < thr)) {
      out.push(pt);
    }
  }
  return out;
}

/** All geometric edge-intersection points between two shapes (rotation-aware). */
function getIntersectionPoints(a: Shape, b: Shape): [number, number][] {
  const aEll = isEllipseType(a.type), bEll = isEllipseType(b.type);
  const aRot = a.rotation ?? 0, bRot = b.rotation ?? 0;

  if (aEll && bEll) {
    const aCirc = Math.abs(a.w - a.h) < 4 && aRot === 0;
    const bCirc = Math.abs(b.w - b.h) < 4 && bRot === 0;
    if (aCirc && bCirc) return circleCircleIntersections(a, b);
    // Approximate ellipse A as 64-gon in world space, intersect edges with ellipse B
    const N = 64;
    const cax = centerX(a), cay = centerY(a), rax = a.w / 2, ray = a.h / 2;
    const approx: [number, number][] = Array.from({ length: N }, (_, k) => {
      const ang = (2 * Math.PI * k) / N;
      return rotatePoint(cax + rax * Math.cos(ang), cay + ray * Math.sin(ang), cax, cay, aRot);
    });
    const cbx = centerX(b), cby = centerY(b), rbx = b.w / 2, rby = b.h / 2;
    const pts: [number, number][] = [];
    for (let i = 0; i < N; i++)
      pts.push(...ellipseSegIntersect(cbx, cby, rbx, rby, bRot, approx[i], approx[(i + 1) % N]));
    return dedupe(pts);
  }

  if (aEll && !bEll) {
    const vb = getVertices(b);
    const cx = centerX(a), cy = centerY(a), rx = a.w / 2, ry = a.h / 2;
    const pts: [number, number][] = [];
    for (let i = 0; i < vb.length; i++)
      pts.push(...ellipseSegIntersect(cx, cy, rx, ry, aRot, vb[i], vb[(i + 1) % vb.length]));
    return dedupe(pts);
  }

  if (!aEll && bEll) {
    const va = getVertices(a);
    const cx = centerX(b), cy = centerY(b), rx = b.w / 2, ry = b.h / 2;
    const pts: [number, number][] = [];
    for (let i = 0; i < va.length; i++)
      pts.push(...ellipseSegIntersect(cx, cy, rx, ry, bRot, va[i], va[(i + 1) % va.length]));
    return dedupe(pts);
  }

  // Both polygons
  const va = getVertices(a), vb = getVertices(b);
  const pts: [number, number][] = [];
  for (let i = 0; i < va.length; i++) {
    const a1 = va[i], a2 = va[(i + 1) % va.length];
    for (let j = 0; j < vb.length; j++) {
      const pt = segSegIntersect(a1, a2, vb[j], vb[(j + 1) % vb.length]);
      if (pt) pts.push(pt);
    }
  }
  return dedupe(pts);
}

export function detectNodes(shapes: Shape[]): CanvasNode[] {
  const nodes: CanvasNode[] = [];
  let nodeId = 1;
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      for (const [x, y] of getIntersectionPoints(shapes[i], shapes[j])) {
        nodes.push({ id: nodeId++, x, y, shapeIds: [shapes[i].id, shapes[j].id] });
      }
    }
  }
  return nodes;
}

export function buildFigures(shapes: Shape[], nodes: CanvasNode[]): Figure[] {
  return shapes.map(s => ({
    id:        s.id,
    type:      s.type,
    color:     s.color,
    operacion: s.operacion,
    target:    s.target,
    nodos:     nodes.filter(n => n.shapeIds.includes(s.id)).map(n => n.id),
    _geo:      { x: s.x, y: s.y, w: s.w, h: s.h, rotation: s.rotation },
  }));
}

// ── Unity → Web conversion ────────────────────────────────────────────────────

type StoredFigura = {
  _geo?: { x: number; y: number; w: number; h: number; rotation?: number };
  center?: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
  id: number;
  type: Shape['type'];
  color: string;
  operacion: Shape['operacion'];
  target: number;
  nodos?: number[];
};

const U_SCALE = 60;
const SVG_CX  = CANVAS_W / 2;
const SVG_CY  = CANVAS_H / 2;

function unityToGeo(f: StoredFigura): { x: number; y: number; w: number; h: number; rotation?: number } {
  if (f._geo) return f._geo;
  if (f.center && f.size) {
    const w = f.size[0] * U_SCALE;
    const h = f.size[1] * U_SCALE;
    const cx = SVG_CX + f.center[0] * U_SCALE;
    const cy = SVG_CY - f.center[1] * U_SCALE;
    return { x: cx - w / 2, y: cy - h / 2, w, h, rotation: f.rotation };
  }
  return { x: 0, y: 0, w: 80, h: 60 };
}

export function figuraToShapes(figuras: StoredFigura[]): Shape[] {
  return figuras.map(f => {
    const geo = unityToGeo(f);
    return {
      id:        f.id,
      type:      f.type,
      color:     f.color,
      operacion: f.operacion,
      target:    f.target,
      x:         geo.x,
      y:         geo.y,
      w:         geo.w,
      h:         geo.h,
      rotation:  geo.rotation,
    };
  });
}
