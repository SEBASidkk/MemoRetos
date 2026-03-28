/**
 * CSP Backtracking Solver para MemoRetos
 * Asigna valores del numberSet a los nodos de intersección
 * satisfaciendo la operación/target de cada figura.
 *
 * Cada valor del numberSet se usa como máximo UNA vez (sin repetición).
 */
export interface Figure {
  id: number;
  nodos: number[];
  operacion: 'suma' | 'resta' | 'multiplicacion';
  target: number;
  [key: string]: any;
}

export interface SolveResult {
  hasSolution: boolean;
  solution: Record<number, number>;
  message?: string;
  reason?: string;
}

export function solve(figures: Figure[], numberSet: number[]): SolveResult {
  if (!figures.length || !numberSet.length) return { hasSolution: false, solution: {} };

  const nodeIds = [...new Set(figures.flatMap(f => f.nodos))];
  if (!nodeIds.length) return { hasSolution: false, solution: {} };

  if (nodeIds.length > numberSet.length) {
    return { hasSolution: false, solution: {}, reason: 'El número de conjunto tiene menos valores que nodos' };
  }

  const assignment: Record<number, number> = {};

  function isConsistent(fig: Figure, partial: boolean): boolean {
    const vals = fig.nodos.map(n => assignment[n]).filter(v => v !== undefined);
    if (!vals.length) return true;

    if (fig.operacion === 'suma') {
      const sum = vals.reduce((a, b) => a + b, 0);
      if (partial) return sum <= fig.target;
      return vals.length === fig.nodos.length && sum === fig.target;
    }

    if (fig.operacion === 'multiplicacion') {
      const prod = vals.reduce((a, b) => a * b, 1);
      if (partial) return prod <= fig.target;
      return vals.length === fig.nodos.length && prod === fig.target;
    }

    if (fig.operacion === 'resta') {
      if (!partial && vals.length === fig.nodos.length) {
        return vals.slice(1).reduce((a, b) => a - b, vals[0]) === fig.target;
      }
      return true;
    }

    return true;
  }

  function backtrack(i: number): boolean {
    if (i === nodeIds.length) {
      return figures.every(f => isConsistent(f, false));
    }
    const id = nodeIds[i];
    const used = new Set(Object.values(assignment));
    for (const v of numberSet) {
      if (used.has(v)) continue;
      assignment[id] = v;
      const ok = figures
        .filter(f => f.nodos.includes(id))
        .every(f => isConsistent(f, true));
      if (ok && backtrack(i + 1)) return true;
      delete assignment[id];
    }
    return false;
  }

  const found = backtrack(0);
  return { hasSolution: found, solution: found ? { ...assignment } : {} };
}
