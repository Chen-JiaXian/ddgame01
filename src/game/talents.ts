import { TalentKey } from './types.ts';

export interface TalentDefinition {
  key: TalentKey;
  name: string;
  subtitle: string;
  description: string;
  effectPerRank: string;
  maxRank: number;
  iconName: 'sword' | 'maximize' | 'zap' | 'heart' | 'wind';
  color: string;
  accentColor: string;
}

export const TALENTS_CONFIG: Record<TalentKey, TalentDefinition> = {
  damage: {
    key: 'damage',
    name: '狂怒斬擊',
    subtitle: '增加傷害輸出',
    description: '激發體內潛藏神力，大幅增加近戰武器與全技能斬擊威力。',
    effectPerRank: '每級 +12% 總傷害 & +4 攻擊力',
    maxRank: 5,
    iconName: 'sword',
    color: '#ef4444',
    accentColor: '#fca5a5',
  },
  range: {
    key: 'range',
    name: '劍氣擴散',
    subtitle: '增加攻擊範圍',
    description: '拓展揮刀刀光半徑與劍風波及範圍，享受超大範圍清怪割草。',
    effectPerRank: '每級 +15% 武器攻擊範圍',
    maxRank: 5,
    iconName: 'maximize',
    color: '#0ea5e9',
    accentColor: '#7dd3fc',
  },
  attackSpeed: {
    key: 'attackSpeed',
    name: '極意迅捷',
    subtitle: '增加攻擊速度',
    description: '縮短武器揮刀動畫與連擊冷卻間隔，實現疾風驟雨般的連斬。',
    effectPerRank: '每級 +12% 攻擊頻率速度',
    maxRank: 5,
    iconName: 'zap',
    color: '#f59e0b',
    accentColor: '#fde68a',
  },
  hpRegen: {
    key: 'hpRegen',
    name: '生命復甦',
    subtitle: '增加每秒回復',
    description: '激發豬豬勇者頑強肉體自我修復潛能，每秒源源不絕回復生命值。',
    effectPerRank: '每級 +1 HP/秒 (基礎值為 1 HP/秒)',
    maxRank: 5,
    iconName: 'heart',
    color: '#10b981',
    accentColor: '#6ee7b7',
  },
  moveSpeed: {
    key: 'moveSpeed',
    name: '風行疾步',
    subtitle: '增加移動速度',
    description: '輕靈敏捷步法，提高跑速與衝刺速度，靈巧穿梭於魔物怪潮中。',
    effectPerRank: '每級 +10% 奔跑與衝刺速度',
    maxRank: 5,
    iconName: 'wind',
    color: '#a855f7',
    accentColor: '#d8b4fe',
  },
};

export const TALENT_KEYS: TalentKey[] = ['damage', 'range', 'attackSpeed', 'hpRegen', 'moveSpeed'];
