import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, ChevronUp, Sword, Wind } from 'lucide-react';

interface TouchControlsProps {
  onInput: (action: 'left' | 'right' | 'down' | 'jump' | 'attack' | 'dash', active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 pb-6 flex justify-between items-end select-none z-20 md:hidden">
      {/* D-Pad on Left */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('left', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('left', false);
          }}
          onMouseDown={() => onInput('left', true)}
          onMouseUp={() => onInput('left', false)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('down', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('down', false);
          }}
          onMouseDown={() => onInput('down', true)}
          onMouseUp={() => onInput('down', false)}
          className="w-12 h-12 rounded-2xl bg-slate-900/80 active:bg-slate-700 border border-slate-700/80 text-slate-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('right', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('right', false);
          }}
          onMouseDown={() => onInput('right', true)}
          onMouseUp={() => onInput('right', false)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons on Right */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {/* Dash */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('dash', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('dash', false);
          }}
          onMouseDown={() => onInput('dash', true)}
          onMouseUp={() => onInput('dash', false)}
          className="w-13 h-13 rounded-2xl bg-sky-950/80 active:bg-sky-800 border border-sky-500/50 text-sky-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Wind className="w-5 h-5" />
        </button>

        {/* Jump */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('jump', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('jump', false);
          }}
          onMouseDown={() => onInput('jump', true)}
          onMouseUp={() => onInput('jump', false)}
          className="w-15 h-15 rounded-2xl bg-amber-600/90 active:bg-amber-500 border border-amber-400 text-amber-950 font-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronUp className="w-7 h-7" />
        </button>

        {/* Attack */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('attack', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('attack', false);
          }}
          onMouseDown={() => onInput('attack', true)}
          onMouseUp={() => onInput('attack', false)}
          className="w-16 h-16 rounded-2xl bg-rose-600 active:bg-rose-500 border border-rose-400 text-white font-black flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <Sword className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
