import React, { useState } from 'react';
import { CheckCircle2, Home, RotateCcw, Star, XCircle } from 'lucide-react';
import { AnsweredRecord, GameMode, TRACK_CONFIGS, TrackId } from '../types/game';

interface SummaryScreenProps {
  trackId: TrackId;
  mode: GameMode;
  records: AnsweredRecord[];
  finalScore: number;
  bestStreak: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function calculateStars(records: AnsweredRecord[]): number {
  if (records.length === 0) return 0;
  const correctCount = records.filter((r) => r.isCorrect).length;
  const ratio = correctCount / records.length;
  if (ratio >= 0.9 && correctCount >= 3) return 3;
  if (ratio >= 0.7) return 2;
  if (correctCount >= 1) return 1;
  return 0;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  trackId,
  mode,
  records,
  finalScore,
  bestStreak,
  onPlayAgain,
  onBackToMenu,
}) => {
  const [mascotError, setMascotError] = useState(false);

  const track = TRACK_CONFIGS.find((t) => t.id === trackId) ?? TRACK_CONFIGS[0];
  const total = records.length;
  const correctCount = records.filter((r) => r.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const stars = calculateStars(records);

  const headline =
    stars === 3
      ? 'Fantasztikus utazás! Igazi mozdonyvezető vagy!'
      : stars === 2
        ? 'Szép munka! Ügyesen célba ért a vonat!'
        : 'Megérkeztünk az állomásra! Gyakoroljunk még egy kicsit!';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header & Stars */}
        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-200 pb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-sky-50 shrink-0">
            {!mascotError ? (
              <img
                src="/src/assets/images/conductor_mascot_1794828226014.jpg"
                alt="Márton, a mozdonyvezető"
                referrerPolicy="no-referrer"
                onError={() => setMascotError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-display font-bold text-2xl">
                M
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-semibold text-slate-500">
              {track.title} ·{' '}
              {mode === 'gamer'
                ? 'Turbó Akció'
                : mode === 'kaland'
                  ? 'Kaland mód'
                  : 'Villámfutam'}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 text-balance">
              {headline}
            </h1>
          </div>

          {/* 3-Star Rating */}
          <div className="flex items-center gap-1.5 shrink-0" aria-label={`Elért eredmény: ${stars} csillag a 3-ból`}>
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-8 h-8 ${
                  s <= stars
                    ? 'fill-amber-400 text-amber-500'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Összpontszám</div>
            <div className="font-math text-2xl font-extrabold text-slate-900 mt-1">
              {finalScore}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Helyes válasz</div>
            <div className="font-math text-2xl font-extrabold text-emerald-700 mt-1">
              {correctCount} / {total}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Pontosság</div>
            <div className="font-math text-2xl font-extrabold text-slate-900 mt-1">
              {accuracy}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Legjobb sorozat</div>
            <div className="font-math text-2xl font-extrabold text-amber-700 mt-1">
              {bestStreak}
            </div>
          </div>
        </div>

        {/* Practiced Tasks Review */}
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 mb-3">
            Megoldott feladatok áttekintése
          </h2>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center border border-slate-200 rounded-xl">
              Ebben a körben még nem érkezett válasz.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {records.map((rec, idx) => (
                <div
                  key={`${rec.question.id}-${idx}`}
                  className="px-4 py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rec.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="font-math font-bold text-slate-900 truncate">
                      {rec.question.explanation}
                    </span>
                  </div>
                  <div className="text-xs font-math shrink-0">
                    {rec.isCorrect ? (
                      <span className="text-emerald-700 font-semibold">
                        Helyes ({rec.userAnswer})
                      </span>
                    ) : (
                      <span className="text-red-700 font-semibold">
                        Tipped: {rec.userAnswer} · Helyes: {rec.question.correctAnswer}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>Másik pálya</span>
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Újra játszom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
