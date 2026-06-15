export type ArenaTheme = {
  id: string;
  name: string;
  bgTop: number;
  bgBottom: number;
  grid: number;
  accent: number;
};

export const THEMES: ArenaTheme[] = [
  {
    id: "neon",
    name: "Neon Grid",
    bgTop: 0x112a46,
    bgBottom: 0x04121f,
    grid: 0xffffff,
    accent: 0x6fffe9,
  },
  {
    id: "ember",
    name: "Ember Cavern",
    bgTop: 0x3a1408,
    bgBottom: 0x140402,
    grid: 0xffb27a,
    accent: 0xff7b54,
  },
  {
    id: "glacier",
    name: "Glacier",
    bgTop: 0x123a4a,
    bgBottom: 0x051820,
    grid: 0xbfe9ff,
    accent: 0x7fd4ff,
  },
];

export function themeForFloor(floor: number): ArenaTheme {
  const index = Math.floor((floor - 1) / 2) % THEMES.length;
  return THEMES[index];
}
