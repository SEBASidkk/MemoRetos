/**
 * CSP Backtracking Solver para MemoRetos
 * Asigna valores del numberSet a los nodos de intersección
 * satisfaciendo la operación/target de cada figura.
 *
 * Cada valor del numberSet se usa como máximo UNA vez (sin repetición).
 */
export function solve(figures, numberSet) {
  if (!figures.length || !numberSet.length) return { hasSolution: false, solution: {} };

  const nodeIds = [...new Set(figures.flatMap(f => f.nodos))];
  if (!nodeIds.length) return { hasSolution: false, solution: {} };

  // Principio del palomar: imposible sin repetición
  if (nodeIds.length > numberSet.length) {
    return { hasSolution: false, solution: {}, reason: "El número de conjunto tiene menos valores que nodos" };
  }

  const assignment = {};

  /** Evalúa si una figura es consistente con la asignación actual.
   *  partial=true  → solo revisa las restricciones que ya se pueden evaluar
   *  partial=false → requiere que TODOS los nodos estén asignados */
  function isConsistent(fig, partial) {
    const vals = fig.nodos.map(n => assignment[n]).filter(v => v !== undefined);
    if (!vals.length) return true;

    if (fig.operacion === 'suma') {
      const sum = vals.reduce((a, b) => a + b, 0);
      if (partial) return sum <= fig.target;           // poda: suma parcial no excede target
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

  function backtrack(i) {
    if (i === nodeIds.length) {
      return figures.every(f => isConsistent(f, false));
    }
    const id = nodeIds[i];
    const used = new Set(Object.values(assignment)); // valores ya asignados
    for (const v of numberSet) {
      if (used.has(v)) continue; // sin repetición
      assignment[id] = v;
      // Forward check: solo continúa si las figuras afectadas siguen siendo consistentes
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
