import React from 'react';
import { PlayerStats, Enemy } from '../game/types.ts';
import { WEAPONS } from '../game/weapons.ts';
import {
  Shield,
  Sword,
  Coins,
  Settings,
  ShoppingBag,
  Pause,
  Skull,
  Sparkles,
  Heart,
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  boss: Enemy | null;
  stageName: string;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenTalents: () => void;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  boss,
  stageName,
  onOpenSettings,
  onOpenShop,
  onOpenTalents,
  onTogglePause,
}) => {
  const currentWeapon = WEAPONS[stats.equippedWeaponId] || WEAPONS.rusty_dagger;
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const expPercent = Math.max(0, Math.min(100, (stats.exp / stats.nextLevelExp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 z-20">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Player Vital Status Cluster */}
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-sm border border-slate-700/70 p-3 rounded-2xl shadow-xl">
          {/* Level Badge with Piggy Hero */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-amber-500 to-amber-700 text-amber-950 font-black shadow-lg border border-pink-300/50">
            <span className="text-[14px] leading-none mb-0.5" role="img" aria-label="豬豬勇者">🐷</span>
            <span className="text-xs leading-none font-black text-white drop-shadow tabular-nums">LV.{stats.level}</span>
          </div>

          <div className="flex flex-col gap-1.5 w-48 sm:w-56">
            {/* HP Bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-0.5">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span>生命 HP</span>
                  <span className="text-emerald-400 text-[10px] font-semibold">
                    (+{stats.hpRegen}/s)
                  </span>
                </span>
                <span className="text-rose-200 tabular-nums">
                  {stats.hp} / {stats.maxHp}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 rounded-full transition-all duration-200"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* EXP Bar */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-semibold mb-0.5">
                <span className="text-purple-300">經驗 EXP</span>
                <span className="text-purple-200 tabular-nums">
                  {stats.exp} / {stats.nextLevelExp} ({Math.round(expPercent)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 rounded-full transition-all duration-200"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stat Pill */}
            <div className="flex items-center gap-2.5 text-[11px] font-medium text-slate-300 pt-0.5">
              <span className="flex items-center gap-1 text-sky-300" title="總攻擊力 (含天賦與等級加成)">
                <Sword className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {Math.round(
                    (currentWeapon.damage +
                      (stats.level - 1) * 5 +
                      stats.baseAtk +
                      (stats.talents?.damage || 0) * 4) *
                      (1 + (stats.talents?.damage || 0) * 0.12)
                  )}{' '}
                  ATK
                </span>
              </span>
              <span className="flex items-center gap-1 text-emerald-300" title="防禦力">
                <Shield className="w-3.5 h-3.5" />
                <span className="tabular-nums">{stats.def} DEF</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400" title="每秒生命回復 (基礎1 + 天賦加成)">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span className="tabular-nums">+{stats.hpRegen}/s</span>
              </span>
              <span className="text-slate-400 text-[10px]">
                擊殺: <span className="text-slate-200 tabular-nums">{stats.monstersSlain}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Stage Name or Boss HP */}
        <div className="flex flex-col items-center">
          {boss && boss.hp > 0 ? (
            <div className="flex flex-col items-center w-72 sm:w-96 bg-slate-950/90 border border-red-500/50 p-2.5 rounded-xl shadow-2xl animate-pulse">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                <Skull className="w-4 h-4 text-red-500" />
                <span>{boss.name || '守關首領 (BOSS)'}</span>
                <span className="text-xs text-rose-300 tabular-nums">
                  {boss.hp} / {boss.maxHp}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-red-900/60">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow">
              {stageName}
            </div>
          )}
        </div>

        {/* Right: Currency, Equipped Weapon, Talents & Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Gold Counter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 border border-amber-500/40 text-amber-300 font-bold shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-sm tabular-nums">{stats.coins}</span>
            <span className="text-[10px] text-amber-400/80 font-normal">G</span>
          </div>

          {/* Talent Tree Button */}
          <button
            onClick={onOpenTalents}
            title="開啟天賦樹 (快速鍵 T)"
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 transition-colors shadow-lg group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-purple-300 leading-none">天賦樹</div>
              <div className="text-xs font-bold leading-tight text-white group-hover:text-purple-200">
                {stats.talentPoints > 0 ? `${stats.talentPoints} 點可用` : '已配置'}
              </div>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-900/80 border border-purple-700 text-purple-300">
              T
            </span>
            {stats.talentPoints > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950 shadow-md animate-pulse">
                {stats.talentPoints}
              </span>
            )}
          </button>

          {/* Equipped Weapon Badge */}
          <button
            onClick={onOpenShop}
            title="開啟武器商店 (快速鍵 B)"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors shadow-lg group cursor-pointer"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/20"
              style={{ backgroundColor: currentWeapon.color }}
            />
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-slate-400 leading-none">裝備中</div>
              <div className="text-xs font-bold leading-tight text-white group-hover:text-amber-300">
                {currentWeapon.name}
              </div>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-600 text-slate-300">
              B
            </span>
          </button>

          {/* Shop Quick Button */}
          <button
            onClick={onOpenShop}
            title="開啟武器商店"
            className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold transition shadow-lg flex items-center justify-center cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-950" />
          </button>

          {/* Settings Panel Button */}
          <button
            onClick={onOpenSettings}
            title="開啟遊戲設定（音量/螢幕震動）"
            className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg cursor-pointer hover:border-sky-500/50"
          >
            <Settings className="w-4 h-4 text-sky-400" />
          </button>

          {/* Pause */}
          <button
            onClick={onTogglePause}
            title="暫停遊戲 (Esc)"
            className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Hint Line: Low occlusion flat text */}
      <div className="flex items-center justify-between text-[11px] text-slate-400/80 px-2">
        <div className="bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 shadow flex flex-wrap gap-x-2 gap-y-1">
          <span><strong className="text-slate-300">A / D</strong> 移動</span> ·{' '}
          <span><strong className="text-slate-300">空白</strong> 跳躍</span> ·{' '}
          <span><strong className="text-rose-400">Ctrl (左/右)</strong> 斬擊</span> ·{' '}
          <span><strong className="text-sky-300">↓ + 空白</strong> 下跳</span> ·{' '}
          <span><strong className="text-sky-400">Shift (左/右)</strong> 衝刺斬</span> ·{' '}
          <span><strong className="text-emerald-400">↑</strong> 進入傳送門</span> ·{' '}
          <span><strong className="text-purple-300">T</strong> 天賦樹</span> ·{' '}
          <span><strong className="text-amber-400">B</strong> 武器商店</span>
        </div>
        <div className="hidden sm:block text-slate-500 text-[10px]">
          升級獲得天賦點數強化傷害、範圍、攻速、回復、跑速
        </div>
      </div>
    </div>
  );
};
