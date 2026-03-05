import type { MechanismKey } from "./mechanisms";

export function isActive(r: number, c: number, type: MechanismKey, step: number): boolean {
  switch (type) {
    case "dense":
      if (step < 8) return r === step;
      return true;

    case "linear":
      return c <= 1;

    case "sparse": {
      const global = r === 0 || c === 0;
      const local = r === c || c === r - 1 || c === r + 1;
      const strided = c % 4 === 0 && c !== 0;
      if (step === 0) return global;
      if (step === 1) return global || local;
      return global || local || strided;
    }

    case "flash": {
      const bs = 4;
      const br = Math.floor(r / bs);
      const bc = Math.floor(c / bs);
      if (step === 0) return br === 0 && bc === 0;
      if (step === 1) return br === 0 && bc === 1;
      if (step === 2) return br === 1 && bc === 0;
      if (step === 3) return br === 1 && bc === 1;
      return false;
    }

    case "paged": {
      const pages: [number, number][][] = [
        [[0,0],[0,1],[1,0],[1,1]],
        [[4,4],[4,5],[5,4],[5,5]],
        [[2,6],[2,7],[3,6],[3,7]],
        [[6,2],[6,3],[7,2],[7,3]],
      ];
      // Show all pages allocated so far (cumulative)
      for (let p = 0; p <= Math.min(step, pages.length - 1); p++) {
        if (pages[p].some(([pr, pc]) => pr === r && pc === c)) return true;
      }
      return false;
    }

    case "local": {
      const windowSize = 2;
      if (step === 0) return r <= 1 && Math.abs(r - c) <= windowSize;
      if (step === 1) return r >= 2 && r <= 3 && Math.abs(r - c) <= windowSize;
      if (step === 2) return r >= 4 && r <= 5 && Math.abs(r - c) <= windowSize;
      if (step === 3) return r >= 6 && r <= 7 && Math.abs(r - c) <= windowSize;
      return Math.abs(r - c) <= windowSize;
    }

    default:
      return false;
  }
}

export function getActiveRow(type: MechanismKey, step: number): number | null {
  if (type === "dense" && step < 8) return step;
  if (type === "local") {
    if (step === 0) return 0;
    if (step === 1) return 2;
    if (step === 2) return 4;
    if (step === 3) return 6;
  }
  if (type === "sparse" && step === 0) return 0;
  return null;
}
