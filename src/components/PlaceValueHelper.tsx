import React from 'react';
import { MathQuestion } from '../types/game';

interface PlaceValueHelperProps {
  question: MathQuestion;
  revealAnswer: boolean;
}

export const PlaceValueHelper: React.FC<PlaceValueHelperProps> = ({
  question,
  revealAnswer,
}) => {
  const { a, b, operation, result, hintText, type } = question;
  const startHundreds = Math.floor(a / 100);
  const startTens = Math.floor((a % 100) / 10);

  const deltaHundreds = Math.floor(b / 100);
  const deltaTens = Math.floor((b % 100) / 10);

  if (type === 'comparison') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="border-b border-slate-200 pb-2.5">
          <h3 className="text-sm font-display font-bold text-slate-900">
            Számoló-segéd · Összehasonlítás
          </h3>
          <p className="text-sm text-slate-700 mt-0.5">{hintText}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs font-semibold text-slate-500">Bal oldal</div>
            <div className="font-math text-lg font-bold text-slate-900 mt-1">
              {question.comparisonLeft} ={' '}
              <span className="text-sky-700">
                {revealAnswer ? question.comparisonLeftVal : '?'}
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs font-semibold text-slate-500">Jobb oldal</div>
            <div className="font-math text-lg font-bold text-slate-900 mt-1">
              {question.comparisonRight} ={' '}
              <span className="text-sky-700">
                {revealAnswer ? question.comparisonRightVal : '?'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const leftVal = operation === '+' ? a : result;
  const rightVal = operation === '+' ? result : a;
  const rightLabel = revealAnswer
    ? `${rightVal}`
    : question.missingPart === 'result'
      ? '?'
      : `${result}`;
  const leftLabel =
    revealAnswer || question.missingPart === 'b' || operation === '+'
      ? `${leftVal}`
      : '?';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-display font-bold text-slate-900">
            Számoló-segéd
          </h3>
          <p className="text-sm text-slate-700 mt-0.5">{hintText}</p>
        </div>
        <div className="text-xs font-medium text-slate-600 shrink-0">
          <span className="inline-flex items-center gap-1.5 mr-3">
            <span className="inline-block w-3 h-3 rounded-xs bg-amber-400 border border-amber-700" />
            Százas = 100
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-3 rounded-xs bg-sky-400 border border-sky-700" />
            Tízes = 10
          </span>
        </div>
      </div>

      {/* Visual Number Line Jump */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
        <div className="text-xs font-semibold text-slate-500 mb-2">
          Ugrás a számegyenesen
        </div>
        <div className="relative flex items-center justify-between max-w-md mx-auto pt-6 pb-2">
          <svg
            viewBox="0 0 300 48"
            className="absolute left-6 right-6 top-0 h-10 w-[calc(100%-3rem)] overflow-visible pointer-events-none"
            aria-hidden="true"
          >
            <path
              d={
                operation === '+'
                  ? 'M 10 38 Q 150 -8 290 38'
                  : 'M 290 38 Q 150 -8 10 38'
              }
              fill="none"
              stroke={operation === '+' ? '#059669' : '#DC2626'}
              strokeWidth="2.5"
              strokeDasharray="5 4"
            />
            <polygon
              points={
                operation === '+'
                  ? '290,38 279,32 282,42'
                  : '10,38 21,32 18,42'
              }
              fill={operation === '+' ? '#059669' : '#DC2626'}
            />
          </svg>

          <div
            className={`absolute left-1/2 -translate-x-1/2 top-0 px-2 py-0.5 rounded text-xs font-math font-bold ${
              operation === '+'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {operation}{' '}
            {question.missingPart === 'b' && !revealAnswer ? '?' : b}
          </div>

          <div className="flex flex-col items-center z-10">
            <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-xs" />
            <span className="mt-1 font-math text-sm font-bold text-slate-900">
              {leftLabel}
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-300 -mt-5 mx-1" />

          <div className="flex flex-col items-center z-10">
            <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-xs" />
            <span className="mt-1 font-math text-sm font-bold text-slate-900">
              {rightLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Place value blocks breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Kiinduló szám: <span className="font-math text-slate-900">{a}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
            {Array.from({ length: startHundreds }).map((_, idx) => (
              <span
                key={`sh-${idx}`}
                className="inline-flex items-center justify-center w-8 h-7 rounded bg-amber-300 border border-amber-600 text-[11px] font-math font-bold text-amber-950"
              >
                100
              </span>
            ))}
            {Array.from({ length: startTens }).map((_, idx) => (
              <span
                key={`st-${idx}`}
                className="inline-flex items-center justify-center w-4 h-7 rounded-xs bg-sky-300 border border-sky-600 text-[10px] font-math font-bold text-sky-950"
                title="10"
              >
                10
              </span>
            ))}
            {startHundreds === 0 && startTens === 0 && (
              <span className="text-xs text-slate-400">0</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Változás:{' '}
            <span
              className={`font-math font-bold ${
                operation === '+' ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {operation}{' '}
              {question.missingPart === 'b' && !revealAnswer ? '?' : b}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
            {question.missingPart === 'b' && !revealAnswer ? (
              <span className="text-xs text-slate-500">
                Számold ki, mennyi hiányzik a célig!
              </span>
            ) : (
              <>
                {Array.from({ length: deltaHundreds }).map((_, idx) => (
                  <span
                    key={`dh-${idx}`}
                    className={`inline-flex items-center justify-center w-8 h-7 rounded border text-[11px] font-math font-bold ${
                      operation === '+'
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                        : 'bg-red-100 border-red-500 text-red-900 line-through'
                    }`}
                  >
                    100
                  </span>
                ))}
                {Array.from({ length: deltaTens }).map((_, idx) => (
                  <span
                    key={`dt-${idx}`}
                    className={`inline-flex items-center justify-center w-4 h-7 rounded-xs border text-[10px] font-math font-bold ${
                      operation === '+'
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                        : 'bg-red-100 border-red-500 text-red-900 line-through'
                    }`}
                  >
                    10
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
