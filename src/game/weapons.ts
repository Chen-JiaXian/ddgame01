import { Weapon, WeaponId } from './types.ts';

export const WEAPONS: Record<WeaponId, Weapon> = {
  rusty_dagger: {
    id: 'rusty_dagger',
    name: '生鏽匕首',
    nameEn: 'Rusty Dagger',
    price: 0,
    damage: 16,
    range: 140,
    attackSpeed: 0.22,
    color: '#94a3b8',
    accentColor: '#cbd5e1',
    knockback: 4,
    description: '最初始的精準短刀，揮砍極其輕快迅速。',
    specialEffect: 'none',
  },
  knight_sword: {
    id: 'knight_sword',
    name: '騎士闊劍',
    nameEn: "Knight's Broadsword",
    price: 60,
    damage: 22, // 每次升級武器僅小幅提升 (+6)
    range: 180,
    attackSpeed: 0.25,
    color: '#38bdf8',
    accentColor: '#e0f2fe',
    knockback: 6,
    description: '王國精鋼佩劍，斬擊範圍與基礎威力穩健小幅提升。',
    specialEffect: 'none',
  },
  dragon_cleaver: {
    id: 'dragon_cleaver',
    name: '炎龍戰斧',
    nameEn: 'Dragonfire Cleaver',
    price: 160,
    damage: 29, // 每次升級武器僅小幅提升 (+7)
    range: 215,
    attackSpeed: 0.32,
    color: '#f97316',
    accentColor: '#ffedd5',
    knockback: 9,
    description: '重型烈焰戰斧，命中使敵人燃燒5秒，每秒造成持續灼燒傷害！',
    specialEffect: 'fire',
  },
  thunder_spear: {
    id: 'thunder_spear',
    name: '奔雷長槍',
    nameEn: 'Thunder Spear',
    price: 320,
    damage: 36, // 每次升級武器僅小幅提升 (+7)
    range: 250,
    attackSpeed: 0.28,
    color: '#eab308',
    accentColor: '#fef08a',
    knockback: 7,
    description: '極速雷霆長槍，命中時召喚天頂迷你落雷轟擊敵人！',
    specialEffect: 'lightning',
  },
  frost_scythe: {
    id: 'frost_scythe',
    name: '雙魂巨鐮',
    nameEn: 'Frostsoul Scythe',
    price: 550,
    damage: 44, // 每次升級武器僅小幅提升 (+8)
    range: 310, // 基礎範圍是所有武器最大！(310px)
    attackSpeed: 0.34,
    color: '#06b6d4',
    accentColor: '#cffafe',
    knockback: 9,
    description: '幽冥雙魂巨鐮，基礎範圍為所有武器最大！命中觸發大範圍冰爆炸！',
    specialEffect: 'frost',
  },
  holy_greatsword: {
    id: 'holy_greatsword',
    name: '聖光誓約神劍',
    nameEn: 'Holy Excalibur',
    price: 850,
    damage: 52, // 每次升級武器僅小幅提升 (+8)
    range: 270, // 範圍小於雙魂巨鐮(310)，兼顧光刃遠程特性
    attackSpeed: 0.32,
    color: '#fbbf24',
    accentColor: '#ffffff',
    knockback: 12,
    description: '傳說聖光神劍，斬擊時向前激射貫穿性神聖光刃光波！',
    specialEffect: 'holy_beam',
  },
};

export const WEAPON_LIST: Weapon[] = Object.values(WEAPONS);
