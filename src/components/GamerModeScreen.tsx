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
  ShieldAlert,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  AnsweredRecord,
  ComparisonSign,
  MAX_HEARTS,
  MathQuestion,
  TRACK_CONFIGS,
  TrackId,
} from '../types/game';
import { generateQuestion } from '../utils/questionGenerator';
import { soundEngine } from '../utils/sound';
import { GamerArenaCanvas } from './GamerArenaCanvas';
import { PlaceValueHelper } from './PlaceValueHelper';

interface GamerModeScreenProps {
  trackId: TrackId;
  muted: boolean;
  onToggleMute: () => void;
  onExitToMenu: () => void;
  onFinishRound: (records: AnsweredRecord[], finalScore: number, bestStreak: number) => void;
}

const TOTAL_STAGES = 10;
const BOSS_STAGES = new Set([5, 10]);

function getBossMaxHp(stage: number): number {
  return stage === 10 ? 3 : 2;
}

export const GamerModeScreen: React.FC<GamerModeScreenProps> = ({
  trackId,
  muted,
  onToggleMute,
  onExitToMenu,
  onFinishRound,
}) => {
  const track = TRACK_CONFIGS.find((t) => t.id === trackId) ?? TRACK_CONFIGS[0];

  const [stage, setStage] = useState(1);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [isPaused, setIsPaused] = useState(false);

  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateQuestion(trackId, 1, 'gamer')
  );
  const [showHelper, setShowHelper] = useState(false);
  const [usedHintOnCurrent, setUsedHintOnCurrent] = useState(false);

  const [approachProgress, setApproachProgress] = useState(0);
  const [selectedAimIndex, setSelectedAimIndex] = useState<number | null>(0);

  const [feedback, setFeedback] = useState<{
    status: 'none' | 'correct' | 'wrong';
    chosenAnswer?: number | ComparisonSign;
    timeoutMiss?: boolean;
  }>({ status: 'none' });

  const [records, setRecords] = useState<AnsweredRecord[]>([]);

  const [fxState, setFxState] = useState<{
    token: number;
    type: 'none' | 'hit' | 'miss' | 'boss_hit' | 'boss_ko';
    points: number;
  }>({ token: 0, type: 'none', points: 0 });

  const advanceTimerRef = useRef<number | null>(null);
  const isBossWave = BOSS_STAGES.has(stage);
  const isTurbo = streak >= 3;

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Trigger boss alert if starting/entering a boss wave
  useEffect(() => {
    if (BOSS_STAGES.has(stage)) {
      soundEngine.playBossAlert();
    }
  }, [stage]);

  const advanceWaveOrQuestion = useCallback(
    (
      nextStage: number,
      nextBossHp: number,
      nextBossMaxHp: number,
      updatedRecords: AnsweredRecord[],
      updatedScore: number,
      updatedBestStreak: number,
      updatedHearts: number
    ) => {
      if (updatedHearts <= 0 || nextStage > TOTAL_STAGES) {
        soundEngine.playVictory();
        onFinishRound(updatedRecords, updatedScore, updatedBestStreak);
        return;
      }

      const nextQ = generateQuestion(trackId, nextStage, 'gamer', question.promptText);
      setStage(nextStage);
      setBossHp(nextBossHp);
      setBossMaxHp(nextBossMaxHp);
      setQuestion(nextQ);
      setApproachProgress(0);
      setSelectedAimIndex(0);
      setFeedback({ status: 'none' });
      setShowHelper(false);
      setUsedHintOnCurrent(false);
    },
    [onFinishRound, question.promptText, trackId]
  );

  const handleFireAnswer = useCallback(
    (answerVal: number | ComparisonSign, fromTimeout = false) => {
      if (feedback.status !== 'none' || isPaused) return;

      if (!fromTimeout) {
        soundEngine.playLaserShot();
      }

      const isCorrect = !fromTimeout && answerVal === question.correctAnswer;
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
        const turboMult = nextStreak >= 3 ? 2 : 1;
        const hintPenalty = usedHintOnCurrent ? 25 : 0;
        const speedBonus = Math.round((1 - approachProgress) * 40);
        const earned = Math.max(50, (100 + speedBonus - hintPenalty) * turboMult);
        const updatedScore = score + earned;

        setStreak(nextStreak);
        setBestStreak(nextBest);
        setScore(updatedScore);
        setFeedback({ status: 'correct', chosenAnswer: answerVal });

        if (nextStreak === 3) {
          soundEngine.playTurboActivate();
        } else {
          soundEngine.playExplosion();
        }

        let nextStage = stage;
        let nextBossHp = bossHp;
        let nextBossMax = bossMaxHp;
        let eventType: 'hit' | 'boss_hit' | 'boss_ko' = 'hit';

        if (isBossWave) {
          const remainingHp = Math.max(0, bossHp - 1);
          if (remainingHp > 0) {
            nextBossHp = remainingHp;
            eventType = 'boss_hit';
          } else {
            eventType = 'boss_ko';
            nextStage = stage + 1;
            if (BOSS_STAGES.has(nextStage)) {
              nextBossMax = getBossMaxHp(nextStage);
              nextBossHp = nextBossMax;
            } else {
              nextBossMax = 0;
              nextBossHp = 0;
            }
          }
        } else {
          nextStage = stage + 1;
          if (BOSS_STAGES.has(nextStage)) {
            nextBossMax = getBossMaxHp(nextStage);
            nextBossHp = nextBossMax;
          }
        }

        setFxState((prev) => ({
          token: prev.token + 1,
          type: eventType,
          points: earned,
        }));

        advanceTimerRef.current = window.setTimeout(() => {
          advanceWaveOrQuestion(
            nextStage,
            nextBossHp,
            nextBossMax,
            updatedRecords,
            updatedScore,
            nextBest,
            hearts
          );
        }, eventType === 'boss_ko' ? 1150 : 780);
      } else {
        const updatedHearts = Math.max(0, hearts - 1);
        setStreak(0);
        setHearts(updatedHearts);
        setFeedback({
          status: 'wrong',
          chosenAnswer: answerVal,
          timeoutMiss: fromTimeout,
        });
        setShowHelper(true);
        soundEngine.playShieldHit();

        setFxState((prev) => ({
          token: prev.token + 1,
          type: 'miss',
          points: 0,
        }));
      }
    },
    [
      advanceWaveOrQuestion,
      approachProgress,
      bestStreak,
      bossHp,
      bossMaxHp,
      feedback.status,
      hearts,
      isBossWave,
      isPaused,
      question,
      records,
      score,
      stage,
      streak,
      usedHintOnCurrent,
    ]
  );

  // Smooth approach timer (17 seconds per wave; pauses when helper or pause is open)
  useEffect(() => {
    if (isPaused || showHelper || feedback.status !== 'none') return;

    const durationMs = question.type === 'comparison' || question.type === 'sequence' ? 19000 : 16500;
    const tickMs = 50;
    const step = tickMs / durationMs;

    const timer = window.setInterval(() => {
      setApproachProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          window.clearInterval(timer);
          return 1;
        }
        return next;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [feedback.status, isPaused, question.id, question.type, showHelper]);

  // Trigger timeout miss when approachProgress hits 1
  useEffect(() => {
    if (approachProgress >= 1 && feedback.status === 'none' && !isPaused && !showHelper) {
      handleFireAnswer(question.options[0], true);
    }
  }, [approachProgress, feedback.status, handleFireAnswer, isPaused, question.options, showHelper]);

  const handleContinueAfterWrong = useCallback(() => {
    if (feedback.status !== 'wrong') return;
    soundEngine.playClick();
    if (hearts <= 0) {
      onFinishRound(records, score, bestStreak);
      return;
    }

    let nextStage = stage;
    let nextBossHp = bossHp;
    let nextBossMax = bossMaxHp;

    if (!isBossWave) {
      nextStage = stage + 1;
      if (BOSS_STAGES.has(nextStage)) {
        nextBossMax = getBossMaxHp(nextStage);
        nextBossHp = nextBossMax;
      }
    }

    advanceWaveOrQuestion(
      nextStage,
      nextBossHp,
      nextBossMax,
      records,
      score,
      bestStreak,
      hearts
    );
  }, [
    advanceWaveOrQuestion,
    bestStreak,
    bossHp,
    bossMaxHp,
    feedback.status,
    hearts,
    isBossWave,
    onFinishRound,
    records,
    score,
    stage,
  ]);

  // Keyboard controls: 1-4 to fire, Up/Down to aim + Space/Enter to fire, Escape to pause
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

      if (feedback.status !== 'none') return;

      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1 && question.options[idx] !== undefined) {
        e.preventDefault();
        setSelectedAimIndex(idx);
        handleFireAnswer(question.options[idx]);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedAimIndex((prev) =>
          prev === null ? 0 : (prev - 1 + question.options.length) % question.options.length
        );
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedAimIndex((prev) =>
          prev === null ? 0 : (prev + 1) % question.options.length
        );
      } else if ((e.key === ' ' || e.key === 'Enter') && selectedAimIndex !== null) {
        const opt = question.options[selectedAimIndex];
        if (opt !== undefined) {
          e.preventDefault();
          handleFireAnswer(opt);
        }
      }

      if (question.type === 'comparison') {
        if (e.key === '<') handleFireAnswer('<');
        if (e.key === '=') handleFireAnswer('=');
        if (e.key === '>') handleFireAnswer('>');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    feedback.status,
    handleContinueAfterWrong,
    handleFireAnswer,
    isPaused,
    question,
    selectedAimIndex,
  ]);

  const handleRestart = () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    const firstQ = generateQuestion(trackId, 1, 'gamer');
    setStage(1);
    setBossHp(0);
    setBossMaxHp(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHearts(MAX_HEARTS);
    setQuestion(firstQ);
    setApproachProgress(0);
    setSelectedAimIndex(0);
    setFeedback({ status: 'none' });
    setShowHelper(false);
    setUsedHintOnCurrent(false);
    setRecords([]);
    setIsPaused(false);
    soundEngine.playTrainWhistle();
  };

  const comparisonLabel = (sign: ComparisonSign) =>
    sign === '<' ? 'Kisebb' : sign === '=' ? 'Egyenlő' : 'Nagyobb';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Arcade Cockpit HUD */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20">
        <div className="flex items-center gap-3 text-sm min-w-0">
          <span className="font-display font-bold text-white truncate">
            {track.title}
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-math font-semibold text-emerald-400 whitespace-nowrap">
            {stage} / {TOTAL_STAGES} szakasz
          </span>
          {isBossWave && (
            <>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-display font-bold text-amber-400 whitespace-nowrap">
                <ShieldAlert className="w-4 h-4" />
                <span>Boss ({bossHp}/{bossMaxHp} HP)</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-math font-bold text-white whitespace-nowrap">
              Pont: {score}
            </span>
            <span
              className={`inline-flex items-center gap-1 font-math font-bold whitespace-nowrap ${
                isTurbo ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {isTurbo ? <Zap className="w-4 h-4 fill-amber-400 text-amber-400" /> : <Flame className="w-4 h-4 text-amber-500" />}
              <span>{isTurbo ? `TURBÓ x2 (${streak})` : `Kombó: ${streak}`}</span>
            </span>

            <div
              className="flex items-center gap-1"
              aria-label={`${hearts} pajzs maradt a ${MAX_HEARTS}-ból`}
            >
              {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 ${
                    idx < hearts ? 'fill-red-500 text-red-500' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Hang bekapcsolása' : 'Hang kikapcsolása'}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Szünet</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Action Stage & Tactical Deck */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
        {/* 60fps HTML5 Canvas Arena */}
        <GamerArenaCanvas
          question={question}
          waveNumber={stage}
          isBossWave={isBossWave}
          bossHp={bossHp}
          bossMaxHp={bossMaxHp}
          isTurbo={isTurbo}
          isPaused={isPaused || showHelper}
          feedbackStatus={feedback.status}
          chosenAnswer={feedback.chosenAnswer}
          approachProgress={approachProgress}
          selectedAimIndex={selectedAimIndex}
          onTargetClick={(val) => handleFireAnswer(val)}
          lastEventToken={fxState.token}
          lastEventType={fxState.type}
          lastPointsEarned={fxState.points}
        />

        {/* Tactical Command Deck */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs sm:text-sm font-medium text-slate-400">
              {isBossWave
                ? 'Boss támadás! Lődd ki a helyes pajzsot a lézerrel!'
                : 'Kattints a céltáblára a pályán, vagy nyomd meg az 1–4 gombot!'}
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
                  ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>{showHelper ? 'Segítség bezárása' : 'Segítség (Szünetel)'}</span>
            </button>
          </div>

          {/* High-Contrast Math Prompt */}
          <div className="text-center py-1">
            {question.type === 'analogy' && question.analogySteps ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {question.analogySteps.map((stepStr, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-math text-base sm:text-lg font-bold text-slate-300"
                    >
                      {stepStr}
                    </div>
                  ))}
                </div>
                <div className="font-math text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {question.promptText}
                </div>
              </div>
            ) : question.type === 'sequence' && question.sequenceItems ? (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {question.sequenceItems.map((num, idx) => (
                  <React.Fragment key={idx}>
                    <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-math text-2xl sm:text-3xl font-extrabold text-white">
                      {num}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500" aria-hidden="true" />
                  </React.Fragment>
                ))}
                <div className="px-5 py-2.5 rounded-xl bg-emerald-950 border-2 border-emerald-500 font-math text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  ?
                </div>
              </div>
            ) : question.type === 'comparison' ? (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-math text-2xl sm:text-3xl font-extrabold text-white">
                  {question.comparisonLeft}
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-950 border-2 border-sky-400 flex items-center justify-center font-math text-2xl font-extrabold text-sky-200">
                  {feedback.status !== 'none' ? question.correctAnswer : '?'}
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-math text-2xl sm:text-3xl font-extrabold text-white">
                  {question.comparisonRight}
                </div>
              </div>
            ) : (
              <div className="font-math text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                {question.promptText}
              </div>
            )}
          </div>

          {/* Arcade Launch Buttons */}
          {question.type === 'comparison' ? (
            <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
              {(question.options as ComparisonSign[]).map((sign, idx) => {
                const isChosen = feedback.chosenAnswer === sign;
                const isCorrectOpt = sign === question.correctAnswer;

                let btnStyle =
                  'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-sky-400';

                if (feedback.status !== 'none') {
                  if (isCorrectOpt) {
                    btnStyle = 'bg-emerald-900/70 border-emerald-400 text-emerald-100';
                  } else if (isChosen && !isCorrectOpt) {
                    btnStyle = 'bg-red-900/70 border-red-400 text-red-100';
                  } else {
                    btnStyle = 'bg-slate-800/50 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={sign}
                    type="button"
                    disabled={feedback.status !== 'none'}
                    onMouseEnter={() => setSelectedAimIndex(idx)}
                    onClick={() => handleFireAnswer(sign)}
                    className={`relative min-h-[68px] rounded-xl border-2 px-4 py-2.5 transition-all active:scale-[0.97] flex flex-col items-center justify-center cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <span className="absolute top-2 left-2.5 text-[11px] font-sans font-semibold text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="font-math text-3xl font-extrabold leading-none">
                      {sign}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 mt-1">
                      {comparisonLabel(sign)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {question.options.map((opt, idx) => {
                const isChosen = feedback.chosenAnswer === opt;
                const isCorrectOpt = opt === question.correctAnswer;

                let btnStyle =
                  'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-sky-400';

                if (feedback.status !== 'none') {
                  if (isCorrectOpt) {
                    btnStyle = 'bg-emerald-900/70 border-emerald-400 text-emerald-100';
                  } else if (isChosen && !isCorrectOpt) {
                    btnStyle = 'bg-red-900/70 border-red-400 text-red-100';
                  } else {
                    btnStyle = 'bg-slate-800/50 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={String(opt)}
                    type="button"
                    disabled={feedback.status !== 'none'}
                    onMouseEnter={() => setSelectedAimIndex(idx)}
                    onClick={() => handleFireAnswer(opt)}
                    className={`relative min-h-[68px] rounded-xl border-2 px-4 py-3 font-math text-2xl sm:text-3xl font-extrabold transition-all active:scale-[0.97] flex items-center justify-center cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <span className="absolute top-2 left-2.5 text-[11px] font-sans font-semibold text-slate-400">
                      {idx + 1}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback Banner */}
          {feedback.status !== 'none' && (
            <div
              role="status"
              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                feedback.status === 'correct'
                  ? 'bg-emerald-950/70 border-emerald-600 text-emerald-100'
                  : 'bg-red-950/70 border-red-600 text-red-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.status === 'correct' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-display font-bold text-base">
                    {feedback.status === 'correct'
                      ? isTurbo
                        ? 'TURBÓ TALÁLAT! Dupla pontszám!'
                        : 'Telitalálat!'
                      : feedback.timeoutMiss
                        ? `Lejárt az idő! A helyes válasz: ${question.correctAnswer}`
                        : `Mellé! A helyes válasz: ${question.correctAnswer}`}
                  </div>
                  <p className="text-sm mt-0.5 opacity-90">{question.explanation}</p>
                </div>
              </div>

              {feedback.status === 'wrong' && (
                <button
                  type="button"
                  onClick={handleContinueAfterWrong}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-900 hover:bg-slate-200 text-sm font-bold shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>{hearts <= 0 ? 'Eredmény megtekintése' : 'Tovább'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Pedagogical PlaceValueHelper (light card for max legibility) */}
          {showHelper && (
            <div className="text-slate-900">
              <PlaceValueHelper
                question={question}
                revealAnswer={feedback.status !== 'none'}
              />
            </div>
          )}
        </section>
      </main>

      {/* Pause Modal */}
      {isPaused && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gamer-pause-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5 text-center">
            <div>
              <h2 id="gamer-pause-title" className="font-display text-2xl font-extrabold text-white">
                Játék szüneteltetve
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {track.title} · {score} pont
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Folytatás</span>
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Újrakezdés</span>
              </button>
              <button
                type="button"
                onClick={onExitToMenu}
                className="w-full py-3 px-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
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
