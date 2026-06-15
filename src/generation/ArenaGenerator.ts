import { ARENA } from "../config/gameConfig";
import { themeForFloor, type ArenaTheme } from "../config/themes";
import type { Vec } from "../types/runState";
import { Rng } from "./rng";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Arena = {
  width: number;
  height: number;
  walls: Rect[];
  playerSpawn: Vec;
  spawnPoints: Vec[];
  theme: ArenaTheme;
};

const CELL = 40;

function rectsOverlap(a: Rect, b: Rect, pad = 0): boolean {
  return (
    a.x - pad < b.x + b.width &&
    a.x + a.width + pad > b.x &&
    a.y - pad < b.y + b.height &&
    a.y + a.height + pad > b.y
  );
}

function pointInRects(p: Vec, rects: Rect[], pad: number): boolean {
  return rects.some(
    (r) =>
      p.x > r.x - pad &&
      p.x < r.x + r.width + pad &&
      p.y > r.y - pad &&
      p.y < r.y + r.height + pad
  );
}

/**
 * Flood fill across a coarse grid to confirm the playable space is one
 * connected region. Guards against walls sealing off a pocket of the arena.
 */
function isFullyConnected(walls: Rect[], start: Vec): boolean {
  const cols = Math.ceil(ARENA.width / CELL);
  const rows = Math.ceil(ARENA.height / CELL);

  const blocked = (cx: number, cy: number): boolean => {
    const cell: Rect = { x: cx * CELL, y: cy * CELL, width: CELL, height: CELL };
    return walls.some((w) => rectsOverlap(cell, w));
  };

  const open: boolean[][] = [];
  let openCount = 0;
  for (let cy = 0; cy < rows; cy++) {
    open[cy] = [];
    for (let cx = 0; cx < cols; cx++) {
      const isOpen = !blocked(cx, cy);
      open[cy][cx] = isOpen;
      if (isOpen) openCount++;
    }
  }

  const startX = Math.min(cols - 1, Math.floor(start.x / CELL));
  const startY = Math.min(rows - 1, Math.floor(start.y / CELL));
  if (!open[startY]?.[startX]) {
    return false;
  }

  const seen = new Set<number>();
  const stack = [startY * cols + startX];
  seen.add(stack[0]);
  while (stack.length) {
    const id = stack.pop() as number;
    const cy = Math.floor(id / cols);
    const cx = id % cols;
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const nid = ny * cols + nx;
      if (open[ny][nx] && !seen.has(nid)) {
        seen.add(nid);
        stack.push(nid);
      }
    }
  }

  return seen.size === openCount;
}

function buildSpawnPoints(walls: Rect[], rng: Rng): Vec[] {
  const points: Vec[] = [];
  let attempts = 0;
  while (points.length < 24 && attempts < 400) {
    attempts++;
    const p = {
      x: rng.between(ARENA.margin, ARENA.width - ARENA.margin),
      y: rng.between(ARENA.margin, ARENA.height - ARENA.margin),
    };
    if (!pointInRects(p, walls, 24)) {
      points.push(p);
    }
  }
  return points;
}

function tryGenerate(floor: number, rng: Rng, wallCount: number): Arena | null {
  const playerSpawn: Vec = { x: ARENA.width / 2, y: ARENA.height / 2 };
  const walls: Rect[] = [];

  let guard = 0;
  while (walls.length < wallCount && guard < 200) {
    guard++;
    const horizontal = rng.chance(0.5);
    const longSide = rng.between(70, floor >= 6 ? 200 : 150);
    const shortSide = rng.between(18, 30);
    const candidate: Rect = {
      x: rng.between(ARENA.margin, ARENA.width - ARENA.margin - longSide),
      y: rng.between(ARENA.margin, ARENA.height - ARENA.margin - longSide),
      width: horizontal ? longSide : shortSide,
      height: horizontal ? shortSide : longSide,
    };

    const clearsSpawn = !rectsOverlap(
      candidate,
      { x: playerSpawn.x - 50, y: playerSpawn.y - 50, width: 100, height: 100 },
      0
    );
    const clearsOthers = !walls.some((w) => rectsOverlap(candidate, w, 30));

    if (clearsSpawn && clearsOthers) {
      walls.push(candidate);
    }
  }

  if (!isFullyConnected(walls, playerSpawn)) {
    return null;
  }

  return {
    width: ARENA.width,
    height: ARENA.height,
    walls,
    playerSpawn,
    spawnPoints: buildSpawnPoints(walls, rng),
    theme: themeForFloor(floor),
  };
}

/**
 * Generate a connected arena for the given floor. Falls back to an open arena
 * if the seeded layout repeatedly fails validation, so a run never softlocks.
 */
export function generateArena(floor: number, seed: number, wallCount: number): Arena {
  for (let attempt = 0; attempt < 8; attempt++) {
    const rng = new Rng((seed ^ (floor * 0x9e3779b1) ^ (attempt * 0x85ebca77)) >>> 0);
    const arena = tryGenerate(floor, rng, wallCount);
    if (arena) {
      return arena;
    }
  }

  const rng = new Rng((seed ^ (floor * 0x9e3779b1)) >>> 0);
  return {
    width: ARENA.width,
    height: ARENA.height,
    walls: [],
    playerSpawn: { x: ARENA.width / 2, y: ARENA.height / 2 },
    spawnPoints: buildSpawnPoints([], rng),
    theme: themeForFloor(floor),
  };
}
