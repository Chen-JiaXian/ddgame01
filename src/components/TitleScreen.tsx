import React, { useEffect } from 'react';
import { Sword, Play, ShieldAlert, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenShop?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-8 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-slate-950/95 backdrop-blur-[2px] select-none">
      {/* Top Spacer / Tag */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-pink-500/30 text-pink-300 text-xs font-semibold tracking-wider uppercase shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>🐷 豬豬冒險 · 2D Action RPG Platformer</span>
      </div>

      {/* Hero Centerpiece & Bespoke Title Lockup */}
      <div className="flex flex-col items-center max-w-xl text-center">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="relative mb-4 flex items-center justify-center">
          <svg
            className="w-72 sm:w-96 h-32 drop-shadow-[0_10px_25px_rgba(244,114,182,0.25)]"
            viewBox="0 0 400 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="pigEarsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
            {/* Crossed Sword Silhouettes in Background */}
            <path
              d="M120 110L280 25M125 115L285 30"
              stroke="rgba(244, 114, 182, 0.25)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M280 110L120 25M275 115L115 30"
              stroke="rgba(244, 114, 182, 0.25)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Mini Cute Piggy Hero Emblem on Top */}
            <g transform="translate(200, 22)">
              {/* Ears */}
              <polygon points="-14,-8 -9,-17 -3,-7" fill="url(#pigEarsGrad)" />
              <polygon points="14,-8 9,-17 3,-7" fill="url(#pigEarsGrad)" />
              <polygon points="-12,-8 -8,-14 -4,-7" fill="#fb7185" />
              <polygon points="12,-8 8,-14 4,-7" fill="#fb7185" />
              {/* Head */}
              <circle cx="0" cy="0" r="14" fill="#f472b6" />
              {/* Headband */}
              <rect x="-14" y="-7" width="28" height="4" fill="#dc2626" rx="1" />
              {/* Eyes */}
              <circle cx="-5" cy="-1" r="2.2" fill="#0f172a" />
              <circle cx="-5.8" cy="-1.8" r="0.8" fill="#ffffff" />
              <circle cx="5" cy="-1" r="2.2" fill="#0f172a" />
              <circle cx="4.2" cy="-1.8" r="0.8" fill="#ffffff" />
              {/* Snout */}
              <ellipse cx="0" cy="4" rx="7" ry="5" fill="#fb7185" stroke="#e11d48" strokeWidth="1" />
              <ellipse cx="-2.5" cy="4.2" rx="1.2" ry="1.8" fill="#881337" />
              <ellipse cx="2.5" cy="4.2" rx="1.2" ry="1.8" fill="#881337" />
            </g>

            {/* Bold Stylized Typography */}
            <text
              x="200"
              y="74"
              textAnchor="middle"
              fill="url(#bladeGrad)"
              fontSize="48"
              fontWeight="900"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              letterSpacing="4"
            >
              豬豬冒險
            </text>
            <text
              x="200"
              y="108"
              textAnchor="middle"
              fill="url(#glowGrad)"
              fontSize="17"
              fontWeight="800"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              letterSpacing="5"
            >
              PIGGY ADVENTURE · 魔物討伐傳
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-slate-300 max-w-md font-medium leading-relaxed mb-6">
          化身超萌英勇的粉紅豬豬，勇闖神秘深淵地城，擊敗各式魔物獲取經驗升級！
          <br />
          收集滿地金幣，購買解鎖傳說中的烈焰、奔雷與聖光神兵！
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 text-base font-extrabold text-amber-950 bg-gradient-to-r from-amber-400 via-pink-300 to-amber-500 rounded-2xl shadow-xl shadow-pink-500/20 hover:shadow-pink-500/35 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-pink-200"
        >
          <Play className="w-5 h-5 fill-amber-950 text-amber-950 group-hover:translate-x-0.5 transition-transform" />
          <span>豬豬啟程討伐 (Space / Enter)</span>
        </button>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="flex flex-col items-center gap-2 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-300">
          <span className="font-semibold text-white">A / D</span> 移動 ·{' '}
          <span className="font-semibold text-white">空白</span> 跳躍 / 二段跳 ·{' '}
          <span className="font-bold text-rose-400">Ctrl (左/右)</span> 斬擊(邊跑跳邊揮砍) ·{' '}
          <span className="font-semibold text-sky-300">↓ + 空白</span> 下跳平臺 ·{' '}
          <span className="font-semibold text-white">Shift</span> 衝刺閃避 ·{' '}
          <span className="font-semibold text-amber-400">B</span> 武器商店 ·{' '}
          <span className="font-semibold text-white">Esc</span> 暫停
        </div>
        <p className="text-[11px] text-slate-500">
          支援行動裝置觸控虛擬按鈕與鍵盤遊玩
        </p>
      </div>
    </div>
  );
};
