import React from 'react';
import { PlayerStats } from '../game/types.ts';
import { Play, RotateCcw, ShoppingBag, Trophy, Skull, Settings, Sparkles } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenShop: () => void;
  onOpenTalents?: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenShop,
  onOpenTalents,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        <h2 className="text-2xl font-black text-white mb-2">遊戲暫停</h2>
        <p className="text-xs text-slate-400 mb-6">隨時調整裝備或分配天賦點數</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>繼續戰鬥 (Esc)</span>
          </button>

          {onOpenTalents && (
            <button
              onClick={onOpenTalents}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>豬豬天賦樹 (T)</span>
            </button>
          )}

          <button
            onClick={onOpenShop}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>開啟武器商店 (B)</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer text-xs"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span>遊戲設定（音量 / 螢幕震動）</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 font-medium flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新開始關卡</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-lg shadow-rose-500/20">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black text-rose-400 mb-1">英雄戰死</h2>
        <p className="text-xs text-slate-400 mb-6">
          魔物凶悍，但這並非冒險的終點！
        </p>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 w-full bg-slate-950/60 border border-slate-800 p-4 rounded-2xl mb-6 text-center">
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">最終等級</div>
            <div className="text-xl font-bold text-amber-400 tabular-nums">Lv.{stats.level}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">討伐魔物</div>
            <div className="text-xl font-bold text-rose-400 tabular-nums">{stats.monstersSlain}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">累積金幣</div>
            <div className="text-xl font-bold text-amber-300 tabular-nums">{stats.coins} G</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>重整旗鼓 · 再次討伐</span>
        </button>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: PlayerStats;
  onNextCycle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onNextCycle }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/20 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black text-amber-400 mb-1">地城大捷 · 榮耀歸來</h2>
        <p className="text-xs text-slate-300 mb-6">
          你成功擊潰了深淵魔王！成為名垂青史的傳奇屠魔勇士！
        </p>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 w-full bg-slate-950/60 border border-amber-500/30 p-4 rounded-2xl mb-6 text-center">
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">英雄等級</div>
            <div className="text-xl font-bold text-amber-400 tabular-nums">Lv.{stats.level}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">討伐魔物</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">{stats.monstersSlain}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">金幣財富</div>
            <div className="text-xl font-bold text-amber-300 tabular-nums">{stats.coins} G</div>
          </div>
        </div>

        <button
          onClick={onNextCycle}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:scale-[1.02] transition cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>進入二周目 · 強化魔物無盡征途</span>
        </button>
      </div>
    </div>
  );
};
