import React from 'react';
import {
  Volume2,
  VolumeX,
  Vibrate,
  X,
  RotateCcw,
  Sliders,
  Sparkles,
  Keyboard,
} from 'lucide-react';

interface SettingsModalProps {
  volume: number;
  onVolumeChange: (vol: number) => void;
  screenShake: boolean;
  onToggleScreenShake: () => void;
  soundEnabled: boolean;
  onToggleSoundEnabled: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  volume,
  onVolumeChange,
  screenShake,
  onToggleScreenShake,
  soundEnabled,
  onToggleSoundEnabled,
  onClose,
}) => {
  const volumePercent = Math.round(volume * 100);

  const handleResetDefaults = () => {
    onVolumeChange(0.5);
    if (!soundEnabled) onToggleSoundEnabled();
    if (!screenShake) onToggleScreenShake();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">遊戲設定</h2>
              <p className="text-xs text-slate-400">調整音量、畫面回饋與體驗選項</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Volume Adjustment */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                {soundEnabled && volume > 0 ? (
                  <Volume2 className="w-4 h-4 text-sky-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>主音量 (Volume)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400 tabular-nums bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-500/30">
                  {soundEnabled ? `${volumePercent}%` : '靜音'}
                </span>
                <button
                  onClick={onToggleSoundEnabled}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition cursor-pointer ${
                    soundEnabled
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-rose-950/50 border-rose-600/50 text-rose-300'
                  }`}
                >
                  {soundEnabled ? '靜音' : '開啟'}
                </button>
              </div>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={soundEnabled ? volumePercent : 0}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  onVolumeChange(val);
                  if (!soundEnabled && val > 0) {
                    onToggleSoundEnabled();
                  }
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-0.5">
              <span>0%</span>
              <span className="text-slate-400 font-medium">預設 50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Screen Shake Toggle */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                screenShake ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">螢幕震動 (Screen Shake)</div>
                <div className="text-[11px] text-slate-400">重擊或爆擊時的鏡頭震動反饋</div>
              </div>
            </div>

            {/* Switch button */}
            <button
              onClick={onToggleScreenShake}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                screenShake ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  screenShake ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Controls Quick Recap */}
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5 text-[11px]">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>常用操控指南</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
              <div>• 移動：<span className="text-slate-200">A / D</span></div>
              <div>• 跳躍：<span className="text-slate-200">空白鍵 (二段跳)</span></div>
              <div>• 斬擊：<span className="text-rose-400 font-bold">Ctrl (左/右)</span></div>
              <div>• 下跳平臺：<span className="text-sky-300 font-semibold">↓ + 空白</span></div>
              <div>• 衝刺閃避：<span className="text-slate-200">Shift</span></div>
              <div>• 武器軍械庫：<span className="text-amber-400 font-semibold">B 鍵</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢復預設設定</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-lg cursor-pointer"
          >
            確定完成
          </button>
        </div>
      </div>
    </div>
  );
};
