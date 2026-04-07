import type { Figure } from './types';

interface SolveResult {
  hasSolution: boolean;
  solution?: Record<number, number>;
  message?: string;
}

function applyOp(operacion: string, values: number[]): number {
  if (values.length === 0) return 0;
  if (operacion === 'multiplicacion') return values.reduce((a, b) => a * b, 1);
  if (operacion === 'resta') {
    const sorted = [...values].sort((a, b) => b - a);
    return sorted.slice(1).reduce((acc, v) => acc - v, sorted[0]);
  }
  // suma (default)
  return values.reduce((a, b) => a + b, 0);
}

function checkAll(figures: Figure[], assignment: Record<number, number>): boolean {
  return figures.every(fig => {
    const values = fig.nodos.map(id => assignment[id]).filter(v => v !== undefined);
    if (values.length === 0) return true;
    return applyOp(fig.operacion, values) === fig.target;
  });
}

function backtrack(
  nodeIds: number[],
  index: number,
  assignment: Record<number, number>,
  remaining: number[],
  figures: Figure[],
): Record<number, number> | null {
  if (index === nodeIds.length) {
    return checkAll(figures, assignment) ? { ...assignment } : null;
  }
  const nodeId = nodeIds[index];
  for (let i = 0; i < remaining.length; i++) {
    assignment[nodeId] = remaining[i];
    const next = remaining.filter((_, idx) => idx !== i);
    const result = backtrack(nodeIds, index + 1, assignment, next, figures);
    if (result) return result;
    delete assignment[nodeId];
  }
  return null;
}

export function solve(figures: Figure[], numberSet: number[]): SolveResult {
  const allNodeIds = [...new Set(figures.flatMap(f => f.nodos))];

  if (allNodeIds.length === 0) {
    return { hasSolution: false, message: 'No hay nodos en el canvas' };
  }
  if (allNodeIds.length > numberSet.length) {
    return {
      hasSolution: false,
      message: `Hay ${allNodeIds.length} nodos pero solo ${numberSet.length} números en el conjunto`,
    };
  }

  const solution = backtrack(allNodeIds, 0, {}, [...numberSet], figures);
  if (solution) return { hasSolution: true, solution };
  return { hasSolution: false };
}
