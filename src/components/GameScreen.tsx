import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Heart,
  HelpCircle,
  Home,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {
  AnsweredRecord,
  ComparisonSign,
  GameMode,
  MAX_HEARTS,
  MathQuestion,
  TOTAL_KALAND_STATIONS,
  TRACK_CONFIGS,
  TrackId,
  VILLAM_DURATION_SECONDS,
} from '../types/game';
import { generateQuestion } from '../utils/questionGenerator';
import { soundEngine } from '../utils/sound';
import { PlaceValueHelper } from './PlaceValueHelper';
import { TrainStage } from './TrainStage';

interface GameScreenProps {
  trackId: TrackId;
  mode: GameMode;
  muted: boolean;
  onToggleMute: () => void;
  onExitToMenu: () => void;
  onFinishRound: (records: AnsweredRecord[], finalScore: number, bestStreak: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  trackId,
  mode,
  muted,
  onToggleMute,
  onExitToMenu,
  onFinishRound,
}) => {
  const track = TRACK_CONFIGS.find((t) => t.id === trackId) ?? TRACK_CONFIGS[0];

  const [stationIndex, setStationIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(VILLAM_DURATION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);

  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateQuestion(trackId, 1, mode)
  );
  const [currentCargo, setCurrentCargo] = useState<number>(
    question.cargoStart ?? 0
  );
  const [showHelper, setShowHelper] = useState(false);
  const [usedHintOnCurrent, setUsedHintOnCurrent] = useState(false);

  const [feedback, setFeedback] = useState<{
    status: 'none' | 'correct' | 'wrong';
    chosenAnswer?: number | ComparisonSign;
  }>({ status: 'none' });

  const [trainPhase, setTrainPhase] = useState<'entering' | 'idle' | 'departing'>('entering');
  const [records, setRecords] = useState<AnsweredRecord[]>([]);

  const advanceTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    };
  }, []);

  useEffect(() => {
    enterTimerRef.current = window.setTimeout(() => {
      setTrainPhase('idle');
    }, 350);
    return () => {
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'villam' || isPaused) return;
    if (timeLeft <= 0) {
      soundEngine.playVictory();
      onFinishRound(records, score, bestStreak);
      return;
    }
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mode, isPaused, timeLeft, records, score, bestStreak, onFinishRound]);

  const loadNextStation = useCallback(
    (
      nextIndex: number,
      updatedRecords: AnsweredRecord[],
      updatedScore: number,
      updatedBestStreak: number,
      updatedHearts: number
    ) => {
      if (mode === 'kaland' && (nextIndex > TOTAL_KALAND_STATIONS || updatedHearts <= 0)) {
        soundEngine.playVictory();
        onFinishRound(updatedRecords, updatedScore, updatedBestStreak);
        return;
      }

      setTrainPhase('departing');
      advanceTimerRef.current = window.setTimeout(() => {
        const nextQ = generateQuestion(trackId, nextIndex, mode, question.promptText);
        setStationIndex(nextIndex);
        setQuestion(nextQ);
        setCurrentCargo(nextQ.cargoStart ?? 0);
        setFeedback({ status: 'none' });
        setShowHelper(false);
        setUsedHintOnCurrent(false);
        setTrainPhase('entering');

        enterTimerRef.current = window.setTimeout(() => {
          setTrainPhase('idle');
        }, 280);
      }, 360);
    },
    [mode, onFinishRound, question.promptText, trackId]
  );

  const handleAnswerSubmit = useCallback(
    (answerVal: number | ComparisonSign) => {
      if (feedback.status !== 'none' || isPaused) return;

      const isCorrect = answerVal === question.correctAnswer;
      const newRecord: AnsweredRecord = {
        question,
        userAnswer: answerVal,
        isCorrect,
        usedHint: usedHintOnCurrent,
      };
      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);

      if (isCorrect) {
        const nextStreak = streak + 1;
        const nextBest = Math.max(bestStreak, nextStreak);
        const comboBonus = nextStreak >= 3 ? 30 : 0;
        const hintDeduction = usedHintOnCurrent ? 20 : 0;
        const earned = Math.max(50, 100 + comboBonus - hintDeduction);
        const updatedScore = score + earned;

        setStreak(nextStreak);
        setBestStreak(nextBest);
        setScore(updatedScore);
        setFeedback({ status: 'correct', chosenAnswer: answerVal });

        if (nextStreak >= 3) {
          soundEngine.playComboSuccess();
        } else {
          soundEngine.playSuccess();
        }

        advanceTimerRef.current = window.setTimeout(() => {
          loadNextStation(
            stationIndex + 1,
            updatedRecords,
            updatedScore,
            nextBest,
            hearts
          );
        }, mode === 'villam' ? 550 : 950);
      } else {
        const updatedHearts = mode === 'kaland' ? Math.max(0, hearts - 1) : hearts;
        setStreak(0);
        setHearts(updatedHearts);
        setFeedback({ status: 'wrong', chosenAnswer: answerVal });
        setShowHelper(true);
        soundEngine.playError();
      }
    },
    [
      bestStreak,
      feedback.status,
      hearts,
      isPaused,
      loadNextStation,
      mode,
      question,
      records,
      score,
      stationIndex,
      streak,
      usedHintOnCurrent,
    ]
  );

  const handleContinueAfterWrong = useCallback(() => {
    if (feedback.status !== 'wrong') return;
    soundEngine.playClick();
    loadNextStation(stationIndex + 1, records, score, bestStreak, hearts);
  }, [bestStreak, feedback.status, hearts, loadNextStation, records, score, stationIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
        return;
      }
      if (isPaused) return;

      if (feedback.status === 'wrong' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleContinueAfterWrong();
        return;
      }

      if (
        feedback.status === 'none' &&
        (question.type === 'choice' ||
          question.type === 'analogy' ||
          question.type === 'sequence' ||
          question.type === 'comparison')
      ) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1 && question.options[idx] !== undefined) {
          e.preventDefault();
          handleAnswerSubmit(question.options[idx]);
          return;
        }
        if (question.type === 'comparison') {
          if (e.key === '<') {
            e.preventDefault();
            handleAnswerSubmit('<');
          } else if (e.key === '=') {
            e.preventDefault();
            handleAnswerSubmit('=');
          } else if (e.key === '>') {
            e.preventDefault();
            handleAnswerSubmit('>');
          }
        }
      }

      if (feedback.status === 'none' && question.type === 'cargo' && e.key === 'Enter') {
        e.preventDefault();
        handleAnswerSubmit(currentCargo);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentCargo,
    feedback.status,
    handleAnswerSubmit,
    handleContinueAfterWrong,
    isPaused,
    question,
  ]);

  const adjustCargo = (delta: number) => {
    if (feedback.status !== 'none' || isPaused) return;
    const next = Math.max(0, Math.min(1000, currentCargo + delta));
    if (next !== currentCargo) {
      soundEngine.playCrateDrop();
      setCurrentCargo(next);
    }
  };

  const handleRestart = () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    const firstQ = generateQuestion(trackId, 1, mode);
    setStationIndex(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHearts(MAX_HEARTS);
    setTimeLeft(VILLAM_DURATION_SECONDS);
    setQuestion(firstQ);
    setCurrentCargo(firstQ.cargoStart ?? 0);
    setFeedback({ status: 'none' });
    setShowHelper(false);
    setUsedHintOnCurrent(false);
    setRecords([]);
    setIsPaused(false);
    setTrainPhase('idle');
    soundEngine.playTrainWhistle();
  };

  const stationName =
    track.stationNames[(stationIndex - 1) % track.stationNames.length];

  const formatTimer = (sec: number) => {
    const s = Math.max(0, sec);
    return `00:${s.toString().padStart(2, '0')}`;
  };

  const taskHeaderLabel =
    question.type === 'cargo'
      ? 'Rakodóállomás · Pakolj a teherkocsira!'
      : question.type === 'analogy'
        ? 'Analógia-híd · Használd az előző lépések mintáját!'
        : question.type === 'sequence'
          ? 'Számsorozat · Keresd meg a szabályt és a következő számot!'
          : question.type === 'comparison'
            ? 'Mérleg-vágány · Tedd ki a helyes relációjelet!'
            : 'Váltóállítás · Válaszd ki a helyes számot!';

  const comparisonLabel = (sign: ComparisonSign) =>
    sign === '<' ? 'Kisebb' : sign === '=' ? 'Egyenlő' : 'Nagyobb';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Unobtrusive Top HUD */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 backdrop-blur-xs sticky top-0 z-20">
        <div className="flex items-center gap-3 text-sm min-w-0">
          <span className="font-display font-bold text-slate-900 truncate">
            {track.title}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="text-xs font-semibold text-emerald-700 hidden sm:inline">
            {track.pageTag}
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
          {mode === 'kaland' ? (
            <span className="font-math font-semibold text-slate-700 whitespace-nowrap">
              {stationIndex} / {TOTAL_KALAND_STATIONS} állomás
            </span>
          ) : (
            <span
              className={`font-math font-bold whitespace-nowrap ${
                timeLeft <= 10 ? 'text-red-600' : 'text-slate-800'
              }`}
            >
              Idő: {formatTimer(timeLeft)}
            </span>
          )}
        </div>

        {/* Center / Right Meters */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-math font-bold text-slate-900 whitespace-nowrap">
              Pont: {score}
            </span>
            <span className="inline-flex items-center gap-1 font-math font-semibold text-amber-700 whitespace-nowrap">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{streak}</span>
            </span>
            {mode === 'kaland' && (
              <div
                className="flex items-center gap-1"
                aria-label={`${hearts} élet maradt a ${MAX_HEARTS}-ból`}
              >
                {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`w-4 h-4 transition-transform ${
                      idx < hearts
                        ? 'fill-red-500 text-red-600'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Hang bekapcsolása' : 'Hang kikapcsolása'}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Szünet</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Play Workspace */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">
        {mode === 'kaland' && (
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{
                width: `${((stationIndex - 1) / TOTAL_KALAND_STATIONS) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Animated 2D Railway Stage */}
        <TrainStage
          stationNumber={stationIndex}
          stationName={stationName}
          question={question}
          currentCargo={currentCargo}
          trainPhase={trainPhase}
          feedbackState={feedback.status}
        />

        {/* Active Math Task Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Row: Task Type + Helper Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs sm:text-sm font-semibold text-slate-500">
              {taskHeaderLabel}
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                if (!showHelper) setUsedHintOnCurrent(true);
                setShowHelper((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                showHelper
                  ? 'bg-sky-50 border-sky-300 text-sky-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>{showHelper ? 'Segítség elrejtése' : 'Segítség'}</span>
            </button>
          </div>

          {/* Prompt Display by Task Type */}
          <div className="text-center py-2">
            {question.type === 'analogy' && question.analogySteps ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {question.analogySteps.map((stepStr, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 font-math text-lg sm:text-xl font-bold text-slate-600"
                    >
                      {stepStr}
                    </div>
                  ))}
                </div>
                <div className="font-math text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 pt-1">
                  {question.promptText}
                </div>
              </div>
            ) : question.type === 'sequence' && question.sequenceItems ? (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {question.sequenceItems.map((num, idx) => (
                  <React.Fragment key={idx}>
                    <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 font-math text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {num}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  </React.Fragment>
                ))}
                <div className="px-5 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-500 font-math text-2xl sm:text-3xl font-extrabold text-emerald-800">
                  ?
                </div>
              </div>
            ) : question.type === 'comparison' ? (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 font-math text-2xl sm:text-4xl font-extrabold text-slate-900">
                  {question.comparisonLeft}
                </div>
                <div className="w-14 h-14 rounded-xl bg-sky-50 border-2 border-sky-400 flex items-center justify-center font-math text-3xl font-extrabold text-sky-900">
                  {feedback.status !== 'none' ? question.correctAnswer : '?'}
                </div>
                <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 font-math text-2xl sm:text-4xl font-extrabold text-slate-900">
                  {question.comparisonRight}
                </div>
              </div>
            ) : question.type === 'cargo' ? (
              <div className="space-y-2">
                <p className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  {question.promptText}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base pt-1">
                  <span className="text-slate-600">
                    Kezdés:{' '}
                    <strong className="font-math text-slate-900">
                      {question.cargoStart}
                    </strong>
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-600">
                    Most a kocsin:{' '}
                    <strong
                      className={`font-math text-lg ${
                        currentCargo === question.cargoTarget
                          ? 'text-emerald-700'
                          : 'text-sky-700'
                      }`}
                    >
                      {currentCargo}
                    </strong>
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-600">
                    Cél:{' '}
                    <strong className="font-math text-slate-900">
                      {question.cargoTarget}
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="font-math text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                {question.promptText}
              </div>
            )}
          </div>

          {/* Interactive Controls */}
          {question.type === 'comparison' ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
              {(question.options as ComparisonSign[]).map((sign, idx) => {
                const isChosen = feedback.chosenAnswer === sign;
                const isCorrectOpt = sign === question.correctAnswer;

                let btnStyle =
                  'bg-slate-50 border-slate-300 text-slate-900 hover:bg-sky-50 hover:border-sky-400';

                if (feedback.status !== 'none') {
                  if (isCorrectOpt) {
                    btnStyle =
                      'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/30';
                  } else if (isChosen && !isCorrectOpt) {
                    btnStyle =
                      'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/20';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-70';
                  }
                }

                return (
                  <button
                    key={sign}
                    type="button"
                    disabled={feedback.status !== 'none'}
                    onClick={() => handleAnswerSubmit(sign)}
                    className={`relative min-h-[76px] rounded-xl border-2 px-4 py-3 transition-all active:scale-[0.98] flex flex-col items-center justify-center cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${btnStyle}`}
                  >
                    <span className="absolute top-2 left-2.5 text-[11px] font-sans font-semibold text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="font-math text-3xl font-extrabold leading-none">
                      {sign}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 mt-1">
                      {comparisonLabel(sign)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : question.type !== 'cargo' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {question.options.map((opt, idx) => {
                const isChosen = feedback.chosenAnswer === opt;
                const isCorrectOpt = opt === question.correctAnswer;

                let btnStyle =
                  'bg-slate-50 border-slate-300 text-slate-900 hover:bg-sky-50 hover:border-sky-400';

                if (feedback.status !== 'none') {
                  if (isCorrectOpt) {
                    btnStyle =
                      'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/30';
                  } else if (isChosen && !isCorrectOpt) {
                    btnStyle =
                      'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/20';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-70';
                  }
                }

                return (
                  <button
                    key={String(opt)}
                    type="button"
                    disabled={feedback.status !== 'none'}
                    onClick={() => handleAnswerSubmit(opt)}
                    className={`relative min-h-[72px] rounded-xl border-2 px-4 py-4 font-math text-2xl sm:text-3xl font-extrabold transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${btnStyle}`}
                  >
                    <span className="absolute top-2 left-2.5 text-[11px] font-sans font-semibold text-slate-400">
                      {idx + 1}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  disabled={feedback.status !== 'none'}
                  onClick={() => adjustCargo(100)}
                  className="min-h-[60px] rounded-xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 font-math text-xl font-extrabold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  +100 láda
                </button>
                <button
                  type="button"
                  disabled={feedback.status !== 'none'}
                  onClick={() => adjustCargo(10)}
                  className="min-h-[60px] rounded-xl border-2 border-sky-400 bg-sky-50 hover:bg-sky-100 text-sky-950 font-math text-xl font-extrabold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  +10 láda
                </button>
                <button
                  type="button"
                  disabled={feedback.status !== 'none'}
                  onClick={() => adjustCargo(-10)}
                  className="min-h-[60px] rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-slate-800 font-math text-xl font-extrabold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  -10 láda
                </button>
                <button
                  type="button"
                  disabled={feedback.status !== 'none'}
                  onClick={() => adjustCargo(-100)}
                  className="min-h-[60px] rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-slate-800 font-math text-xl font-extrabold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  -100 láda
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={feedback.status !== 'none'}
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentCargo(question.cargoStart ?? 0);
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-sm font-semibold text-slate-700 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  Visszaállítás
                </button>
                <button
                  type="button"
                  disabled={feedback.status !== 'none'}
                  onClick={() => handleAnswerSubmit(currentCargo)}
                  className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display text-base font-bold shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  Indulás!
                </button>
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {feedback.status !== 'none' && (
            <div
              role="status"
              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                feedback.status === 'correct'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.status === 'correct' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-display font-bold text-base">
                    {feedback.status === 'correct'
                      ? streak >= 3
                        ? 'Szuper sorozat! Helyes válasz!'
                        : 'Helyes válasz! Indul a vonat!'
                      : `Majdnem! A helyes válasz: ${question.correctAnswer}`}
                  </div>
                  <p className="text-sm mt-0.5 opacity-90">{question.explanation}</p>
                </div>
              </div>

              {feedback.status === 'wrong' && (
                <button
                  type="button"
                  onClick={handleContinueAfterWrong}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>Következő állomás</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Visual Place Value Helper */}
          {showHelper && (
            <PlaceValueHelper
              question={question}
              revealAnswer={feedback.status !== 'none'}
            />
          )}
        </section>
      </main>

      {/* Pause Modal */}
      {isPaused && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-lg space-y-5 text-center">
            <div>
              <h2 id="pause-title" className="font-display text-2xl font-extrabold text-slate-900">
                Játék szüneteltetve
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {track.title} · {score} pont
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Folytatás</span>
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Újrakezdés</span>
              </button>
              <button
                type="button"
                onClick={onExitToMenu}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>Főmenü</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
