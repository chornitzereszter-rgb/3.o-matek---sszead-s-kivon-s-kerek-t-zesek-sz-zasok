import React, { useState } from 'react';
import { MathQuestion } from '../types/game';

interface TrainStageProps {
  stationNumber: number;
  stationName: string;
  question: MathQuestion;
  currentCargo: number;
  trainPhase: 'entering' | 'idle' | 'departing';
  feedbackState: 'none' | 'correct' | 'wrong';
}

export const TrainStage: React.FC<TrainStageProps> = ({
  stationNumber,
  stationName,
  question,
  currentCargo,
  trainPhase,
  feedbackState,
}) => {
  const [bgError, setBgError] = useState(false);

  const isMoving = trainPhase === 'entering' || trainPhase === 'departing';

  const translateClass =
    trainPhase === 'entering'
      ? '-translate-x-28 opacity-85'
      : trainPhase === 'departing'
        ? 'translate-x-48 opacity-90'
        : 'translate-x-0 opacity-100';

  // Visual crate breakdown for cargo wagon
  const displayValue =
    question.type === 'cargo' ? currentCargo : question.a;
  const hundredsCrates = Math.min(9, Math.max(0, Math.floor(displayValue / 100)));
  const tensCrates = Math.min(9, Math.max(0, Math.floor((displayValue % 100) / 10)));

  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-2xl overflow-hidden border border-slate-200 bg-sky-100 shadow-sm select-none">
      {/* Scenic 2D Railway Backdrop */}
      {!bgError ? (
        <img
          src="/src/assets/images/station_valley_bg_1794828226102.jpg"
          alt="Napos vasúti völgy háttér"
          referrerPolicy="no-referrer"
          onError={() => setBgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-bottom"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-200" />
      )}

      {/* Subtle atmospheric top gradient for crisp signpost legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-900/20 to-transparent pointer-events-none"
      />

      {/* Station Signpost */}
      <div className="absolute top-3 left-4 sm:top-4 sm:left-5 flex items-center gap-3 z-10">
        <div className="bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg px-3.5 py-2 shadow-sm">
          <div className="text-xs font-medium text-slate-500 leading-none mb-1">
            {stationNumber}. állomás
          </div>
          <div className="text-sm sm:text-base font-display font-bold text-slate-900 leading-tight">
            {stationName}
          </div>
        </div>
      </div>

      {/* Signal Lamp on right side */}
      <div className="absolute top-3 right-4 sm:top-4 sm:right-5 z-10 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm">
        <span
          className={`inline-block w-3 h-3 rounded-full border border-white/40 ${
            feedbackState === 'correct'
              ? 'bg-emerald-400'
              : feedbackState === 'wrong'
                ? 'bg-red-400'
                : 'bg-amber-400'
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
          {feedbackState === 'correct'
            ? 'Szabad az út'
            : feedbackState === 'wrong'
              ? 'Váltóhiba'
              : 'Állj a jelzőnél'}
        </span>
      </div>

      {/* Animated SVG Locomotive + Cargo Wagon */}
      <div
        className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[310px] sm:w-[410px] md:w-[460px] transition-all duration-500 ease-out z-10 ${translateClass}`}
      >
        <div className={isMoving ? 'animate-train-bob' : ''}>
          <svg
            viewBox="0 0 460 150"
            className="w-full h-auto drop-shadow-md"
            role="img"
            aria-label={`Számvonat mozdony és teherkocsi ${displayValue} értékkel`}
          >
            {/* Steam Puffs */}
            <g fill="#FFFFFF" opacity="0.9">
              <circle
                cx="374"
                cy="24"
                r="10"
                className="animate-steam-1"
              />
              <circle
                cx="364"
                cy="18"
                r="13"
                className="animate-steam-2"
              />
            </g>

            {/* Coupling bar between wagon and locomotive */}
            <rect x="208" y="108" width="24" height="7" rx="2" fill="#334155" />

            {/* === CARGO WAGON (LEFT) === */}
            <g transform="translate(16, 40)">
              {/* Cargo Crates Stacked inside Wagon */}
              <g>
                {/* Hundreds Crates (Amber) */}
                {Array.from({ length: Math.min(hundredsCrates, 6) }).map((_, i) => {
                  const col = i % 3;
                  const row = Math.floor(i / 3);
                  const x = 14 + col * 36;
                  const y = 34 - row * 22;
                  return (
                    <g key={`h-${i}`} className="animate-crate-pop">
                      <rect
                        x={x}
                        y={y}
                        width="32"
                        height="20"
                        rx="3"
                        fill="#F59E0B"
                        stroke="#92400E"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 16}
                        y={y + 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="800"
                        fill="#451A03"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        100
                      </text>
                    </g>
                  );
                })}
                {hundredsCrates > 6 && (
                  <text
                    x="68"
                    y="10"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#92400E"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    +{hundredsCrates - 6}×100
                  </text>
                )}

                {/* Tens Crates (Cerulean Blue) */}
                {Array.from({ length: Math.min(tensCrates, 6) }).map((_, i) => {
                  const col = i % 2;
                  const row = Math.floor(i / 2);
                  const x = 128 + col * 26;
                  const y = 37 - row * 17;
                  return (
                    <g key={`t-${i}`} className="animate-crate-pop">
                      <rect
                        x={x}
                        y={y}
                        width="23"
                        height="15"
                        rx="3"
                        fill="#38BDF8"
                        stroke="#075985"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 11.5}
                        y={y + 11}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="800"
                        fill="#0C4A6E"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        10
                      </text>
                    </g>
                  );
                })}
                {tensCrates > 6 && (
                  <text
                    x="154"
                    y="8"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#075985"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    +{tensCrates - 6}×10
                  </text>
                )}
              </g>

              {/* Wagon Wooden Body */}
              <rect
                x="4"
                y="54"
                width="190"
                height="34"
                rx="4"
                fill="#B45309"
                stroke="#451A03"
                strokeWidth="2.5"
              />
              {/* Wood plank lines */}
              <line x1="6" y1="65" x2="192" y2="65" stroke="#78350F" strokeWidth="1.5" />
              <line x1="6" y1="76" x2="192" y2="76" stroke="#78350F" strokeWidth="1.5" />

              {/* Wagon Weight Signboard */}
              <rect
                x="66"
                y="58"
                width="66"
                height="24"
                rx="4"
                fill="#FEF3C7"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              <text
                x="99"
                y="75"
                textAnchor="middle"
                fontSize="14"
                fontWeight="800"
                fill="#0F172A"
                fontFamily="JetBrains Mono, monospace"
              >
                {displayValue}
              </text>

              {/* Wagon Chassis */}
              <rect x="0" y="86" width="198" height="8" rx="3" fill="#1E293B" />

              {/* Wagon Wheels */}
              {[38, 160].map((cx) => (
                <g key={cx} className={isMoving ? 'animate-wheel-spin' : ''}>
                  <circle cx={cx} cy="99" r="12" fill="#334155" stroke="#0F172A" strokeWidth="2.5" />
                  <circle cx={cx} cy="99" r="5" fill="#CBD5E1" />
                  <line x1={cx - 8} y1="99" x2={cx + 8} y2="99" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={cx} y1="91" x2={cx} y2="107" stroke="#94A3B8" strokeWidth="1.5" />
                </g>
              ))}
            </g>

            {/* === LOCOMOTIVE (RIGHT) === */}
            <g transform="translate(226, 22)">
              {/* Chimney */}
              <path
                d="M142 18 L156 18 L153 46 L145 46 Z"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="2.5"
              />
              <rect
                x="138"
                y="12"
                width="22"
                height="7"
                rx="3"
                fill="#D97706"
                stroke="#78350F"
                strokeWidth="2"
              />

              {/* Steam Dome (Brass) */}
              <path
                d="M106 44 C106 31, 126 31, 126 44 Z"
                fill="#F59E0B"
                stroke="#78350F"
                strokeWidth="2"
              />

              {/* Cab */}
              <rect
                x="10"
                y="24"
                width="74"
                height="76"
                rx="5"
                fill="#047857"
                stroke="#064E3B"
                strokeWidth="2.5"
              />
              {/* Cab Roof */}
              <path
                d="M4 24 L90 24 L84 15 L10 15 Z"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="2.5"
              />
              {/* Cab Window */}
              <rect
                x="24"
                y="34"
                width="46"
                height="26"
                rx="4"
                fill="#BAE6FD"
                stroke="#064E3B"
                strokeWidth="2"
              />
              {/* Cheerful Driver Silhouette inside Window */}
              <circle cx="47" cy="49" r="7" fill="#FDBA74" />
              <path d="M39 44 Q47 38 55 44 Z" fill="#1E3A8A" />

              {/* Boiler */}
              <rect
                x="84"
                y="44"
                width="96"
                height="50"
                rx="8"
                fill="#059669"
                stroke="#064E3B"
                strokeWidth="2.5"
              />
              {/* Brass Boiler Bands */}
              <rect x="104" y="44" width="5" height="50" fill="#F59E0B" />
              <rect x="134" y="44" width="5" height="50" fill="#F59E0B" />

              {/* Front Smokebox */}
              <rect
                x="164"
                y="44"
                width="20"
                height="50"
                rx="4"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="2.5"
              />

              {/* Headlight */}
              <rect
                x="182"
                y="54"
                width="9"
                height="14"
                rx="2"
                fill="#FDE047"
                stroke="#CA8A04"
                strokeWidth="2"
              />

              {/* Cowcatcher */}
              <polygon
                points="184,96 206,112 184,112"
                fill="#DC2626"
                stroke="#7F1D1D"
                strokeWidth="2"
              />

              {/* Chassis Frame */}
              <rect
                x="6"
                y="94"
                width="184"
                height="12"
                rx="3"
                fill="#DC2626"
                stroke="#7F1D1D"
                strokeWidth="2"
              />

              {/* Large Driving Wheels */}
              {[36, 76].map((cx) => (
                <g key={cx} className={isMoving ? 'animate-wheel-spin' : ''}>
                  <circle cx={cx} cy="112" r="16" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
                  <circle cx={cx} cy="112" r="11" fill="#DC2626" />
                  <circle cx={cx} cy="112" r="4.5" fill="#F59E0B" />
                  <line x1={cx - 10} y1="112" x2={cx + 10} y2="112" stroke="#FEF3C7" strokeWidth="1.5" />
                  <line x1={cx} y1="102" x2={cx} y2="122" stroke="#FEF3C7" strokeWidth="1.5" />
                </g>
              ))}

              {/* Front Smaller Wheels */}
              {[126, 162].map((cx) => (
                <g key={cx} className={isMoving ? 'animate-wheel-spin' : ''}>
                  <circle cx={cx} cy="116" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
                  <circle cx={cx} cy="116" r="7" fill="#DC2626" />
                  <circle cx={cx} cy="116" r="3" fill="#F59E0B" />
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
