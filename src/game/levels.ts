import { Platform, Chest, EnemyType } from './types.ts';

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  theme: 'dungeon' | 'inferno' | 'abyss';
  worldWidth: number;
  worldHeight: number;
  playerSpawn: { x: number; y: number };
  platforms: Platform[];
  chests: Chest[];
  enemies: {
    type: EnemyType;
    x: number;
    y: number;
    patrolRange?: number;
    isBoss?: boolean;
  }[];
  portal: { x: number; y: number; width: number; height: number; targetStage: number };
  bossArena?: { startX: number; endX: number };
}

// 怪物數量翻倍輔助函數：將一般怪物數量翻倍，形成龐大怪潮
function doubleMonsterDensity(list: LevelData['enemies']): LevelData['enemies'] {
  const doubled: LevelData['enemies'] = [];
  for (const e of list) {
    doubled.push(e);
    if (!e.isBoss) {
      doubled.push({
        type: e.type,
        x: e.x + (e.type === 'bat' ? 32 : 26),
        y: e.y + (e.type === 'bat' ? -12 : 0),
        patrolRange: e.patrolRange,
        isBoss: false,
      });
    }
  }
  return doubled;
}

export const LEVELS: LevelData[] = [
  // Stage 1: Misty Dungeon (長程平坦地面、無尖刺無移動平臺、密集怪物、傳送門前獨立Boss決戰區域)
  {
    id: 1,
    name: '第 1 區：迷霧地城',
    subtitle: '平坦長程走廊，割草討伐大量魔物群並進入 BOSS 決戰區！',
    theme: 'dungeon',
    worldWidth: 4600,
    worldHeight: 900,
    playerSpawn: { x: 100, y: 720 },
    // 傳送門前 BOSS 區域 (x: 3800 ~ 4550)
    bossArena: { startX: 3800, endX: 4550 },
    platforms: [
      // 1. 完全連續平坦地面（移除尖刺、無坑洞）
      { x: 0, y: 800, width: 4600, height: 100, type: 'solid' },

      // 2. 密集階梯與立體平臺（全數為 one_way，支援由下往上跳躍穿透與下跳，無移動平臺）
      // 區段 1 (0 ~ 1200)
      { x: 160, y: 730, width: 130, height: 20, type: 'one_way' },
      { x: 280, y: 670, width: 140, height: 20, type: 'one_way' },
      { x: 410, y: 610, width: 140, height: 20, type: 'one_way' },
      { x: 540, y: 550, width: 150, height: 20, type: 'one_way' },
      { x: 680, y: 490, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 880, y: 550, width: 140, height: 20, type: 'one_way' },
      { x: 1010, y: 620, width: 140, height: 20, type: 'one_way' },
      { x: 1140, y: 700, width: 140, height: 20, type: 'one_way' },

      // 區段 2 (1200 ~ 2500)
      { x: 1300, y: 720, width: 140, height: 20, type: 'one_way' },
      { x: 1440, y: 660, width: 140, height: 20, type: 'one_way' },
      { x: 1580, y: 600, width: 150, height: 20, type: 'one_way' },
      { x: 1730, y: 540, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 1930, y: 600, width: 140, height: 20, type: 'one_way' },
      { x: 2070, y: 660, width: 140, height: 20, type: 'one_way' },
      { x: 2210, y: 720, width: 140, height: 20, type: 'one_way' },
      { x: 2350, y: 650, width: 140, height: 20, type: 'one_way' },
      { x: 2480, y: 590, width: 150, height: 20, type: 'one_way' },

      // 區段 3 (2500 ~ 3750)
      { x: 2620, y: 530, width: 150, height: 20, type: 'one_way' },
      { x: 2780, y: 480, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 2980, y: 540, width: 140, height: 20, type: 'one_way' },
      { x: 3120, y: 610, width: 140, height: 20, type: 'one_way' },
      { x: 3260, y: 680, width: 140, height: 20, type: 'one_way' },
      { x: 3400, y: 720, width: 140, height: 20, type: 'one_way' },
      { x: 3540, y: 660, width: 150, height: 20, type: 'one_way' },
      { x: 3680, y: 600, width: 150, height: 20, type: 'one_way' },

      // 區段 4：BOSS 決戰區域戰鬥平臺 (3800 ~ 4550)
      { x: 3920, y: 720, width: 150, height: 20, type: 'one_way' },
      { x: 4100, y: 640, width: 220, height: 22, type: 'one_way' },
      { x: 4350, y: 720, width: 150, height: 20, type: 'one_way' },
    ],
    chests: [
      { id: 101, x: 740, y: 445, width: 36, height: 35, opened: false, coins: 60 },
      { id: 102, x: 1790, y: 495, width: 36, height: 35, opened: false, coins: 100 },
      { id: 103, x: 2840, y: 435, width: 36, height: 35, opened: false, coins: 150 },
      { id: 104, x: 3720, y: 555, width: 36, height: 35, opened: false, coins: 200 },
    ],
    // 怪物數量翻倍
    enemies: doubleMonsterDensity([
      // 區段 1 (200 ~ 1200)
      { type: 'slime', x: 220, y: 760, patrolRange: 120 },
      { type: 'slime', x: 280, y: 760, patrolRange: 120 },
      { type: 'slime', x: 350, y: 760, patrolRange: 120 },
      { type: 'slime', x: 420, y: 760, patrolRange: 140 },
      { type: 'goblin', x: 500, y: 760, patrolRange: 140 },
      { type: 'goblin', x: 580, y: 760, patrolRange: 140 },
      { type: 'slime', x: 660, y: 760, patrolRange: 120 },
      { type: 'slime', x: 740, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 820, y: 760, patrolRange: 140 },
      { type: 'goblin', x: 900, y: 760, patrolRange: 140 },
      { type: 'slime', x: 980, y: 760, patrolRange: 120 },
      { type: 'slime', x: 1060, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1140, y: 760, patrolRange: 140 },
      // 平臺魔物
      { type: 'slime', x: 290, y: 630, patrolRange: 50 },
      { type: 'slime', x: 420, y: 570, patrolRange: 50 },
      { type: 'goblin', x: 550, y: 510, patrolRange: 60 },
      { type: 'goblin', x: 890, y: 510, patrolRange: 60 },
      { type: 'slime', x: 1020, y: 580, patrolRange: 50 },
      // 低空飛行蝙蝠
      { type: 'bat', x: 260, y: 680, patrolRange: 160 },
      { type: 'bat', x: 450, y: 650, patrolRange: 180 },
      { type: 'bat', x: 680, y: 640, patrolRange: 180 },
      { type: 'bat', x: 900, y: 660, patrolRange: 180 },
      { type: 'bat', x: 1100, y: 650, patrolRange: 180 },

      // 區段 2 (1200 ~ 2500)
      { type: 'slime', x: 1240, y: 760, patrolRange: 120 },
      { type: 'slime', x: 1320, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1400, y: 760, patrolRange: 140 },
      { type: 'goblin', x: 1480, y: 760, patrolRange: 140 },
      { type: 'slime', x: 1560, y: 760, patrolRange: 120 },
      { type: 'slime', x: 1640, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1720, y: 760, patrolRange: 150 },
      { type: 'goblin', x: 1800, y: 760, patrolRange: 150 },
      { type: 'slime', x: 1880, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1960, y: 760, patrolRange: 140 },
      { type: 'slime', x: 2040, y: 760, patrolRange: 120 },
      { type: 'slime', x: 2120, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 2200, y: 760, patrolRange: 150 },
      { type: 'goblin', x: 2280, y: 760, patrolRange: 150 },
      { type: 'slime', x: 2360, y: 760, patrolRange: 120 },
      { type: 'slime', x: 2440, y: 760, patrolRange: 120 },
      // 平臺魔物
      { type: 'slime', x: 1450, y: 620, patrolRange: 50 },
      { type: 'goblin', x: 1590, y: 560, patrolRange: 60 },
      { type: 'goblin', x: 1940, y: 560, patrolRange: 60 },
      { type: 'slime', x: 2080, y: 620, patrolRange: 50 },
      { type: 'goblin', x: 2360, y: 610, patrolRange: 60 },
      // 低空蝙蝠
      { type: 'bat', x: 1350, y: 660, patrolRange: 180 },
      { type: 'bat', x: 1600, y: 640, patrolRange: 200 },
      { type: 'bat', x: 1850, y: 630, patrolRange: 200 },
      { type: 'bat', x: 2100, y: 650, patrolRange: 200 },
      { type: 'bat', x: 2350, y: 640, patrolRange: 200 },

      // 區段 3 (2500 ~ 3750)
      { type: 'slime', x: 2520, y: 760, patrolRange: 120 },
      { type: 'slime', x: 2600, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 2680, y: 760, patrolRange: 140 },
      { type: 'goblin', x: 2760, y: 760, patrolRange: 140 },
      { type: 'slime', x: 2840, y: 760, patrolRange: 120 },
      { type: 'slime', x: 2920, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 3000, y: 760, patrolRange: 150 },
      { type: 'goblin', x: 3080, y: 760, patrolRange: 150 },
      { type: 'slime', x: 3160, y: 760, patrolRange: 120 },
      { type: 'slime', x: 3240, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 3320, y: 760, patrolRange: 150 },
      { type: 'goblin', x: 3400, y: 760, patrolRange: 150 },
      { type: 'slime', x: 3480, y: 760, patrolRange: 120 },
      { type: 'slime', x: 3560, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 3640, y: 760, patrolRange: 150 },
      { type: 'goblin', x: 3720, y: 760, patrolRange: 150 },
      // 平臺魔物
      { type: 'goblin', x: 2630, y: 490, patrolRange: 60 },
      { type: 'goblin', x: 2990, y: 500, patrolRange: 60 },
      { type: 'slime', x: 3130, y: 570, patrolRange: 50 },
      { type: 'goblin', x: 3550, y: 620, patrolRange: 60 },
      // 低空蝙蝠
      { type: 'bat', x: 2600, y: 650, patrolRange: 180 },
      { type: 'bat', x: 2850, y: 630, patrolRange: 200 },
      { type: 'bat', x: 3100, y: 640, patrolRange: 200 },
      { type: 'bat', x: 3350, y: 660, patrolRange: 200 },
      { type: 'bat', x: 3600, y: 640, patrolRange: 200 },

      // 第1關守關BOSS：地城巨骸將軍（位於 BOSS 決戰區內 x: 4180）
      { type: 'boss_knight', x: 4180, y: 720, isBoss: true },
    ]),
    portal: { x: 4450, y: 710, width: 50, height: 90, targetStage: 2 },
  },

  // Stage 2: Inferno Ruins (長程平坦地面、無尖刺無移動平臺、骷髏與哥布林怪潮、BOSS決戰區)
  {
    id: 2,
    name: '第 2 區：熔岩遺跡',
    subtitle: '長程灼熱走廊，穿透密集平臺擊破骷髏大軍並進入 BOSS 決戰區！',
    theme: 'inferno',
    worldWidth: 5200,
    worldHeight: 950,
    playerSpawn: { x: 100, y: 760 },
    // 傳送門前 BOSS 區域 (x: 4400 ~ 5150)
    bossArena: { startX: 4400, endX: 5150 },
    platforms: [
      // 1. 完全平坦地面（移除尖刺、無坑洞熔岩陷阱）
      { x: 0, y: 840, width: 5200, height: 110, type: 'solid' },

      // 2. 密集階梯平臺（全數為 one_way，支援下方跳躍穿透，無移動平臺）
      // 區段 1 (0 ~ 1300)
      { x: 150, y: 770, width: 130, height: 20, type: 'one_way' },
      { x: 270, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 400, y: 650, width: 140, height: 20, type: 'one_way' },
      { x: 530, y: 590, width: 140, height: 20, type: 'one_way' },
      { x: 670, y: 530, width: 160, height: 22, type: 'one_way' },
      { x: 850, y: 470, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 1050, y: 540, width: 140, height: 20, type: 'one_way' },
      { x: 1190, y: 610, width: 140, height: 20, type: 'one_way' },

      // 區段 2 (1300 ~ 2600)
      { x: 1340, y: 770, width: 140, height: 20, type: 'one_way' },
      { x: 1480, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 1620, y: 650, width: 140, height: 20, type: 'one_way' },
      { x: 1760, y: 590, width: 150, height: 20, type: 'one_way' },
      { x: 1920, y: 530, width: 150, height: 20, type: 'one_way' },
      { x: 2080, y: 470, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 2280, y: 550, width: 140, height: 20, type: 'one_way' },
      { x: 2420, y: 630, width: 140, height: 20, type: 'one_way' },
      { x: 2560, y: 710, width: 140, height: 20, type: 'one_way' },

      // 區段 3 (2600 ~ 3800)
      { x: 2700, y: 770, width: 140, height: 20, type: 'one_way' },
      { x: 2840, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 2980, y: 650, width: 140, height: 20, type: 'one_way' },
      { x: 3120, y: 590, width: 150, height: 20, type: 'one_way' },
      { x: 3270, y: 530, width: 150, height: 20, type: 'one_way' },
      { x: 3430, y: 470, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 3630, y: 550, width: 140, height: 20, type: 'one_way' },
      { x: 3770, y: 630, width: 140, height: 20, type: 'one_way' },

      // 區段 4 (3800 ~ 4350)
      { x: 3910, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 4050, y: 650, width: 150, height: 20, type: 'one_way' },
      { x: 4200, y: 580, width: 170, height: 22, type: 'one_way' }, // 寶箱平臺

      // 區段 5：BOSS 決戰區域戰鬥平臺 (4400 ~ 5150)
      { x: 4520, y: 760, width: 150, height: 20, type: 'one_way' },
      { x: 4720, y: 680, width: 220, height: 22, type: 'one_way' },
      { x: 4970, y: 760, width: 150, height: 20, type: 'one_way' },
    ],
    chests: [
      { id: 201, x: 910, y: 425, width: 36, height: 35, opened: false, coins: 150 },
      { id: 202, x: 2140, y: 425, width: 36, height: 35, opened: false, coins: 220 },
      { id: 203, x: 3490, y: 425, width: 36, height: 35, opened: false, coins: 300 },
      { id: 204, x: 4250, y: 535, width: 36, height: 35, opened: false, coins: 380 },
    ],
    enemies: doubleMonsterDensity([
      // 區段 1 (0 ~ 1300)
      { type: 'slime', x: 180, y: 800, patrolRange: 120 },
      { type: 'slime', x: 250, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 320, y: 800, patrolRange: 140 },
      { type: 'goblin', x: 400, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 480, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 560, y: 800, patrolRange: 90 },
      { type: 'slime', x: 640, y: 800, patrolRange: 120 },
      { type: 'slime', x: 720, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 800, y: 800, patrolRange: 150 },
      { type: 'skeleton', x: 880, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 960, y: 800, patrolRange: 90 },
      { type: 'slime', x: 1040, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 1120, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 1200, y: 800, patrolRange: 90 },
      // 平臺守衛
      { type: 'skeleton', x: 280, y: 670, patrolRange: 50 },
      { type: 'goblin', x: 410, y: 610, patrolRange: 60 },
      { type: 'skeleton', x: 540, y: 550, patrolRange: 50 },
      { type: 'goblin', x: 680, y: 490, patrolRange: 60 },
      { type: 'skeleton', x: 1060, y: 500, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 220, y: 700, patrolRange: 180 },
      { type: 'bat', x: 460, y: 680, patrolRange: 180 },
      { type: 'bat', x: 700, y: 660, patrolRange: 180 },
      { type: 'bat', x: 950, y: 670, patrolRange: 180 },
      { type: 'bat', x: 1180, y: 680, patrolRange: 180 },

      // 區段 2 (1300 ~ 2600)
      { type: 'slime', x: 1350, y: 800, patrolRange: 120 },
      { type: 'slime', x: 1430, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 1510, y: 800, patrolRange: 140 },
      { type: 'goblin', x: 1590, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 1670, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 1750, y: 800, patrolRange: 90 },
      { type: 'slime', x: 1830, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 1910, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 1990, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 2070, y: 800, patrolRange: 90 },
      { type: 'slime', x: 2150, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 2230, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2310, y: 800, patrolRange: 90 },
      { type: 'slime', x: 2390, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 2470, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2550, y: 800, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 1490, y: 670, patrolRange: 50 },
      { type: 'goblin', x: 1630, y: 610, patrolRange: 60 },
      { type: 'skeleton', x: 1770, y: 550, patrolRange: 50 },
      { type: 'goblin', x: 1930, y: 490, patrolRange: 60 },
      { type: 'skeleton', x: 2290, y: 510, patrolRange: 50 },
      { type: 'goblin', x: 2430, y: 590, patrolRange: 60 },
      // 低空蝙蝠
      { type: 'bat', x: 1400, y: 680, patrolRange: 180 },
      { type: 'bat', x: 1650, y: 660, patrolRange: 180 },
      { type: 'bat', x: 1900, y: 670, patrolRange: 180 },
      { type: 'bat', x: 2150, y: 650, patrolRange: 180 },
      { type: 'bat', x: 2400, y: 660, patrolRange: 180 },

      // 區段 3 (2600 ~ 4350)
      { type: 'slime', x: 2620, y: 800, patrolRange: 120 },
      { type: 'slime', x: 2700, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 2780, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2860, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 2940, y: 800, patrolRange: 90 },
      { type: 'goblin', x: 3020, y: 800, patrolRange: 140 },
      { type: 'slime', x: 3100, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3180, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 3260, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 3340, y: 800, patrolRange: 90 },
      { type: 'slime', x: 3420, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3500, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 3580, y: 800, patrolRange: 90 },
      { type: 'slime', x: 3660, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3740, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 3820, y: 800, patrolRange: 90 },
      { type: 'slime', x: 3900, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3980, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 4060, y: 800, patrolRange: 90 },
      { type: 'slime', x: 4140, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 4220, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 4300, y: 800, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 2850, y: 670, patrolRange: 50 },
      { type: 'goblin', x: 2990, y: 610, patrolRange: 60 },
      { type: 'skeleton', x: 3130, y: 550, patrolRange: 50 },
      { type: 'goblin', x: 3280, y: 490, patrolRange: 60 },
      { type: 'skeleton', x: 3640, y: 510, patrolRange: 50 },
      { type: 'goblin', x: 4060, y: 610, patrolRange: 60 },
      // 低空蝙蝠
      { type: 'bat', x: 2650, y: 680, patrolRange: 180 },
      { type: 'bat', x: 2900, y: 660, patrolRange: 180 },
      { type: 'bat', x: 3150, y: 650, patrolRange: 180 },
      { type: 'bat', x: 3400, y: 670, patrolRange: 180 },
      { type: 'bat', x: 3650, y: 660, patrolRange: 180 },
      { type: 'bat', x: 3900, y: 680, patrolRange: 180 },
      { type: 'bat', x: 4150, y: 670, patrolRange: 180 },

      // 第2關守關BOSS：熔岩巨刃魔將（位於 BOSS 決戰區內 x: 4780）
      { type: 'boss_knight', x: 4780, y: 760, isBoss: true },
    ]),
    portal: { x: 5050, y: 750, width: 50, height: 90, targetStage: 3 },
  },

  // Stage 3: Demon Lord Abyss (延長長度至 5000px，平坦地面，立體平臺，傳送門前決戰區域)
  {
    id: 3,
    name: '第 3 區：深淵魔王殿',
    subtitle: '深淵長廊險峻，穿越魔物軍團進入 BOSS 決戰區討伐深淵大魔王！',
    theme: 'abyss',
    worldWidth: 5000,
    worldHeight: 900,
    playerSpawn: { x: 100, y: 720 },
    // 傳送門前 BOSS 區域 (x: 4200 ~ 4950)
    bossArena: { startX: 4200, endX: 4950 },
    platforms: [
      // 1. 完全連續平坦地面
      { x: 0, y: 800, width: 5000, height: 100, type: 'solid' },

      // 2. 密集階梯平臺（全數 one_way，支援下方跳躍穿透）
      // 區段 1 (0 ~ 1300)
      { x: 160, y: 730, width: 140, height: 20, type: 'one_way' },
      { x: 290, y: 670, width: 140, height: 20, type: 'one_way' },
      { x: 430, y: 610, width: 150, height: 20, type: 'one_way' },
      { x: 570, y: 550, width: 150, height: 20, type: 'one_way' },
      { x: 710, y: 490, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 910, y: 550, width: 140, height: 20, type: 'one_way' },
      { x: 1060, y: 620, width: 140, height: 20, type: 'one_way' },
      { x: 1200, y: 700, width: 140, height: 20, type: 'one_way' },

      // 區段 2 (1300 ~ 2700)
      { x: 1350, y: 730, width: 140, height: 20, type: 'one_way' },
      { x: 1490, y: 670, width: 140, height: 20, type: 'one_way' },
      { x: 1630, y: 610, width: 150, height: 20, type: 'one_way' },
      { x: 1780, y: 540, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 1980, y: 600, width: 140, height: 20, type: 'one_way' },
      { x: 2130, y: 660, width: 140, height: 20, type: 'one_way' },
      { x: 2280, y: 720, width: 140, height: 20, type: 'one_way' },
      { x: 2430, y: 650, width: 140, height: 20, type: 'one_way' },
      { x: 2580, y: 580, width: 160, height: 20, type: 'one_way' },

      // 區段 3 (2700 ~ 4150)
      { x: 2740, y: 520, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 2950, y: 580, width: 140, height: 20, type: 'one_way' },
      { x: 3100, y: 640, width: 140, height: 20, type: 'one_way' },
      { x: 3250, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 3400, y: 650, width: 140, height: 20, type: 'one_way' },
      { x: 3550, y: 580, width: 150, height: 20, type: 'one_way' },
      { x: 3720, y: 510, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 3930, y: 580, width: 140, height: 20, type: 'one_way' },
      { x: 4070, y: 660, width: 140, height: 20, type: 'one_way' },

      // 區段 4：BOSS 決戰區域戰鬥平臺 (4200 ~ 4950)
      { x: 4320, y: 710, width: 150, height: 20, type: 'one_way' },
      { x: 4520, y: 630, width: 220, height: 22, type: 'one_way' },
      { x: 4760, y: 710, width: 150, height: 20, type: 'one_way' },
    ],
    chests: [
      { id: 301, x: 770, y: 445, width: 36, height: 35, opened: false, coins: 250 },
      { id: 302, x: 1840, y: 495, width: 36, height: 35, opened: false, coins: 350 },
      { id: 303, x: 2800, y: 475, width: 36, height: 35, opened: false, coins: 450 },
      { id: 304, x: 3780, y: 465, width: 36, height: 35, opened: false, coins: 600 },
    ],
    enemies: doubleMonsterDensity([
      // 區段 1 (0 ~ 1300)
      { type: 'slime', x: 200, y: 760, patrolRange: 120 },
      { type: 'slime', x: 280, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 360, y: 760, patrolRange: 140 },
      { type: 'goblin', x: 440, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 520, y: 760, patrolRange: 90 },
      { type: 'skeleton', x: 600, y: 760, patrolRange: 90 },
      { type: 'slime', x: 680, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 760, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 840, y: 760, patrolRange: 90 },
      { type: 'slime', x: 920, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1000, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 1080, y: 760, patrolRange: 90 },
      // 平臺魔物
      { type: 'skeleton', x: 300, y: 630, patrolRange: 50 },
      { type: 'goblin', x: 440, y: 570, patrolRange: 50 },
      { type: 'skeleton', x: 580, y: 510, patrolRange: 50 },
      { type: 'goblin', x: 920, y: 510, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 250, y: 660, patrolRange: 180 },
      { type: 'bat', x: 500, y: 650, patrolRange: 180 },
      { type: 'bat', x: 750, y: 640, patrolRange: 180 },
      { type: 'bat', x: 1000, y: 650, patrolRange: 180 },

      // 區段 2 (1300 ~ 2700)
      { type: 'slime', x: 1360, y: 760, patrolRange: 120 },
      { type: 'slime', x: 1440, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1520, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 1600, y: 760, patrolRange: 90 },
      { type: 'skeleton', x: 1680, y: 760, patrolRange: 90 },
      { type: 'slime', x: 1760, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 1840, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 1920, y: 760, patrolRange: 90 },
      { type: 'slime', x: 2000, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 2080, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 2160, y: 760, patrolRange: 90 },
      { type: 'slime', x: 2240, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 2320, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 2400, y: 760, patrolRange: 90 },
      { type: 'goblin', x: 2480, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 2560, y: 760, patrolRange: 90 },
      // 平臺魔物
      { type: 'skeleton', x: 1500, y: 630, patrolRange: 50 },
      { type: 'goblin', x: 1640, y: 570, patrolRange: 50 },
      { type: 'skeleton', x: 1990, y: 560, patrolRange: 50 },
      { type: 'goblin', x: 2440, y: 610, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 1400, y: 660, patrolRange: 180 },
      { type: 'bat', x: 1700, y: 640, patrolRange: 180 },
      { type: 'bat', x: 2000, y: 650, patrolRange: 180 },
      { type: 'bat', x: 2300, y: 640, patrolRange: 180 },

      // 區段 3 (2700 ~ 4150)
      { type: 'slime', x: 2750, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 2830, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 2910, y: 760, patrolRange: 90 },
      { type: 'skeleton', x: 2990, y: 760, patrolRange: 90 },
      { type: 'slime', x: 3070, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 3150, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 3230, y: 760, patrolRange: 90 },
      { type: 'slime', x: 3310, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 3390, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 3470, y: 760, patrolRange: 90 },
      { type: 'goblin', x: 3550, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 3630, y: 760, patrolRange: 90 },
      { type: 'slime', x: 3710, y: 760, patrolRange: 120 },
      { type: 'goblin', x: 3790, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 3870, y: 760, patrolRange: 90 },
      { type: 'goblin', x: 3950, y: 760, patrolRange: 140 },
      { type: 'skeleton', x: 4030, y: 760, patrolRange: 90 },
      // 平臺魔物
      { type: 'skeleton', x: 2960, y: 540, patrolRange: 50 },
      { type: 'goblin', x: 3260, y: 670, patrolRange: 50 },
      { type: 'skeleton', x: 3560, y: 540, patrolRange: 50 },
      { type: 'goblin', x: 3940, y: 540, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 2800, y: 660, patrolRange: 180 },
      { type: 'bat', x: 3100, y: 650, patrolRange: 180 },
      { type: 'bat', x: 3400, y: 660, patrolRange: 180 },
      { type: 'bat', x: 3700, y: 650, patrolRange: 180 },
      { type: 'bat', x: 4000, y: 660, patrolRange: 180 },

      // 第3關守關BOSS：深淵大魔王（位於 BOSS 決戰區內 x: 4580）
      { type: 'boss_knight', x: 4580, y: 720, isBoss: true },
    ]),
    portal: { x: 4850, y: 710, width: 50, height: 90, targetStage: 4 },
  },

  // Stage 4: Ancient Necropolis (第4區：永凍古殿，全長 5400px，平坦地面，立體平臺，傳送門前決戰區)
  {
    id: 4,
    name: '第 4 區：永凍古殿',
    subtitle: '極寒古老陵寢，斬滅遠古死靈法皇開啟通往神座之門！',
    theme: 'dungeon',
    worldWidth: 5400,
    worldHeight: 920,
    playerSpawn: { x: 100, y: 740 },
    // 傳送門前 BOSS 區域 (x: 4550 ~ 5350)
    bossArena: { startX: 4550, endX: 5350 },
    platforms: [
      // 1. 完全連續平坦地面
      { x: 0, y: 820, width: 5400, height: 100, type: 'solid' },

      // 2. 密集階梯平臺（全數 one_way）
      // 區段 1 (0 ~ 1400)
      { x: 180, y: 750, width: 140, height: 20, type: 'one_way' },
      { x: 320, y: 690, width: 140, height: 20, type: 'one_way' },
      { x: 460, y: 630, width: 150, height: 20, type: 'one_way' },
      { x: 610, y: 570, width: 150, height: 20, type: 'one_way' },
      { x: 770, y: 510, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 970, y: 570, width: 140, height: 20, type: 'one_way' },
      { x: 1120, y: 640, width: 140, height: 20, type: 'one_way' },
      { x: 1270, y: 720, width: 140, height: 20, type: 'one_way' },

      // 區段 2 (1400 ~ 2900)
      { x: 1430, y: 750, width: 140, height: 20, type: 'one_way' },
      { x: 1580, y: 690, width: 140, height: 20, type: 'one_way' },
      { x: 1730, y: 630, width: 150, height: 20, type: 'one_way' },
      { x: 1890, y: 560, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 2100, y: 620, width: 140, height: 20, type: 'one_way' },
      { x: 2260, y: 690, width: 140, height: 20, type: 'one_way' },
      { x: 2420, y: 750, width: 140, height: 20, type: 'one_way' },
      { x: 2580, y: 680, width: 140, height: 20, type: 'one_way' },
      { x: 2740, y: 610, width: 160, height: 20, type: 'one_way' },

      // 區段 3 (2900 ~ 4450)
      { x: 2920, y: 540, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 3140, y: 610, width: 140, height: 20, type: 'one_way' },
      { x: 3300, y: 680, width: 140, height: 20, type: 'one_way' },
      { x: 3460, y: 750, width: 140, height: 20, type: 'one_way' },
      { x: 3620, y: 680, width: 140, height: 20, type: 'one_way' },
      { x: 3780, y: 610, width: 150, height: 20, type: 'one_way' },
      { x: 3950, y: 540, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 4160, y: 610, width: 140, height: 20, type: 'one_way' },
      { x: 4320, y: 690, width: 140, height: 20, type: 'one_way' },

      // 區段 4：BOSS 決戰區域戰鬥平臺 (4550 ~ 5350)
      { x: 4680, y: 730, width: 150, height: 20, type: 'one_way' },
      { x: 4890, y: 650, width: 220, height: 22, type: 'one_way' },
      { x: 5140, y: 730, width: 150, height: 20, type: 'one_way' },
    ],
    chests: [
      { id: 401, x: 830, y: 465, width: 36, height: 35, opened: false, coins: 400 },
      { id: 402, x: 1950, y: 515, width: 36, height: 35, opened: false, coins: 550 },
      { id: 403, x: 2980, y: 495, width: 36, height: 35, opened: false, coins: 700 },
      { id: 404, x: 4010, y: 495, width: 36, height: 35, opened: false, coins: 900 },
    ],
    enemies: doubleMonsterDensity([
      // 區段 1 (0 ~ 1400)
      { type: 'slime', x: 220, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 300, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 380, y: 780, patrolRange: 90 },
      { type: 'skeleton', x: 460, y: 780, patrolRange: 90 },
      { type: 'slime', x: 540, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 620, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 700, y: 780, patrolRange: 90 },
      { type: 'skeleton', x: 780, y: 780, patrolRange: 90 },
      { type: 'slime', x: 860, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 940, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 1020, y: 780, patrolRange: 90 },
      { type: 'goblin', x: 1100, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 1180, y: 780, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 330, y: 650, patrolRange: 50 },
      { type: 'goblin', x: 470, y: 590, patrolRange: 50 },
      { type: 'skeleton', x: 620, y: 530, patrolRange: 50 },
      { type: 'goblin', x: 980, y: 530, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 280, y: 680, patrolRange: 180 },
      { type: 'bat', x: 550, y: 660, patrolRange: 180 },
      { type: 'bat', x: 820, y: 650, patrolRange: 180 },
      { type: 'bat', x: 1100, y: 660, patrolRange: 180 },

      // 區段 2 (1400 ~ 2900)
      { type: 'slime', x: 1450, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 1530, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 1610, y: 780, patrolRange: 90 },
      { type: 'skeleton', x: 1690, y: 780, patrolRange: 90 },
      { type: 'slime', x: 1770, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 1850, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 1930, y: 780, patrolRange: 90 },
      { type: 'slime', x: 2010, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 2090, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 2170, y: 780, patrolRange: 90 },
      { type: 'slime', x: 2250, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 2330, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 2410, y: 780, patrolRange: 90 },
      { type: 'goblin', x: 2490, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 2570, y: 780, patrolRange: 90 },
      { type: 'goblin', x: 2650, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 2730, y: 780, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 1590, y: 650, patrolRange: 50 },
      { type: 'goblin', x: 1740, y: 590, patrolRange: 50 },
      { type: 'skeleton', x: 2110, y: 580, patrolRange: 50 },
      { type: 'goblin', x: 2590, y: 640, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 1500, y: 670, patrolRange: 180 },
      { type: 'bat', x: 1800, y: 660, patrolRange: 180 },
      { type: 'bat', x: 2150, y: 650, patrolRange: 180 },
      { type: 'bat', x: 2450, y: 660, patrolRange: 180 },
      { type: 'bat', x: 2750, y: 650, patrolRange: 180 },

      // 區段 3 (2900 ~ 4450)
      { type: 'slime', x: 2950, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 3030, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 3110, y: 780, patrolRange: 90 },
      { type: 'skeleton', x: 3190, y: 780, patrolRange: 90 },
      { type: 'slime', x: 3270, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 3350, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 3430, y: 780, patrolRange: 90 },
      { type: 'slime', x: 3510, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 3590, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 3670, y: 780, patrolRange: 90 },
      { type: 'goblin', x: 3750, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 3830, y: 780, patrolRange: 90 },
      { type: 'slime', x: 3910, y: 780, patrolRange: 120 },
      { type: 'goblin', x: 3990, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 4070, y: 780, patrolRange: 90 },
      { type: 'goblin', x: 4150, y: 780, patrolRange: 140 },
      { type: 'skeleton', x: 4230, y: 780, patrolRange: 90 },
      { type: 'skeleton', x: 4310, y: 780, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 3150, y: 570, patrolRange: 50 },
      { type: 'goblin', x: 3470, y: 710, patrolRange: 50 },
      { type: 'skeleton', x: 3790, y: 570, patrolRange: 50 },
      { type: 'goblin', x: 4170, y: 570, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 3000, y: 670, patrolRange: 180 },
      { type: 'bat', x: 3300, y: 660, patrolRange: 180 },
      { type: 'bat', x: 3600, y: 650, patrolRange: 180 },
      { type: 'bat', x: 3900, y: 660, patrolRange: 180 },
      { type: 'bat', x: 4200, y: 650, patrolRange: 180 },

      // 第4關守關BOSS：遠古死靈法皇（位於 BOSS 決戰區內 x: 4950）
      { type: 'boss_knight', x: 4950, y: 740, isBoss: true },
    ]),
    portal: { x: 5240, y: 730, width: 50, height: 90, targetStage: 5 },
  },

  // Stage 5: Seat of Chaos (第5區：混沌神座，全長 5800px，終極魔神決戰，平坦地面，立體平臺)
  {
    id: 5,
    name: '第 5 區：混沌神座',
    subtitle: '終焉決戰！討伐混沌毀滅魔神，打破永恆輪迴！',
    theme: 'abyss',
    worldWidth: 5800,
    worldHeight: 950,
    playerSpawn: { x: 100, y: 760 },
    // 傳送門前 BOSS 區域 (x: 4900 ~ 5750)
    bossArena: { startX: 4900, endX: 5750 },
    platforms: [
      // 1. 完全連續平坦地面
      { x: 0, y: 840, width: 5800, height: 110, type: 'solid' },

      // 2. 密集階梯平臺（全數 one_way）
      // 區段 1 (0 ~ 1500)
      { x: 180, y: 770, width: 140, height: 20, type: 'one_way' },
      { x: 330, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 480, y: 650, width: 150, height: 20, type: 'one_way' },
      { x: 640, y: 590, width: 150, height: 20, type: 'one_way' },
      { x: 810, y: 530, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 1020, y: 590, width: 140, height: 20, type: 'one_way' },
      { x: 1180, y: 660, width: 140, height: 20, type: 'one_way' },
      { x: 1340, y: 740, width: 140, height: 20, type: 'one_way' },

      // 區段 2 (1500 ~ 3100)
      { x: 1510, y: 770, width: 140, height: 20, type: 'one_way' },
      { x: 1670, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 1830, y: 650, width: 150, height: 20, type: 'one_way' },
      { x: 2000, y: 580, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 2220, y: 640, width: 140, height: 20, type: 'one_way' },
      { x: 2390, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 2560, y: 770, width: 140, height: 20, type: 'one_way' },
      { x: 2730, y: 700, width: 140, height: 20, type: 'one_way' },
      { x: 2900, y: 630, width: 160, height: 20, type: 'one_way' },

      // 區段 3 (3100 ~ 4800)
      { x: 3090, y: 560, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 3320, y: 630, width: 140, height: 20, type: 'one_way' },
      { x: 3490, y: 700, width: 140, height: 20, type: 'one_way' },
      { x: 3660, y: 770, width: 140, height: 20, type: 'one_way' },
      { x: 3830, y: 700, width: 140, height: 20, type: 'one_way' },
      { x: 4000, y: 630, width: 150, height: 20, type: 'one_way' },
      { x: 4180, y: 560, width: 180, height: 22, type: 'one_way' }, // 寶箱平臺
      { x: 4400, y: 630, width: 140, height: 20, type: 'one_way' },
      { x: 4570, y: 710, width: 140, height: 20, type: 'one_way' },
      { x: 4740, y: 770, width: 140, height: 20, type: 'one_way' },

      // 區段 4：BOSS 決戰區域戰鬥平臺 (4900 ~ 5750)
      { x: 5040, y: 750, width: 160, height: 20, type: 'one_way' },
      { x: 5260, y: 670, width: 240, height: 22, type: 'one_way' },
      { x: 5530, y: 750, width: 160, height: 20, type: 'one_way' },
    ],
    chests: [
      { id: 501, x: 870, y: 485, width: 36, height: 35, opened: false, coins: 600 },
      { id: 502, x: 2060, y: 535, width: 36, height: 35, opened: false, coins: 850 },
      { id: 503, x: 3150, y: 515, width: 36, height: 35, opened: false, coins: 1200 },
      { id: 504, x: 4240, y: 515, width: 36, height: 35, opened: false, coins: 1600 },
    ],
    enemies: doubleMonsterDensity([
      // 區段 1 (0 ~ 1500)
      { type: 'slime', x: 220, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 310, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 400, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 490, y: 800, patrolRange: 90 },
      { type: 'slime', x: 580, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 670, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 760, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 850, y: 800, patrolRange: 90 },
      { type: 'slime', x: 940, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 1030, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 1120, y: 800, patrolRange: 90 },
      { type: 'goblin', x: 1210, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 1300, y: 800, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 340, y: 670, patrolRange: 50 },
      { type: 'goblin', x: 490, y: 610, patrolRange: 50 },
      { type: 'skeleton', x: 650, y: 550, patrolRange: 50 },
      { type: 'goblin', x: 1030, y: 550, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 280, y: 700, patrolRange: 180 },
      { type: 'bat', x: 580, y: 680, patrolRange: 180 },
      { type: 'bat', x: 880, y: 670, patrolRange: 180 },
      { type: 'bat', x: 1180, y: 680, patrolRange: 180 },

      // 區段 2 (1500 ~ 3100)
      { type: 'slime', x: 1530, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 1620, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 1710, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 1800, y: 800, patrolRange: 90 },
      { type: 'slime', x: 1890, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 1980, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2070, y: 800, patrolRange: 90 },
      { type: 'slime', x: 2160, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 2250, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2340, y: 800, patrolRange: 90 },
      { type: 'slime', x: 2430, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 2520, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2610, y: 800, patrolRange: 90 },
      { type: 'goblin', x: 2700, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2790, y: 800, patrolRange: 90 },
      { type: 'goblin', x: 2880, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 2970, y: 800, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 1680, y: 670, patrolRange: 50 },
      { type: 'goblin', x: 1840, y: 610, patrolRange: 50 },
      { type: 'skeleton', x: 2230, y: 600, patrolRange: 50 },
      { type: 'goblin', x: 2740, y: 660, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 1600, y: 690, patrolRange: 180 },
      { type: 'bat', x: 1950, y: 680, patrolRange: 180 },
      { type: 'bat', x: 2300, y: 670, patrolRange: 180 },
      { type: 'bat', x: 2650, y: 680, patrolRange: 180 },
      { type: 'bat', x: 3000, y: 670, patrolRange: 180 },

      // 區段 3 (3100 ~ 4800)
      { type: 'slime', x: 3120, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3210, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 3300, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 3390, y: 800, patrolRange: 90 },
      { type: 'slime', x: 3480, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3570, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 3660, y: 800, patrolRange: 90 },
      { type: 'slime', x: 3750, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 3840, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 3930, y: 800, patrolRange: 90 },
      { type: 'goblin', x: 4020, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 4110, y: 800, patrolRange: 90 },
      { type: 'slime', x: 4200, y: 800, patrolRange: 120 },
      { type: 'goblin', x: 4290, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 4380, y: 800, patrolRange: 90 },
      { type: 'goblin', x: 4470, y: 800, patrolRange: 140 },
      { type: 'skeleton', x: 4560, y: 800, patrolRange: 90 },
      { type: 'skeleton', x: 4650, y: 800, patrolRange: 90 },
      // 平臺
      { type: 'skeleton', x: 3330, y: 590, patrolRange: 50 },
      { type: 'goblin', x: 3670, y: 730, patrolRange: 50 },
      { type: 'skeleton', x: 4010, y: 590, patrolRange: 50 },
      { type: 'goblin', x: 4410, y: 590, patrolRange: 50 },
      // 低空蝙蝠
      { type: 'bat', x: 3200, y: 690, patrolRange: 180 },
      { type: 'bat', x: 3550, y: 680, patrolRange: 180 },
      { type: 'bat', x: 3900, y: 670, patrolRange: 180 },
      { type: 'bat', x: 4250, y: 680, patrolRange: 180 },
      { type: 'bat', x: 4600, y: 670, patrolRange: 180 },

      // 第5關終極BOSS：混沌毀滅魔神（位於 BOSS 決戰區內 x: 5350）
      { type: 'boss_knight', x: 5350, y: 750, isBoss: true },
    ]),
    portal: { x: 5640, y: 750, width: 50, height: 90, targetStage: 1 },
  },
];
