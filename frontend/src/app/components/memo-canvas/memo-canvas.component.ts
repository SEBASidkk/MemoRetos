import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ViewChild, ElementRef, SimpleChanges } from '@angular/core';
import { solve } from '../../utils/solver';

const W = 560;
const H = 390;
const MERGE_DIST = 15;
const MIN_SIZE = 40;

const COLORS = ['#8B5CF6', '#06B6D4', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#F97316', '#14B8A6'];

const TOOLS = [
  { id: 'triangulo', icon: '▲', label: 'Triángulo' },
  { id: 'rectangulo', icon: '▬', label: 'Rectángulo' },
  { id: 'circulo', icon: '◯', label: 'Círculo' },
  { id: 'pentagono', icon: '⬠', label: 'Pentágono' },
];

interface Shape {
  id: number;
  type: string;
  color: string;
  operacion: string;
  target: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Node {
  id: number;
  x: number;
  y: number;
  shapeIds: number[];
}

interface DragState {
  type: 'create' | 'move' | 'resize';
  start?: [number, number];
  shape?: Shape;
  id?: number;
  ox?: number;
  oy?: number;
  corner?: string;
  mx0?: number;
  my0?: number;
  ow?: number;
  oh?: number;
}

function getVerts(s: Shape): [number, number][] {
  const { x, y, w, h, type } = s;
  if (type === 'triangulo') return [[x + w / 2, y], [x, y + h], [x + w, y + h]];
  if (type === 'rectangulo') return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  if (type === 'circulo') {
    const cx = x + w / 2, cy = y + h / 2;
    return Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return [cx + (w / 2) * Math.cos(a), cy + (h / 2) * Math.sin(a)] as [number, number];
    });
  }
  if (type === 'pentagono') {
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
    return Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
    });
  }
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

function segIntersect(a1: [number,number], a2: [number,number], b1: [number,number], b2: [number,number]): [number,number] | null {
  const dx1 = a2[0]-a1[0], dy1 = a2[1]-a1[1];
  const dx2 = b2[0]-b1[0], dy2 = b2[1]-b1[1];
  const d = dx1*dy2 - dy1*dx2;
  if (Math.abs(d) < 1e-8) return null;
  const t = ((b1[0]-a1[0])*dy2 - (b1[1]-a1[1])*dx2) / d;
  const u = ((b1[0]-a1[0])*dy1 - (b1[1]-a1[1])*dx1) / d;
  if (t > 0.005 && t < 0.995 && u > 0.005 && u < 0.995)
    return [a1[0]+t*dx1, a1[1]+t*dy1];
  return null;
}

