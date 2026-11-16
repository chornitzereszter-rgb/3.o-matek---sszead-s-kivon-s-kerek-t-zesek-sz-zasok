/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { GamerModeScreen } from './components/GamerModeScreen';
import { SummaryScreen, calculateStars } from './components/SummaryScreen';
import { TitleMenu } from './components/TitleMenu';
import {
  AnsweredRecord,
  GameMode,
  GameState,
  ProgressMap,
  TrackId,
} from './types/game';
import { soundEngine } from './utils/sound';

const STORAGE_KEY = 'szamvonat_expressz_progress_v1';

const DEFAULT_PROGRESS: ProgressMap = {
  tizesek: { bestScore: 0, stars: 0, gamesPlayed: 0 },
  szazasok: { bestScore: 0, stars: 0, gamesPlayed: 0 },
  expressz: { bestScore: 0, stars: 0, gamesPlayed: 0 },
};

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ProgressMap>;
    return {
      tizesek: parsed.tizesek ?? DEFAULT_PROGRESS.tizesek,
      szazasok: parsed.szazasok ?? DEFAULT_PROGRESS.szazasok,
      expressz: parsed.expressz ?? DEFAULT_PROGRESS.expressz,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('tizesek');
  const [selectedMode, setSelectedMode] = useState<GameMode>('gamer');
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [runId, setRunId] = useState(1);

  const [lastSummary, setLastSummary] = useState<{
    records: AnsweredRecord[];
    finalScore: number;
    bestStreak: number;
  }>({
    records: [],
    finalScore: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const handleStartGame = useCallback(() => {
    soundEngine.playTrainWhistle();
    setRunId((prev) => prev + 1);
    setGameState('PLAYING');
  }, []);

  const handleFinishRound = useCallback(
    (records: AnsweredRecord[], finalScore: number, bestStreak: number) => {
      const earnedStars = calculateStars(records);
      setProgress((prev) => {
        const current = prev[selectedTrack];
        const updated: ProgressMap = {
          ...prev,
          [selectedTrack]: {
            bestScore: Math.max(current.bestScore, finalScore),
            stars: Math.max(current.stars, earnedStars),
            gamesPlayed: current.gamesPlayed + 1,
          },
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage quota errors
        }
        return updated;
      });

      setLastSummary({ records, finalScore, bestStreak });
      setGameState('ROUND_SUMMARY');
    },
    [selectedTrack]
  );

  if (gameState === 'PLAYING') {
    if (selectedMode === 'gamer') {
      return (
        <GamerModeScreen
          key={`gamer-${selectedTrack}-${runId}`}
          trackId={selectedTrack}
          muted={muted}
          onToggleMute={handleToggleMute}
          onExitToMenu={() => setGameState('TITLE_MENU')}
          onFinishRound={handleFinishRound}
        />
      );
    }

    return (
      <GameScreen
        key={`${selectedTrack}-${selectedMode}-${runId}`}
        trackId={selectedTrack}
        mode={selectedMode}
        muted={muted}
        onToggleMute={handleToggleMute}
        onExitToMenu={() => setGameState('TITLE_MENU')}
        onFinishRound={handleFinishRound}
      />
    );
  }

  if (gameState === 'ROUND_SUMMARY') {
    return (
      <SummaryScreen
        trackId={selectedTrack}
        mode={selectedMode}
        records={lastSummary.records}
        finalScore={lastSummary.finalScore}
        bestStreak={lastSummary.bestStreak}
        onPlayAgain={handleStartGame}
        onBackToMenu={() => setGameState('TITLE_MENU')}
      />
    );
  }

  return (
    <TitleMenu
      selectedTrack={selectedTrack}
      onSelectTrack={(t) => {
        soundEngine.playClick();
        setSelectedTrack(t);
      }}
      selectedMode={selectedMode}
      onSelectMode={(m) => {
        soundEngine.playClick();
        setSelectedMode(m);
      }}
      progress={progress}
      muted={muted}
      onToggleMute={handleToggleMute}
      onStartGame={handleStartGame}
    />
  );
}
