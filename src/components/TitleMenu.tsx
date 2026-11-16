import React, { useState } from 'react';
import { Play, Star, Volume2, VolumeX, Clock, Compass, CheckCircle2, Zap } from 'lucide-react';
import {
  GameMode,
  ProgressMap,
  TRACK_CONFIGS,
  TrackId,
} from '../types/game';

interface TitleMenuProps {
  selectedTrack: TrackId;
  onSelectTrack: (track: TrackId) => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  progress: ProgressMap;
  muted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  selectedTrack,
  onSelectTrack,
  selectedMode,
  onSelectMode,
  progress,
  muted,
  onToggleMute,
  onStartGame,
}) => {
  const [heroImgError, setHeroImgError] = useState(false);
  const [mascotImgError, setMascotImgError] = useState(false);

  const activeTrack = TRACK_CONFIGS.find((t) => t.id === selectedTrack) ?? TRACK_CONFIGS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Clean 3-Zone Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6 border-b border-slate-200">
        <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Számvonat Expressz
        </div>

        <div className="hidden md:flex items-center gap-3 text-sm text-slate-600">
          <span>Sokszínű matematika 3. (I. félév)</span>
          <span aria-hidden="true">·</span>
          <span>43–45. oldal</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Hang bekapcsolása' : 'Hang kikapcsolása'}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? 'Hang ki' : 'Hang be'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Conductor Intro, Mode & Track Selector */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            {/* Conductor Greeting */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-sky-50 shrink-0">
                {!mascotImgError ? (
                  <img
                    src="/src/assets/images/conductor_mascot_1794828226014.jpg"
                    alt="Márton, a mozdonyvezető"
                    referrerPolicy="no-referrer"
                    onError={() => setMascotImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-display font-bold text-xl">
                    M
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight text-balance">
                  Indulásra kész a Számvonat!
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  Szia! Márton vagyok. Gyakoroljuk együtt a Sokszínű matematika 3. osztályos
                  43–45. oldalának feladatait: analógiákat, pótlásokat, sorozatokat és relációjeleket!
                </p>
              </div>
            </div>

            {/* Game Mode Segmented Control */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h2 className="font-display text-base font-bold text-slate-900">
                  1. Válassz játékmódot
                </h2>
                <span className="text-xs text-slate-500">
                  {selectedMode === 'gamer'
                    ? 'Animált akciópálya · Lézerágyú, Turbó x2 kombó és Boss-harc'
                    : selectedMode === 'kaland'
                      ? '10 állomás · 3 szív · Rakodó ládák időnyomás nélkül'
                      : '60 másodperc · Minél több gyors helyes válasz'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => onSelectMode('gamer')}
                  className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedMode === 'gamer'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Turbó Akció</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMode('kaland')}
                  className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedMode === 'kaland'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Kaland mód</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMode('villam')}
                  className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedMode === 'villam'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Villámfutam</span>
                </button>
              </div>
            </div>

            {/* Track Selection */}
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 mb-3">
                2. Válassz vasútvonalat (43–45. oldal)
              </h2>
              <div className="space-y-3">
                {TRACK_CONFIGS.map((track) => {
                  const isSelected = track.id === selectedTrack;
                  const trackProg = progress[track.id];

                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => onSelectTrack(track.id)}
                      className={`w-full text-left rounded-xl p-4 border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                        isSelected
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg font-bold text-slate-900">
                              {track.title}
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                className="w-5 h-5 text-emerald-600 shrink-0"
                                aria-label="Kiválasztva"
                              />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-emerald-700">
                              {track.pageTag}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700">
                              {track.difficultyLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-math text-slate-600">{track.examples}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5">
                            {track.description}
                          </p>
                        </div>

                        {/* Earned Stars & Best Score */}
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-1" aria-label={`${trackProg.stars} csillag a 3-ból`}>
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= trackProg.stars
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-math text-slate-500 mt-1.5">
                            {trackProg.bestScore > 0
                              ? `Csúcs: ${trackProg.bestScore}`
                              : 'Még nincs pont'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Artwork + Start Action */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-xs gap-5">
            <div className="space-y-4">
              <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden border border-slate-200 bg-sky-100">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/train_express_hero_1794828225278.jpg"
                    alt="Számvonat Expressz viadukton"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white font-display font-bold text-xl">
                    Számvonat Expressz
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Kiválasztott útvonal · {activeTrack.pageTag}
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                  {activeTrack.title}
                </h3>
                <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="font-math font-bold text-emerald-700 shrink-0">01.</span>
                    <span>
                      <strong>Analógiák és láncszámolás:</strong> Figyeld a helyi értéket (4+3 → 40+30 → 400+300) és számolj lépésről lépésre!
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-math font-bold text-emerald-700 shrink-0">02.</span>
                    <span>
                      <strong>Sorozatok és pótlás:</strong> Találd meg a szabályt, pótold a hiányzó százasokat, vagy állíts be pontos rakományt!
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-math font-bold text-emerald-700 shrink-0">03.</span>
                    <span>
                      <strong>Relációjelek és Számoló-segéd:</strong> Hasonlítsd össze a két oldalt (&lt;, =, &gt;), és kérj segítséget bármikor!
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartGame}
              className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:translate-y-0.5 text-white font-display text-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Játék indítása</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
