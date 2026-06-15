import { chromium } from "playwright";

const URL = "http://localhost:5199/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on("pageerror", (e) => {
  errors.push(`pageerror: ${e.message}`);
  console.log("PAGEERROR:", e.message);
  console.log("STACK:", e.stack);
});
page.on("console", (m) => {
  if (m.type() === "error") {
    errors.push(`console.error: ${m.text()}`);
    console.log("CONSOLE.ERROR:", m.text());
  }
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const state = await page.evaluate(() => {
  const g = window.__GAME__;
  if (!g) return { hasGame: false };
  return {
    hasGame: true,
    isBooted: g.isBooted,
    scenes: g.scene.scenes.map((s) => ({ key: s.scene.key, active: g.scene.isActive(s.scene.key) })),
  };
});
console.log("STATE:", JSON.stringify(state, null, 2));

// Wait until Boot finishes and the MainMenu scene is active.
await page.waitForFunction(
  () => {
    const g = window.__GAME__;
    return g && g.scene.isActive("MainMenu");
  },
  { timeout: 8000 }
);
console.log("BOOT: MainMenu active");

// --- Test 1: clicking the "Start Run" button via a real mouse click ---
const canvasBox = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  const r = c.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
});
const scaleX = canvasBox.width / 720;
const scaleY = canvasBox.height / 480;
console.log("CANVAS:", JSON.stringify(canvasBox), "scaleX", scaleX.toFixed(3), "scaleY", scaleY.toFixed(3));

// "Start Run" button is centered at game-space (360, 210), width 240.
// Click well off-center (near the left edge) to validate the full hit area.
const startX = canvasBox.left + (360 - 100) * scaleX;
const startY = canvasBox.top + (210 + 16) * scaleY;
await page.mouse.click(startX, startY);

const startedRun = await page
  .waitForFunction(() => window.__GAME__.scene.isActive("Run"), { timeout: 4000 })
  .then(() => true)
  .catch(() => false);
console.log("CLICK Start Run ->", startedRun ? "Run active (click works)" : "click MISSED");

if (!startedRun) {
  // Fall back to API start so we can still test the freeze.
  await page.evaluate(() => {
    const g = window.__GAME__;
    g.scene.stop("MainMenu");
    g.scene.start("Run", {
      run: {
        mode: "standard",
        seed: 12345,
        floor: 1,
        score: 0,
        timeBank: 30,
        upgrades: [],
        stats: {
          speed: 260,
          pickupRadius: 14,
          magnetRange: 0,
          goodTimeBonus: 1.5,
          goodScore: 10,
          badTimePenalty: 2,
          badScorePenalty: 8,
          splitChance: 0,
          scoreMultiplier: 1,
          shieldsPerFloor: 0,
          dangerSense: false,
          secondWind: false,
        },
        shields: 0,
        orbsCollected: 0,
        damageTaken: 0,
        cleared: false,
      },
    });
  });
  await page.waitForFunction(() => window.__GAME__.scene.isActive("Run"), { timeout: 4000 });
}

await page.waitForTimeout(300);

// --- Test 2: force a floor clear and see if LevelUp appears (the freeze) ---
await page.evaluate(() => {
  const run = window.__GAME__.scene.getScene("Run");
  run.started = true;
  run.quotaLeft = 0;
  run.update(performance.now(), 16);
});

const reachedLevelUp = await page
  .waitForFunction(() => window.__GAME__.scene.isActive("LevelUp"), { timeout: 4000 })
  .then(() => true)
  .catch(() => false);
console.log("FLOOR CLEAR -> LevelUp active:", reachedLevelUp, reachedLevelUp ? "(no freeze)" : "(FROZEN)");

// --- Test 3: clicking an upgrade card in LevelUp ---
if (reachedLevelUp) {
  await page.waitForTimeout(200);
  // First card center is at game-space (~ left card, y=250). Cards are 200 wide
  // with 18 gap; for 3 cards the first is at cx - (200+18). cx=360 => 142.
  const cardX = canvasBox.left + 142 * scaleX;
  const cardY = canvasBox.top + 250 * scaleY;
  await page.mouse.click(cardX, cardY);
  const advanced = await page
    .waitForFunction(
      () => {
        const g = window.__GAME__;
        const run = g.scene.getScene("Run");
        return g.scene.isActive("Run") && run.run && run.run.floor === 2;
      },
      { timeout: 4000 }
    )
    .then(() => true)
    .catch(() => false);
  console.log("CLICK upgrade card -> floor 2 Run active:", advanced, advanced ? "(card click works)" : "(card click MISSED)");
}

console.log("ERRORS:", errors.length ? JSON.stringify(errors, null, 2) : "none");

await browser.close();
