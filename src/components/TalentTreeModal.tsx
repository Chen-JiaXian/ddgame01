import React from 'react';
import { PlayerStats, TalentKey } from '../game/types.ts';
import { TALENTS_CONFIG, TALENT_KEYS } from '../game/talents.ts';
import {
  Sword,
  Maximize2,
  Zap,
  Heart,
  Wind,
  X,
  RotateCcw,
  Sparkles,
  ChevronUp,
  Minus,
} from 'lucide-react';

interface TalentTreeModalProps {
  stats: PlayerStats;
  onUpgradeTalent: (key: TalentKey) => void;
  onDowngradeTalent?: (key: TalentKey) => void;
  onResetTalents: () => void;
  onClose: () => void;
}

export const TalentTreeModal: React.FC<TalentTreeModalProps> = ({
  stats,
  onUpgradeTalent,
  onDowngradeTalent,
  onResetTalents,
  onClose,
}) => {
  const getTalentIcon = (iconName: string, color: string) => {
    const props = { className: 'w-5 h-5', style: { color } };
    switch (iconName) {
      case 'sword':
        return <Sword {...props} />;
      case 'maximize':
        return <Maximize2 {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'heart':
        return <Heart {...props} />;
      case 'wind':
        return <Wind {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  const getRankDescription = (key: TalentKey, rank: number) => {
    switch (key) {
      case 'damage':
        return rank > 0 ? `+${rank * 12}% 總傷害 & +${rank * 4} 攻擊力` : '無加成';
      case 'range':
        return rank > 0 ? `+${rank * 15}% 武器攻擊範圍` : '基礎範圍';
      case 'attackSpeed':
        return rank > 0 ? `+${rank * 12}% 攻擊速度` : '基礎攻速';
      case 'hpRegen':
        return `每秒回復 ${1 + rank} HP (基礎值 1)`;
      case 'moveSpeed':
        return rank > 0 ? `+${rank * 10}% 移動與衝刺速度` : '基礎移動速度';
      default:
        return '';
    }
  };

  const getNextRankPreview = (key: TalentKey, rank: number) => {
    if (rank >= 5) return '已升至最高等級';
    const nextRank = rank + 1;
    switch (key) {
      case 'damage':
        return `下級: +${nextRank * 12}% 總傷害 & +${nextRank * 4} 攻擊力`;
      case 'range':
        return `下級: +${nextRank * 15}% 武器攻擊範圍`;
      case 'attackSpeed':
        return `下級: +${nextRank * 12}% 攻擊速度`;
      case 'hpRegen':
        return `下級: 每秒回復 ${1 + nextRank} HP`;
      case 'moveSpeed':
        return `下級: +${nextRank * 10}% 移動與衝刺速度`;
      default:
        return '';
    }
  };

  const totalAllocated = Object.values(stats.talents || {}).reduce((acc, v) => acc + (v || 0), 0);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🐷 豬豬天賦樹
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60 font-medium">
                  TALENT TREE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                提升等級可獲得天賦點數，自由點選強化各項關鍵戰鬥屬性！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Available Talent Points Counter */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 shadow-inner">
              <span className="text-xs text-purple-200 font-semibold">天賦點數:</span>
              <span className="text-base font-black text-amber-300 tabular-nums">
                {stats.talentPoints}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Talent List Container */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
          {TALENT_KEYS.map((key) => {
            const config = TALENTS_CONFIG[key];
            const currentRank = stats.talents?.[key] || 0;
            const isMax = currentRank >= config.maxRank;
            const canUpgrade = stats.talentPoints > 0 && !isMax;
            const canDowngrade = currentRank > 0;

            return (
              <div
                key={key}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Icon & Title & Description */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className="p-3 rounded-xl border flex-shrink-0"
                    style={{
                      backgroundColor: `${config.color}15`,
                      borderColor: `${config.color}40`,
                    }}
                  >
                    {getTalentIcon(config.iconName, config.color)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{config.name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">({config.subtitle})</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          color: config.accentColor,
                          backgroundColor: `${config.color}20`,
                          borderColor: `${config.color}40`,
                        }}
                      >
                        Lv.{currentRank} / {config.maxRank}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{config.description}</p>

                    <div className="flex items-center gap-3 text-[11px] pt-1">
                      <span className="text-emerald-400 font-medium">
                        當前: {getRankDescription(key, currentRank)}
                      </span>
                      {!isMax && (
                        <span className="text-slate-400">
                          {getNextRankPreview(key, currentRank)}
                        </span>
                      )}
                    </div>

                    {/* Rank Pips Visualizer */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {Array.from({ length: config.maxRank }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-1.5 rounded-full transition-all duration-200"
                          style={{
                            backgroundColor:
                              idx < currentRank ? config.color : 'rgba(51, 65, 85, 0.7)',
                            boxShadow:
                              idx < currentRank ? `0 0 6px ${config.color}80` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {onDowngradeTalent && (
                    <button
                      onClick={() => onDowngradeTalent(key)}
                      disabled={!canDowngrade}
                      title="返還 1 點"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onUpgradeTalent(key)}
                    disabled={!canUpgrade}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      backgroundColor: isMax
                        ? '#334155'
                        : canUpgrade
                        ? config.color
                        : '#1e293b',
                      color: isMax ? '#94a3b8' : canUpgrade ? '#0f172a' : '#64748b',
                      border: `1px solid ${isMax ? '#475569' : canUpgrade ? config.accentColor : '#334155'}`,
                    }}
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>{isMax ? '已滿級' : '升級 (+1)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onResetTalents}
            disabled={totalAllocated === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white text-xs border border-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置天賦點數 (免費返還)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};
