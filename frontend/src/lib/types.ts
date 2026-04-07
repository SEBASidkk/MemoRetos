export interface User {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  rol: string;
  group?: string;
  total_score: number;
  tutorial_completed?: boolean;
}

export interface Shape {
  id: number;
  type: 'circulo' | 'triangulo' | 'cuadrado' | 'rectangulo';
  color: string;
  operacion: 'suma' | 'resta' | 'multiplicacion';
  target: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CanvasNode {
  id: number;
  x: number;
  y: number;
  shapeIds: number[];
}

export interface DragState {
  type: 'create' | 'move' | 'resize';
  id?: number;
  start?: [number, number];
  shape?: Shape;
  ox?: number;
  oy?: number;
  corner?: string;
  mx0?: number;
  my0?: number;
  ow?: number;
  oh?: number;
}

export interface Figure {
  id: number;
  type: Shape['type'];
  color: string;
  operacion: Shape['operacion'];
  target: number;
  nodos: number[];
  _geo: { x: number; y: number; w: number; h: number };
}
