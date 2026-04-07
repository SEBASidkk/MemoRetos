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
  { id: 'triangulo',  label: 'Triángulo',  icon: '△' },
  { id: 'cuadrado',   label: 'Cuadrado',   icon: '□' },
  { id: 'rectangulo', label: 'Rectángulo', icon: '▭' },
];

export function centerX(s: Shape): number { return s.x + s.w / 2; }
export function centerY(s: Shape): number { return s.y + s.h / 2; }

export function getPoints(s: Shape): string {
  if (s.type === 'triangulo') {
    return `${s.x},${s.y + s.h} ${s.x + s.w},${s.y + s.h} ${s.x + s.w / 2},${s.y}`;
  }
  return `${s.x},${s.y} ${s.x + s.w},${s.y} ${s.x + s.w},${s.y + s.h} ${s.x},${s.y + s.h}`;
}

export function getHandles(s: Shape): { corner: string; cx: number; cy: number }[] {
  return [
    { corner: 'tl', cx: s.x,        cy: s.y },
    { corner: 'tr', cx: s.x + s.w,  cy: s.y },
    { corner: 'br', cx: s.x + s.w,  cy: s.y + s.h },
    { corner: 'bl', cx: s.x,        cy: s.y + s.h },
  ];
}

function overlaps(a: Shape, b: Shape): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w &&
         a.y < b.y + b.h && b.y < a.y + a.h;
}

function intersectionCenter(a: Shape, b: Shape): [number, number] {
  const x1 = Math.max(a.x, b.x), x2 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.max(a.y, b.y), y2 = Math.min(a.y + a.h, b.y + b.h);
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

export function detectNodes(shapes: Shape[]): CanvasNode[] {
  const nodes: CanvasNode[] = [];
  let nodeId = 1;

  // Exclusive node for every shape (its non-shared interior)
  for (const s of shapes) {
    nodes.push({ id: nodeId++, x: centerX(s), y: centerY(s), shapeIds: [s.id] });
  }

  // Shared node for each overlapping pair
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      if (overlaps(shapes[i], shapes[j])) {
        const [cx, cy] = intersectionCenter(shapes[i], shapes[j]);
        nodes.push({ id: nodeId++, x: cx, y: cy, shapeIds: [shapes[i].id, shapes[j].id] });
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
    _geo:      { x: s.x, y: s.y, w: s.w, h: s.h },
  }));
}

type StoredFigura = {
  _geo?: { x: number; y: number; w: number; h: number };
  id: number;
  type: Shape['type'];
  color: string;
  operacion: Shape['operacion'];
  target: number;
  nodos?: number[];
};

export function figuraToShapes(figuras: StoredFigura[]): Shape[] {
  return figuras.map(f => ({
    id:        f.id,
    type:      f.type,
    color:     f.color,
    operacion: f.operacion,
    target:    f.target,
    x:         f._geo?.x ?? 0,
    y:         f._geo?.y ?? 0,
    w:         f._geo?.w ?? 80,
    h:         f._geo?.h ?? 60,
  }));
}
