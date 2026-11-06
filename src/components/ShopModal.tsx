import React from 'react';
import { WeaponId, Weapon } from '../game/types.ts';
import { WEAPON_LIST } from '../game/weapons.ts';
import {
  Coins,
  X,
  Check,
  Flame,
  Zap,
  Snowflake,
  Sparkles,
  Sword,
  Target,
  Clock,
} from 'lucide-react';

interface ShopModalProps {
  coins: number;
  equippedWeaponId: WeaponId;
  ownedWeaponIds: WeaponId[];
  onBuyWeapon: (id: WeaponId) => void;
  onEquipWeapon: (id: WeaponId) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  equippedWeaponId,
  ownedWeaponIds,
  onBuyWeapon,
  onEquipWeapon,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">神兵軍械庫 · 武器商店</h2>
              <p className="text-xs text-slate-400">
                收集魔物金幣與寶箱，挑選專屬神兵利刃征戰地城
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 font-bold">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-base tabular-nums">{coins}</span>
              <span className="text-xs text-amber-400/80">金幣</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weapons Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WEAPON_LIST.map((weapon: Weapon) => {
            const isOwned = ownedWeaponIds.includes(weapon.id);
            const isEquipped = equippedWeaponId === weapon.id;
            const canAfford = coins >= weapon.price;

            return (
              <div
                key={weapon.id}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
                  isEquipped
                    ? 'bg-slate-800/90 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                    : isOwned
                    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    : canAfford
                    ? 'bg-slate-900/60 border-slate-700/80 hover:border-amber-500/60 shadow'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-80'
                }`}
              >
                {/* Weapon Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      {/* Color icon orb */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner border border-white/20"
                        style={{ backgroundColor: weapon.color }}
                      >
                        {weapon.specialEffect === 'fire' && <Flame className="w-4 h-4 text-white" />}
                        {weapon.specialEffect === 'lightning' && <Zap className="w-4 h-4 text-white" />}
                        {weapon.specialEffect === 'frost' && <Snowflake className="w-4 h-4 text-white" />}
                        {weapon.specialEffect === 'holy_beam' && <Sparkles className="w-4 h-4 text-white" />}
                        {weapon.specialEffect === 'none' && <Sword className="w-4 h-4 text-white" />}
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">
                          {weapon.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 leading-none">
                          {weapon.nameEn}
                        </span>
                      </div>
                    </div>

                    {isEquipped && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-amber-950 flex items-center gap-1 shadow">
                        <Check className="w-3 h-3" /> 使用中
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 min-h-[36px] line-clamp-2 mb-3">
                    {weapon.description}
                  </p>

                  {/* Weapon Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] mb-3">
                    <div>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sword className="w-3 h-3 text-rose-400" /> 威力
                      </span>
                      <span className="font-bold text-rose-300 tabular-nums text-xs">
                        {weapon.damage} ATK
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Target className="w-3 h-3 text-sky-400" /> 範圍
                      </span>
                      <span className="font-bold text-sky-300 tabular-nums text-xs">
                        {weapon.range} px
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> 攻速
                      </span>
                      <span className="font-bold text-emerald-300 tabular-nums text-xs">
                        {weapon.attackSpeed}s
                      </span>
                    </div>
                  </div>

                  {/* Special Perk Tag */}
                  {weapon.specialEffect !== 'none' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg mb-3">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>
                        {weapon.specialEffect === 'fire' && '烈焰附魔：命中後持續燃燒造成額外灼燒傷害'}
                        {weapon.specialEffect === 'lightning' && '雷霆電弧：超長距離突刺，附帶雷電震退'}
                        {weapon.specialEffect === 'frost' && '霜魂極凍：超大旋風範圍橫掃並遲緩敵軍'}
                        {weapon.specialEffect === 'holy_beam' && '神聖劍氣：揮斬時發射神聖光刃貫穿敵群'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-1">
                  {isEquipped ? (
                    <div className="w-full py-2 rounded-xl text-center text-xs font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/40">
                      當前裝備中
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => onEquipWeapon(weapon.id)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition shadow cursor-pointer"
                    >
                      裝備此武器
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuyWeapon(weapon.id)}
                      disabled={!canAfford}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 font-extrabold'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>購買 ({weapon.price} G)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>提示：遊戲中可隨時按快捷鍵 [ B ] 開關武器商店</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            返回戰場
          </button>
        </div>
      </div>
    </div>
  );
};
