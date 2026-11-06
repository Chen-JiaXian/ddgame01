import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine.ts';
import { PlayerStats, Enemy, WeaponId, TalentKey } from './game/types.ts';
import { HUD } from './components/HUD.tsx';
import { ShopModal } from './components/ShopModal.tsx';
import { TalentTreeModal } from './components/TalentTreeModal.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { PauseModal, GameOverModal, VictoryModal } from './components/GameModals.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { TouchControls } from './components/TouchControls.tsx';
import { sounds } from './audio/soundManager.ts';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level App Screens
  const [screen, setScreen] = useState<'title' | 'playing' | 'gameover' | 'victory'>('title');
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isTalentsOpen, setIsTalentsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Sound & Screen Shake Settings (預設音量50%，螢幕震動預設開)
  const [volume, setVolume] = useState<number>(0.5);
  const [screenShakeEnabled, setScreenShakeEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Synced Player & Game State
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    exp: 0,
    nextLevelExp: 120, // 提升升級所需經驗值
    hp: 100,
    maxHp: 100,
    baseAtk: 10,
    def: 2,
    coins: 30,
    equippedWeaponId: 'rusty_dagger',
    ownedWeaponIds: ['rusty_dagger'],
    monstersSlain: 0,
    hpRegen: 1, // 每秒回復生命屬性，基礎值為1
    talentPoints: 1, // 初始提供 1 點天賦點數
    talents: {
      damage: 0,
      range: 0,
      attackSpeed: 0,
      hpRegen: 0,
      moveSpeed: 0,
    },
  });
  const [boss, setBoss] = useState<Enemy | null>(null);
  const [stageName, setStageName] = useState<string>('第 1 區：迷霧地城');

  // Resize canvas to full window
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Initialize Canvas & Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    handleResize();
    window.addEventListener('resize', handleResize);

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Callbacks
    engine.onStatsChange = (newStats) => {
      setStats(newStats);
    };

    engine.onBossChange = (newBoss) => {
      setBoss(newBoss ? { ...newBoss } : null);
    };

    engine.onStageChange = (name) => {
      setStageName(name);
    };

    engine.onGameOver = () => {
      setScreen('gameover');
      sounds.playGameOver?.();
    };

    engine.onVictory = () => {
      setScreen('victory');
    };

    engine.setMenuMode(true);
    engine.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [handleResize]);

  // Window blur: Clear all held keys
  useEffect(() => {
    const handleBlur = () => {
      if (!engineRef.current) return;
      const inp = engineRef.current.input;
      inp.left = false;
      inp.right = false;
      inp.up = false;
      inp.down = false;
      inp.jump = false;
      inp.attack = false;
      inp.dash = false;
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Toggle Shop via 'B' key
      if (e.code === 'KeyB') {
        e.preventDefault();
        if (screen === 'playing' && !isPaused) {
          setIsShopOpen((prev) => !prev);
        }
        return;
      }

      // Toggle Talent Tree via 'T' key
      if (e.code === 'KeyT') {
        e.preventDefault();
        if (screen === 'playing' && !isPaused) {
          setIsTalentsOpen((prev) => !prev);
        }
        return;
      }

      // Toggle Pause via 'Escape'
      if (e.code === 'Escape') {
        e.preventDefault();
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isTalentsOpen) {
          setIsTalentsOpen(false);
          return;
        }
        if (isShopOpen) {
          setIsShopOpen(false);
          return;
        }
        if (screen === 'playing') {
          setIsPaused((prev) => {
            const next = !prev;
            if (next) engine.pause();
            else engine.resume();
            return next;
          });
        }
        return;
      }

      if (screen !== 'playing' || isPaused || isShopOpen || isSettingsOpen || isTalentsOpen) return;

      const inp = engine.input;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inp.left = true;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inp.right = true;
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        inp.up = true;
        if (!inp.jump) {
          inp.jumpJustPressed = true;
        }
        inp.jump = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!inp.jump) {
          inp.jumpJustPressed = true;
        }
        inp.jump = true;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        inp.down = true;
      } else if (
        e.code === 'ControlLeft' ||
        e.code === 'ControlRight' ||
        e.code === 'KeyJ' ||
        e.code === 'KeyZ'
      ) {
        e.preventDefault();
        if (!inp.attack) {
          inp.attackJustPressed = true;
        }
        inp.attack = true;
      } else if (e.code === 'KeyL' || e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!inp.dash) {
          inp.dashJustPressed = true;
        }
        inp.dash = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const inp = engine.input;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inp.left = false;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inp.right = false;
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        inp.up = false;
        inp.jump = false;
      } else if (e.code === 'Space') {
        inp.jump = false;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        inp.down = false;
      } else if (
        e.code === 'ControlLeft' ||
        e.code === 'ControlRight' ||
        e.code === 'KeyJ' ||
        e.code === 'KeyZ'
      ) {
        inp.attack = false;
      } else if (e.code === 'KeyL' || e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        inp.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, isPaused, isShopOpen, isSettingsOpen, isTalentsOpen]);

  // Touch controls bridge
  const handleTouchInput = (
    action: 'left' | 'right' | 'down' | 'jump' | 'attack' | 'dash',
    active: boolean
  ) => {
    const engine = engineRef.current;
    if (!engine || screen !== 'playing' || isPaused || isShopOpen || isTalentsOpen) return;

    const inp = engine.input;
    if (action === 'left') inp.left = active;
    if (action === 'right') inp.right = active;
    if (action === 'down') inp.down = active;
    if (action === 'jump') {
      if (active && !inp.jump) inp.jumpJustPressed = true;
      inp.jump = active;
      inp.up = active;
    }
    if (action === 'attack') {
      if (active && !inp.attack) inp.attackJustPressed = true;
      inp.attack = active;
    }
    if (action === 'dash') {
      if (active && !inp.dash) inp.dashJustPressed = true;
      inp.dash = active;
    }
  };

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  // Actions
  const handleStartGame = () => {
    setScreen('playing');
    setIsPaused(false);
    engineRef.current?.setMenuMode(false);
    engineRef.current?.resume();
  };

  const handleRestart = () => {
    setIsPaused(false);
    setIsShopOpen(false);
    setIsTalentsOpen(false);
    setScreen('playing');
    engineRef.current?.setMenuMode(false);
    engineRef.current?.loadLevel(0, false);
    engineRef.current?.resume();
  };

  const handleNextCycle = () => {
    setScreen('playing');
    setIsPaused(false);
    // Loop back to Stage 1 keeping all current weapons, coins and stats!
    engineRef.current?.setMenuMode(false);
    engineRef.current?.loadLevel(0, true);
    engineRef.current?.resume();
  };

  const handleBuyWeapon = (weaponId: WeaponId) => {
    engineRef.current?.buyWeapon(weaponId);
  };

  const handleEquipWeapon = (weaponId: WeaponId) => {
    engineRef.current?.equipWeapon(weaponId);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    sounds.setVolume(vol);
  };

  const handleToggleScreenShake = () => {
    const next = !screenShakeEnabled;
    setScreenShakeEnabled(next);
    if (engineRef.current) {
      engineRef.current.screenShakeEnabled = next;
    }
  };

  const handleToggleSoundEnabled = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  const handleTogglePause = () => {
    if (screen !== 'playing') return;
    setIsPaused((prev) => {
      const next = !prev;
      if (next) engineRef.current?.pause();
      else engineRef.current?.resume();
      return next;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60fps Isolated HTML5 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {screen === 'title' && <TitleScreen onStart={handleStartGame} />}

      {/* In-Game World-Matched HUD */}
      {screen === 'playing' && (
        <>
          <HUD
            stats={stats}
            boss={boss}
            stageName={stageName}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenTalents={() => setIsTalentsOpen(true)}
            onTogglePause={handleTogglePause}
          />
          <TouchControls onInput={handleTouchInput} />
        </>
      )}

      {/* Talent Tree Modal */}
      {isTalentsOpen && (
        <TalentTreeModal
          stats={stats}
          onUpgradeTalent={(key) => engineRef.current?.upgradeTalent(key)}
          onDowngradeTalent={(key) => engineRef.current?.downgradeTalent(key)}
          onResetTalents={() => engineRef.current?.resetTalents()}
          onClose={() => setIsTalentsOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          volume={volume}
          onVolumeChange={handleVolumeChange}
          screenShake={screenShakeEnabled}
          onToggleScreenShake={handleToggleScreenShake}
          soundEnabled={soundEnabled}
          onToggleSoundEnabled={handleToggleSoundEnabled}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Weapon Shop Modal */}
      {isShopOpen && (
        <ShopModal
          coins={stats.coins}
          equippedWeaponId={stats.equippedWeaponId}
          ownedWeaponIds={stats.ownedWeaponIds}
          onBuyWeapon={handleBuyWeapon}
          onEquipWeapon={handleEquipWeapon}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={() => {
            setIsPaused(false);
            engineRef.current?.resume();
          }}
          onRestart={handleRestart}
          onOpenTalents={() => {
            setIsPaused(false);
            setIsTalentsOpen(true);
          }}
          onOpenShop={() => {
            setIsPaused(false);
            setIsShopOpen(true);
          }}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
          }}
        />
      )}

      {/* Game Over Modal */}
      {screen === 'gameover' && (
        <GameOverModal stats={stats} onRestart={handleRestart} />
      )}

      {/* Victory Modal */}
      {screen === 'victory' && (
        <VictoryModal stats={stats} onNextCycle={handleNextCycle} />
      )}
    </div>
  );
}