function detectNodes(shapes: Shape[]): Node[] {
  const nodes: Node[] = [];
  let nid = 1;

  const addOrMerge = (x: number, y: number, ...ids: number[]) => {
    const ex = nodes.find(n => Math.hypot(n.x - x, n.y - y) < MERGE_DIST);
    if (ex) {
      ids.forEach(id => { if (!ex.shapeIds.includes(id)) ex.shapeIds.push(id); });
    } else {
      nodes.push({ id: nid++, x: Math.round(x), y: Math.round(y), shapeIds: [...ids] });
    }
  };

  for (let i = 0; i < shapes.length; i++) {
    const va = getVerts(shapes[i]);
    const ea = va.map((v, k) => [v, va[(k + 1) % va.length]] as [[number,number],[number,number]]);
    for (let j = i + 1; j < shapes.length; j++) {
      const vb = getVerts(shapes[j]);
      const eb = vb.map((v, k) => [v, vb[(k + 1) % vb.length]] as [[number,number],[number,number]]);
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

function buildFigures(shapes: Shape[], nodes: Node[]) {
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

export function figuraToShapes(figuras: any[]): Shape[] {
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

@Component({
  selector: 'app-memo-canvas',
  imports: [],
  template: `
    <div class="memo-canvas-wrap">
      <!-- Toolbar -->
      <div class="canvas-toolbar">
        <button class="ctool" [class.active]="tool === 'select'" (click)="tool = 'select'">↖ Seleccionar</button>
        <span class="ctool-sep"></span>
        @for (t of tools; track t.id) {
          <button class="ctool" [class.active]="tool === t.id" (click)="tool = t.id" [title]="t.label">
            {{ t.icon }} {{ t.label }}
          </button>
        }
        @if (selId) {
          <span class="ctool-sep"></span>
          <button class="ctool danger" (click)="deleteShape()">🗑 Eliminar</button>
        }
      </div>

      <!-- Canvas body -->
      <div class="canvas-body">
        <svg #svgEl [attr.width]="W" [attr.height]="H" class="memo-svg"
          (mousedown)="onSvgDown($event)"
          (mousemove)="onMove($event)"
          (mouseup)="onUp()"
          (mouseleave)="onUp()"
          [style.cursor]="tool === 'select' ? 'default' : 'crosshair'">

          <defs>
            <pattern id="cgrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect [attr.width]="W" [attr.height]="H" fill="url(#cgrid)" rx="6" />

          <!-- Shapes -->
          @for (s of liveShapes; track s.id) {
            @if (s.type === 'circulo') {
              <ellipse
                [attr.cx]="s.x + s.w/2" [attr.cy]="s.y + s.h/2"
                [attr.rx]="s.w/2" [attr.ry]="s.h/2"
                [attr.fill]="s.color + '28'"
                [attr.stroke]="s.color"
                [attr.stroke-width]="s.id === selId ? 3 : 2"
                [attr.stroke-dasharray]="s.id === selId ? '8 4' : null"
                style="cursor:move;user-select:none"
                (mousedown)="onShapeDown($event, s)"
              />
            } @else {
              <polygon
                [attr.points]="getPoints(s)"
                [attr.fill]="s.color + '28'"
                [attr.stroke]="s.color"
                [attr.stroke-width]="s.id === selId ? 3 : 2"
                [attr.stroke-dasharray]="s.id === selId ? '8 4' : null"
                style="cursor:move;user-select:none"
                (mousedown)="onShapeDown($event, s)"
              />
            }
            <!-- Label -->
            <g style="pointer-events:none">
              <rect
                [attr.x]="centerX(s) - 20" [attr.y]="centerY(s) - 10"
                width="40" height="20" rx="4" fill="#0f172a" fill-opacity="0.7"
              />
              <text
                [attr.x]="centerX(s)" [attr.y]="centerY(s)"
                text-anchor="middle" dominant-baseline="middle"
                font-size="11" [attr.fill]="s.color" font-weight="600">
                {{ s.operacion === 'suma' ? 'Σ' : s.operacion === 'multiplicacion' ? '×' : '−' }}={{ s.target }}
              </text>
            </g>
          }

          <!-- Resize handles for selected shape -->
          @if (sel) {
            @for (h of getHandles(sel); track h.corner) {
              <circle
                [attr.cx]="h.cx" [attr.cy]="h.cy" r="7"
                fill="#0f172a" stroke="#38bdf8" stroke-width="2"
                style="cursor:nwse-resize"
                (mousedown)="onHandleDown($event, sel, h.corner)"
              />
            }
          }

          <!-- Intersection nodes -->
          @for (n of liveNodes; track n.id) {
            <g style="pointer-events:none">
              <circle
                [attr.cx]="n.x" [attr.cy]="n.y" r="14"
                [attr.fill]="n.shapeIds.length > 1 ? '#78350f' : '#1e3a5f'"
                [attr.stroke]="n.shapeIds.length > 1 ? '#fbbf24' : '#38bdf8'"
                stroke-width="2.5"
              />
              <text [attr.x]="n.x" [attr.y]="n.y" text-anchor="middle" dominant-baseline="middle"
                font-size="11" font-weight="bold" fill="#fff">{{ n.id }}</text>
            </g>
          }
        </svg>

        <!-- Properties panel -->
        <div class="canvas-panel">
          @if (sel) {
            <div class="panel-props">
              <div class="panel-title">
                Figura {{ shapeIndex(sel) + 1 }}
                <span class="panel-type-badge">{{ sel.type }}</span>
              </div>
              <div class="panel-field">
                <label>Color</label>
                <input type="color" [value]="sel.color" (input)="setProp('color', $any($event.target).value)" />
              </div>
              <div class="panel-field">
                <label>Operación</label>
                <select [value]="sel.operacion" (change)="setProp('operacion', $any($event.target).value)">
                  <option value="suma">Suma (Σ)</option>
                  <option value="resta">Resta (−)</option>
                  <option value="multiplicacion">Multiplicación (×)</option>
                </select>
              </div>
              <div class="panel-field">
                <label>Target (resultado esperado)</label>
                <input type="number" [value]="sel.target" (input)="setProp('target', +$any($event.target).value)" />
              </div>
              <div class="panel-nodes-section">
                <label>Nodos de esta figura</label>
                @if (selNodes.length === 0) {
                  <p class="panel-no-nodes">Sin intersecciones aún — superpón otra figura</p>
                } @else {
                  <div class="panel-node-chips">
                    @for (n of selNodes; track n.id) {
                      <span class="nchip" [class.shared]="n.shapeIds.length > 1" [class.solo]="n.shapeIds.length === 1">
                        N{{ n.id }} {{ n.shapeIds.length > 1 ? '🟡' : '🔵' }}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="panel-empty">
              <div class="panel-hint">
                <div class="hint-step"><span>Elige una figura y arrastra en el canvas para crearla</span></div>
                <div class="hint-step"><span>Superpón figuras — las intersecciones se detectan automáticamente</span></div>
                <div class="hint-step"><span>Selecciona una figura para editar propiedades</span></div>
                <div class="hint-step"><span>Arrastra las esquinas <b>azules</b> para redimensionar</span></div>
                <div class="hint-step"><span>Verifica si existe solución antes de guardar</span></div>
              </div>
            </div>
          }

          <div class="panel-footer">
            @if (nodes.length > 0) {
              <div class="nodes-summary">
                <span>🔵 {{ exclusiveNodes }} exclusivos</span>
                <span>🟡 {{ sharedNodes }} compartidos</span>
              </div>
            }
            <button class="btn btn-full" (click)="verify()" [disabled]="!shapes.length || !numberSet.length" style="margin-top:.5rem">
              🔍 Verificar Solución
            </button>
            @if (!numberSet.length && shapes.length > 0) {
              <p class="panel-warn">⚠️ Define el número de conjunto arriba para poder verificar</p>
            }
            @if (result) {
              <div class="solver-badge" [class.ok]="result.hasSolution" [class.fail]="!result.hasSolution">
                @if (result.hasSolution) {
                  <div class="solver-ok-title">Solución válida encontrada</div>
                  <div class="sol-detail">
                    @for (entry of solutionEntries; track entry[0]) {
                      <span class="sol-entry">N{{ entry[0] }}={{ entry[1] }}</span>
                    }
                  </div>
                  <div class="solver-ok-sub">El memoreto se puede guardar ↑</div>
                } @else {
                  <span>{{ result.message || 'Sin solución con el número de conjunto actual — ajusta los targets o el número de conjunto' }}</span>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="canvas-legend">
        <span><span class="leg-dot blue"></span>Nodo exclusivo</span>
        <span><span class="leg-dot gold"></span>Nodo compartido (intersección)</span>
        <span style="margin-left:auto;color:#475569;font-size:.75rem">
          {{ shapes.length }} figura{{ shapes.length !== 1 ? 's' : '' }} · {{ nodes.length }} nodo{{ nodes.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  `,
})
export class MemoCanvasComponent implements OnInit, OnChanges {
  @Input() numberSet: number[] = [];
  @Input() initialShapes: Shape[] = [];
  @Output() canvasChange = new EventEmitter<{ figures: any[], nodes: Node[], solution: any }>();

  @ViewChild('svgEl') svgElRef!: ElementRef<SVGSVGElement>;

  W = W; H = H;
  tools = TOOLS;

  shapes: Shape[] = [];
  tool = 'select';
  selId: number | null = null;
  drag: DragState | null = null;
  nodes: Node[] = [];
  result: any = null;
  colorIdx = 0;

  ngOnInit() {
    this.shapes = [...this.initialShapes];
    this.nodes = detectNodes(this.shapes);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialShapes'] && !changes['initialShapes'].firstChange) {
      this.shapes = [...this.initialShapes];
      this.nodes = detectNodes(this.shapes);
      this.result = null;
    }
  }

  get liveShapes(): Shape[] {
    if (this.drag?.type === 'create' && this.drag.shape &&
        this.drag.shape.w > MIN_SIZE && this.drag.shape.h > MIN_SIZE) {
      return [...this.shapes, this.drag.shape];
    }
    return this.shapes;
  }

  get liveNodes(): Node[] {
    if (this.drag?.type === 'create') {
      return detectNodes(this.liveShapes);
    }
    return this.nodes;
  }

  get sel(): Shape | undefined {
    return this.shapes.find(s => s.id === this.selId);
  }

  get selNodes(): Node[] {
    return this.nodes.filter(n => n.shapeIds.includes(this.selId!));
  }

  get exclusiveNodes(): number {
    return this.nodes.filter(n => n.shapeIds.length === 1).length;
  }

  get sharedNodes(): number {
    return this.nodes.filter(n => n.shapeIds.length > 1).length;
  }

  get solutionEntries(): [string, number][] {
    if (!this.result?.solution) return [];
    return Object.entries(this.result.solution) as [string, number][];
  }

  private svgPt(e: MouseEvent): [number, number] {
    const r = this.svgElRef.nativeElement.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  private refresh(sh: Shape[]) {
    this.nodes = detectNodes(sh);
    this.result = null;
    const figs = buildFigures(sh, this.nodes);
    this.canvasChange.emit({ figures: figs, nodes: this.nodes, solution: null });
  }

  onSvgDown(e: MouseEvent) {
    if (this.tool === 'select') { this.selId = null; return; }
    const [x, y] = this.svgPt(e);
    this.drag = {
      type: 'create',
      start: [x, y],
      shape: {
        id: Date.now(), type: this.tool,
        color: COLORS[this.colorIdx % COLORS.length],
        operacion: 'suma', target: 10,
        x, y, w: 0, h: 0,
      },
    };
  }

  onShapeDown(e: MouseEvent, s: Shape) {
    e.stopPropagation();
    if (this.tool !== 'select') return;
    this.selId = s.id;
    const [mx, my] = this.svgPt(e);
    this.drag = { type: 'move', id: s.id, ox: mx - s.x, oy: my - s.y };
  }

  onHandleDown(e: MouseEvent, s: Shape, corner: string) {
    e.stopPropagation();
    const [mx, my] = this.svgPt(e);
    this.drag = { type: 'resize', id: s.id, corner, mx0: mx, my0: my, ox: s.x, oy: s.y, ow: s.w, oh: s.h };
  }

  onMove(e: MouseEvent) {
    if (!this.drag) return;
    const [mx, my] = this.svgPt(e);

    if (this.drag.type === 'create' && this.drag.start && this.drag.shape) {
      const x = Math.min(this.drag.start[0], mx), y = Math.min(this.drag.start[1], my);
      const w = Math.abs(mx - this.drag.start[0]), h = Math.abs(my - this.drag.start[1]);
      this.drag = { ...this.drag, shape: { ...this.drag.shape, x, y, w, h } };
    }

    if (this.drag.type === 'move' && this.drag.id !== undefined) {
      this.shapes = this.shapes.map(s => s.id === this.drag!.id
        ? { ...s, x: mx - this.drag!.ox!, y: my - this.drag!.oy! } : s);
    }

    if (this.drag.type === 'resize' && this.drag.id !== undefined) {
      const dx = mx - this.drag.mx0!, dy = my - this.drag.my0!;
      this.shapes = this.shapes.map(s => {
        if (s.id !== this.drag!.id) return s;
        let { x, y, w, h } = { x: this.drag!.ox!, y: this.drag!.oy!, w: this.drag!.ow!, h: this.drag!.oh! };
        if (this.drag!.corner === 'tl') { x += dx; y += dy; w -= dx; h -= dy; }
        if (this.drag!.corner === 'tr') { y += dy; w += dx; h -= dy; }
        if (this.drag!.corner === 'br') { w += dx; h += dy; }
        if (this.drag!.corner === 'bl') { x += dx; w -= dx; h += dy; }
        return { ...s, x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) };
      });
    }
  }

  onUp() {
    if (!this.drag) return;
    if (this.drag.type === 'create' && this.drag.shape) {
      if (this.drag.shape.w > MIN_SIZE && this.drag.shape.h > MIN_SIZE) {
        const ns = [...this.shapes, this.drag.shape];
        this.shapes = ns;
        this.refresh(ns);
        this.selId = this.drag.shape.id;
        this.colorIdx++;
      }
      this.tool = 'select';
    }
    if (this.drag.type === 'move' || this.drag.type === 'resize') {
      this.refresh(this.shapes);
    }
    this.drag = null;
  }

  deleteShape() {
    const ns = this.shapes.filter(s => s.id !== this.selId);
    this.shapes = ns;
    this.refresh(ns);
    this.selId = null;
  }

  setProp(field: string, value: any) {
    const ns = this.shapes.map(s => s.id === this.selId ? { ...s, [field]: value } : s);
    this.shapes = ns;
    this.refresh(ns);
  }

  verify() {
    const figs = buildFigures(this.shapes, this.nodes);
    if (!this.numberSet.length) {
      this.result = { hasSolution: false, message: 'Define el número de conjunto primero' };
      return;
    }
    if (!this.nodes.length) {
      this.result = { hasSolution: false, message: 'No hay intersecciones — superpón figuras para crear nodos' };
      return;
    }
    const r = solve(figs as any, this.numberSet);
    this.result = r;
    this.canvasChange.emit({ figures: figs, nodes: this.nodes, solution: r.hasSolution ? r.solution : null });
  }

  shapeIndex(s: Shape): number {
    return this.shapes.findIndex(sh => sh.id === s.id);
  }

  getPoints(s: Shape): string {
    return getVerts(s).map(v => v.join(',')).join(' ');
  }

  centerX(s: Shape): number {
    const vs = getVerts(s);
    return vs.reduce((a, v) => a + v[0], 0) / vs.length;
  }

  centerY(s: Shape): number {
    const vs = getVerts(s);
    return vs.reduce((a, v) => a + v[1], 0) / vs.length;
  }

  getHandles(s: Shape): { corner: string, cx: number, cy: number }[] {
    return [
      { corner: 'tl', cx: s.x, cy: s.y },
      { corner: 'tr', cx: s.x + s.w, cy: s.y },
      { corner: 'br', cx: s.x + s.w, cy: s.y + s.h },
      { corner: 'bl', cx: s.x, cy: s.y + s.h },
    ];
  }
}
