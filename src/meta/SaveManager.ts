export type PermanentUpgradeId = "vitality" | "fleet" | "fortune" | "aegis";

export type MetaSave = {
  version: number;
  bestScore: number;
  bestFloor: number;
  totalRuns: number;
  totalOrbs: number;
  shards: number;
  unlocks: string[];
  permanentUpgrades: Record<PermanentUpgradeId, number>;
  settings: {
    music: number;
    sfx: number;
    reducedMotion: boolean;
    colorblind: boolean;
  };
};

const SAVE_KEY = "square-dash-save";
const SAVE_VERSION = 2;

function defaultSave(): MetaSave {
  return {
    version: SAVE_VERSION,
    bestScore: 0,
    bestFloor: 0,
    totalRuns: 0,
    totalOrbs: 0,
    shards: 0,
    unlocks: [],
    permanentUpgrades: { vitality: 0, fleet: 0, fortune: 0, aegis: 0 },
    settings: { music: 0.4, sfx: 0.7, reducedMotion: false, colorblind: false },
  };
}

/**
 * Wraps localStorage with versioned migration and graceful degradation so the
 * game still runs in private-browsing modes where storage throws.
 */
class SaveManagerImpl {
  private cache: MetaSave;
  private available = true;

  constructor() {
    this.cache = this.read();
  }

  private read(): MetaSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        // Migrate the legacy best-score key from the original prototype.
        const legacy = Number(localStorage.getItem("square-dash-best") ?? 0);
        const fresh = defaultSave();
        fresh.bestScore = Number.isFinite(legacy) ? legacy : 0;
        return fresh;
      }
      const parsed = JSON.parse(raw) as Partial<MetaSave>;
      return this.migrate(parsed);
    } catch {
      this.available = false;
      return defaultSave();
    }
  }

  private migrate(parsed: Partial<MetaSave>): MetaSave {
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      version: SAVE_VERSION,
      permanentUpgrades: { ...base.permanentUpgrades, ...parsed.permanentUpgrades },
      settings: { ...base.settings, ...parsed.settings },
      unlocks: parsed.unlocks ?? base.unlocks,
    };
  }

  get(): MetaSave {
    return this.cache;
  }

  update(mutator: (save: MetaSave) => void): MetaSave {
    mutator(this.cache);
    this.persist();
    return this.cache;
  }

  private persist(): void {
    if (!this.available) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.cache));
    } catch {
      this.available = false;
    }
  }

  reset(): void {
    this.cache = defaultSave();
    this.persist();
  }
}

export const SaveManager = new SaveManagerImpl();
