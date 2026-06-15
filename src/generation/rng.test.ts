import { describe, expect, it } from "vitest";
import { Rng, dailySeed } from "./rng";

describe("Rng", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 8 }, () => a.next());
    const seqB = Array.from({ length: 8 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("keeps next() within [0, 1)", () => {
    const rng = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int() stays within inclusive bounds", () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it("dailySeed is stable for the same UTC date", () => {
    const date = new Date(Date.UTC(2026, 5, 14));
    expect(dailySeed(date)).toBe(dailySeed(date));
    expect(dailySeed(date)).not.toBe(dailySeed(new Date(Date.UTC(2026, 5, 15))));
  });
});
