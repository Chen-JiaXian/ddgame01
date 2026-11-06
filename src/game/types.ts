export type WeaponId =
  | 'rusty_dagger'
  | 'knight_sword'
  | 'dragon_cleaver'
  | 'thunder_spear'
  | 'frost_scythe'
  | 'holy_greatsword';

export interface Weapon {
  id: WeaponId;
  name: string;
  nameEn: string;
  price: number;
  damage: number;
  range: number;
  attackSpeed: number; // in seconds
  color: string;
  accentColor: string;
  description: string;
  specialEffect?: 'none' | 'fire' | 'lightning' | 'frost' | 'holy_beam';
  knockback: number;
}

export type EnemyType = 'slime' | 'goblin' | 'bat' | 'skeleton' | 'boss_knight';

export interface Enemy {
  id: number;
  type: EnemyType;
  name?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  maxHp: number;
  hp: number;
  damage: number;
  expReward: number;
  coinReward: number;
  facing: 1 | -1;
  isGrounded: boolean;
  patrolLeft: number;
  patrolRight: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';
  stateTimer: number;
  attackCooldown: number;
  hurtTimer: number; // for hit-flash and hit-stop
  isBoss?: boolean;
  burnTimer?: number; // 炎龍戰斧持續5秒燃燒時間
  burnTickTimer?: number; // 每秒跳一次燃燒傷害
  burnDmg?: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'one_way' | 'moving' | 'spikes';
  vx?: number;
  range?: number;
  startX?: number;
}

export interface Chest {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opened: boolean;
  coins: number;
}

export interface CoinPickup {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  life: number;
  isHoming?: boolean;
}

export interface ExpOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  exp: number;
  life: number;
  isHoming?: boolean;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  fromPlayer: boolean;
  element?: 'arrow' | 'holy_beam' | 'fire_wave' | 'lightning';
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'spark' | 'star';
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  isCrit?: boolean;
}

export type TalentKey = 'damage' | 'range' | 'attackSpeed' | 'hpRegen' | 'moveSpeed';

export interface TalentsState {
  damage: number;
  range: number;
  attackSpeed: number;
  hpRegen: number;
  moveSpeed: number;
}

export interface PlayerStats {
  level: number;
  exp: number;
  nextLevelExp: number;
  hp: number;
  maxHp: number;
  baseAtk: number;
  def: number;
  coins: number;
  equippedWeaponId: WeaponId;
  ownedWeaponIds: WeaponId[];
  monstersSlain: number;
  hpRegen: number; // 每秒回復生命屬性，基礎值為1
  talentPoints: number; // 可用天賦點數
  talents: TalentsState; // 天賦分配狀態
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  attack: boolean;
  attackJustPressed: boolean;
  dash: boolean;
  dashJustPressed: boolean;
}

export interface GameState {
  screen: 'title' | 'playing' | 'shop' | 'paused' | 'gameover' | 'victory';
  stage: number;
  score: number;
  soundEnabled: boolean;
}
