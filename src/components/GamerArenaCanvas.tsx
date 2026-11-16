import React, { useEffect, useRef } from 'react';
import { ComparisonSign, MathQuestion } from '../types/game';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

interface LaserShot {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  color: string;
}

interface TargetBox {
  index: number;
  value: number | ComparisonSign;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface GamerArenaCanvasProps {
  question: MathQuestion;
  waveNumber: number;
  isBossWave: boolean;
  bossHp: number;
  bossMaxHp: number;
  isTurbo: boolean;
  isPaused: boolean;
  feedbackStatus: 'none' | 'correct' | 'wrong';
  chosenAnswer?: number | ComparisonSign;
  approachProgress: number; // 0 (far right) -> 1 (collision)
  selectedAimIndex: number | null;
  onTargetClick: (val: number | ComparisonSign) => void;
  lastEventToken: number;
  lastEventType: 'none' | 'hit' | 'miss' | 'boss_hit' | 'boss_ko';
  lastPointsEarned: number;
}

export const GamerArenaCanvas: React.FC<GamerArenaCanvasProps> = ({
  question,
  waveNumber,
  isBossWave,
  bossHp,
  bossMaxHp,
  isTurbo,
  isPaused,
  feedbackStatus,
  chosenAnswer,
  approachProgress,
  selectedAimIndex,
  onTargetClick,
  lastEventToken,
  lastEventType,
  lastPointsEarned,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable animation state kept inside ref for smooth 60fps loop
  const stateRef = useRef({
    scroll: 0,
    wheelAngle: 0,
    shake: 0,
    turretRecoil: 0,
    particles: [] as Particle[],
    exhaust: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    lasers: [] as LaserShot[],
    targetBoxes: [] as TargetBox[],
    hoveredIndex: -1,
    time: 0,
  });

  // Latest props synced into ref for RAF loop
  const propsRef = useRef({
    question,
    waveNumber,
    isBossWave,
    bossHp,
    bossMaxHp,
    isTurbo,
    isPaused,
    feedbackStatus,
    chosenAnswer,
    approachProgress,
    selectedAimIndex,
  });

  propsRef.current = {
    question,
    waveNumber,
    isBossWave,
    bossHp,
    bossMaxHp,
    isTurbo,
    isPaused,
    feedbackStatus,
    chosenAnswer,
    approachProgress,
    selectedAimIndex,
  };

  // Trigger laser + particle explosion whenever lastEventToken increments
  useEffect(() => {
    if (lastEventToken === 0) return;

    const s = stateRef.current;
    const boxes = s.targetBoxes;
    const targetBox =
      boxes.find((b) => b.value === chosenAnswer) ??
      boxes[0] ?? {
        x: 520,
        y: 120,
        w: 96,
        h: 48,
      };

    const tx = targetBox.x + targetBox.w / 2;
    const ty = targetBox.y + targetBox.h / 2;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSuccess =
      lastEventType === 'hit' ||
      lastEventType === 'boss_hit' ||
      lastEventType === 'boss_ko';

    s.turretRecoil = 1;
    s.lasers.push({
      fromX: 168,
      fromY: 162,
      toX: tx,
      toY: ty,
      progress: 0,
      color: isSuccess ? (isTurbo ? '#FBBF24' : '#34D399') : '#F87171',
    });

    if (!prefersReducedMotion) {
      s.shake = isSuccess ? (lastEventType === 'boss_ko' ? 12 : 6) : 9;
      const count = lastEventType === 'boss_ko' ? 42 : isSuccess ? 26 : 16;
      const palette = isSuccess
        ? ['#34D399', '#FBBF24', '#38BDF8', '#FFFFFF']
        : ['#F87171', '#FB923C', '#94A3B8'];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 1.6 + Math.random() * 4.8;
        s.particles.push({
          x: tx,
          y: ty,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.5 + Math.random() * 4,
          color: palette[i % palette.length],
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
        });
      }
    }

    s.floatingTexts.push({
      x: tx,
      y: ty - 16,
      vy: -1.2,
      text:
        lastEventType === 'boss_ko'
          ? `BOSS LEGYŐZVE! +${lastPointsEarned}`
          : isSuccess
            ? isTurbo
              ? `TURBÓ! +${lastPointsEarned}`
              : `+${lastPointsEarned}`
            : 'PAJZS SÉRÜLT!',
      color: isSuccess ? (isTurbo ? '#FDE047' : '#6EE7B7') : '#FCA5A5',
      alpha: 1,
      scale: lastEventType === 'boss_ko' ? 1.25 : 1,
    });
  }, [lastEventToken, lastEventType, lastPointsEarned, chosenAnswer, isTurbo]);

  // Main 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 280;

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || 800;
      height = container.clientHeight || 280;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let rafId = 0;
    let lastTs = performance.now();

    const drawRoundedRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      const s = stateRef.current;
      const p = propsRef.current;

      if (!p.isPaused) {
        const speedMult = p.isTurbo ? 2.4 : 1;
        const moveFactor = prefersReducedMotion ? 0.2 : 1;
        s.time += dt;
        s.scroll += 180 * speedMult * moveFactor * dt;
        s.wheelAngle += 7.5 * speedMult * moveFactor * dt;
        s.turretRecoil = Math.max(0, s.turretRecoil - dt * 4);
        s.shake = Math.max(0, s.shake - dt * 28);

        // Spawn locomotive exhaust / turbo flames
        if (!prefersReducedMotion && Math.random() < (p.isTurbo ? 0.75 : 0.35)) {
          s.exhaust.push({
            x: p.isTurbo ? 58 : 162,
            y: p.isTurbo ? height - 66 : height - 118,
            vx: p.isTurbo ? -3.2 - Math.random() * 2 : -1.4 - Math.random(),
            vy: p.isTurbo ? (Math.random() - 0.5) * 1.4 : -1.2 - Math.random() * 0.8,
            radius: p.isTurbo ? 4 + Math.random() * 5 : 5 + Math.random() * 6,
            color: p.isTurbo
              ? Math.random() < 0.5
                ? '#F59E0B'
                : '#FDE047'
              : '#E2E8F0',
            alpha: 0.85,
            decay: p.isTurbo ? 0.045 : 0.022,
          });
        }
      }

      ctx.save();

      // Apply camera shake
      if (s.shake > 0.2) {
        const sx = (Math.random() - 0.5) * s.shake;
        const sy = (Math.random() - 0.5) * s.shake;
        ctx.translate(sx, sy);
      }

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (p.isTurbo) {
        skyGrad.addColorStop(0, '#0F172A');
        skyGrad.addColorStop(0.6, '#1E293B');
        skyGrad.addColorStop(1, '#312E81');
      } else {
        skyGrad.addColorStop(0, '#0B1324');
        skyGrad.addColorStop(0.65, '#172554');
        skyGrad.addColorStop(1, '#1E293B');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Distant Stars
      ctx.fillStyle = 'rgba(248, 250, 252, 0.55)';
      for (let i = 0; i < 24; i++) {
        const starX = ((i * 97 - s.scroll * 0.06) % width + width) % width;
        const starY = 16 + ((i * 43) % (height * 0.5));
        const r = i % 3 === 0 ? 1.8 : 1.1;
        ctx.beginPath();
        ctx.arc(starX, starY, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Parallax Mountains
      const drawMountains = (
        factor: number,
        baseY: number,
        peakH: number,
        color: string
      ) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, height);
        const span = 180;
        const offset = (s.scroll * factor) % span;
        for (let x = -span; x <= width + span; x += span) {
          ctx.lineTo(x - offset, baseY);
          ctx.lineTo(x + span * 0.5 - offset, baseY - peakH);
        }
        ctx.lineTo(width + span, height);
        ctx.closePath();
        ctx.fill();
      };

      drawMountains(0.18, height - 56, 68, '#1E293B');
      drawMountains(0.35, height - 42, 42, '#0F172A');

      // 4. Turbo Speed Lines
      if (p.isTurbo && !prefersReducedMotion) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const lx = ((i * 173 - s.scroll * 2.2) % (width + 120) + width + 120) % (width + 120) - 60;
          const ly = 24 + ((i * 37) % (height - 90));
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + 46, ly);
          ctx.stroke();
        }
      }

      // 5. Railway Track Bed & Scrolling Sleepers
      const trackY = height - 36;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, trackY, width, 36);

      const sleeperSpacing = 38;
      const sleeperOffset = s.scroll % sleeperSpacing;
      ctx.fillStyle = '#78350F';
      for (let x = -sleeperSpacing; x < width + sleeperSpacing; x += sleeperSpacing) {
        ctx.fillRect(x - sleeperOffset, trackY + 6, 18, 10);
      }

      // Steel Rail
      ctx.fillStyle = p.isTurbo ? '#FBBF24' : '#94A3B8';
      ctx.fillRect(0, trackY + 4, width, 4);

      // 6. Exhaust Particles
      for (let i = s.exhaust.length - 1; i >= 0; i--) {
        const pt = s.exhaust[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          s.exhaust.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 7. Hero Turbo Locomotive (Left Side)
      const bob = prefersReducedMotion ? 0 : Math.sin(s.time * (p.isTurbo ? 14 : 7)) * 2;
      const locoX = 48;
      const locoY = trackY - 76 + bob;

      // Headlight Beam
      const beamGrad = ctx.createLinearGradient(locoX + 132, locoY + 34, locoX + 340, locoY + 34);
      beamGrad.addColorStop(0, p.isTurbo ? 'rgba(253, 224, 71, 0.36)' : 'rgba(186, 230, 253, 0.25)');
      beamGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(locoX + 132, locoY + 30);
      ctx.lineTo(locoX + 350, locoY - 8);
      ctx.lineTo(locoX + 350, locoY + 72);
      ctx.lineTo(locoX + 132, locoY + 42);
      ctx.closePath();
      ctx.fill();

      // Locomotive Cab
      ctx.fillStyle = p.isTurbo ? '#D97706' : '#059669';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      drawRoundedRect(locoX + 8, locoY + 8, 52, 54, 6);
      ctx.fill();
      ctx.stroke();

      // Cab Roof
      ctx.fillStyle = '#1E293B';
      drawRoundedRect(locoX + 2, locoY + 2, 62, 10, 4);
      ctx.fill();

      // Cab Window
      ctx.fillStyle = '#BAE6FD';
      drawRoundedRect(locoX + 18, locoY + 18, 32, 20, 4);
      ctx.fill();

      // Boiler
      ctx.fillStyle = p.isTurbo ? '#F59E0B' : '#10B981';
      drawRoundedRect(locoX + 58, locoY + 24, 68, 36, 7);
      ctx.fill();
      ctx.stroke();

      // Brass Bands
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(locoX + 76, locoY + 24, 5, 36);
      ctx.fillRect(locoX + 100, locoY + 24, 5, 36);

      // Chimney
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(locoX + 106, locoY + 2, 14, 22);
      ctx.fillStyle = '#F59E0B';
      drawRoundedRect(locoX + 102, locoY - 2, 22, 6, 3);
      ctx.fill();

      // Roof Laser Turret
      const turretX = locoX + 94 - s.turretRecoil * 5;
      const turretY = locoY + 16;
      ctx.fillStyle = '#38BDF8';
      drawRoundedRect(turretX - 8, turretY - 6, 26, 12, 4);
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(turretX + 14, turretY - 3, 12, 6);

      // Cowcatcher
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(locoX + 126, locoY + 46);
      ctx.lineTo(locoX + 144, locoY + 68);
      ctx.lineTo(locoX + 126, locoY + 68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Chassis
      ctx.fillStyle = '#DC2626';
      drawRoundedRect(locoX + 4, locoY + 58, 126, 10, 3);
      ctx.fill();

      // Spinning Wheels
      [locoX + 26, locoX + 56, locoX + 94, locoX + 118].forEach((wx, idx) => {
        const wr = idx < 2 ? 12 : 9;
        const wy = trackY + 4 - wr;
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(s.wheelAngle);
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(0, 0, wr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = idx < 2 ? '#EF4444' : '#38BDF8';
        ctx.beginPath();
        ctx.arc(0, 0, wr * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-wr * 0.6, 0);
        ctx.lineTo(wr * 0.6, 0);
        ctx.moveTo(0, -wr * 0.6);
        ctx.lineTo(0, wr * 0.6);
        ctx.stroke();
        ctx.restore();
      });

      // 8. Boss Mech on Far Right during Boss Waves
      if (p.isBossWave) {
        const bossX = width - 115;
        const bossY = height * 0.44 + (prefersReducedMotion ? 0 : Math.sin(s.time * 3.5) * 6);

        // Boss Mechanical Core
        ctx.save();
        ctx.translate(bossX, bossY);

        // Outer Armor Ring
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        drawRoundedRect(-44, -46, 88, 92, 16);
        ctx.fill();
        ctx.stroke();

        // Glowing Visor Eyes
        ctx.fillStyle = '#EF4444';
        drawRoundedRect(-28, -22, 20, 12, 4);
        ctx.fill();
        drawRoundedRect(8, -22, 20, 12, 4);
        ctx.fill();

        // Grill Mouth
        ctx.fillStyle = '#0F172A';
        drawRoundedRect(-24, 6, 48, 22, 4);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        for (let gx = -12; gx <= 12; gx += 12) {
          ctx.beginPath();
          ctx.moveTo(gx, 8);
          ctx.lineTo(gx, 26);
          ctx.stroke();
        }

        // Boss Label & HP Bar above Boss
        ctx.fillStyle = '#FDE047';
        ctx.font = '700 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ACÉL-GÓLEM BOSS', 0, -64);

        const hpW = 86;
        ctx.fillStyle = '#0F172A';
        drawRoundedRect(-hpW / 2, -58, hpW, 8, 4);
        ctx.fill();

        const hpRatio = Math.max(0, Math.min(1, p.bossHp / Math.max(1, p.bossMaxHp)));
        ctx.fillStyle = '#EF4444';
        drawRoundedRect(-hpW / 2, -58, hpW * hpRatio, 8, 4);
        ctx.fill();

        ctx.restore();
      }

      // 9. Incoming Answer Gates / Targets
      const opts = p.question.options;
      const numOpts = opts.length;
      const startX = p.isBossWave ? width - 250 : width - 165;
      const endX = locoX + 168;
      const currentTargetX = startX - (startX - endX) * Math.min(1, Math.max(0, p.approachProgress));

      const topPad = 24;
      const bottomPad = 56;
      const availH = height - topPad - bottomPad;
      const laneH = availH / Math.max(1, numOpts);

      const newBoxes: TargetBox[] = [];

      opts.forEach((opt, idx) => {
        const boxW = numOpts === 3 ? 102 : 110;
        const boxH = Math.min(46, Math.max(36, laneH - 10));
        const floatY = prefersReducedMotion ? 0 : Math.sin(s.time * 3 + idx * 1.4) * 3;
        const bx = currentTargetX - boxW / 2;
        const by = topPad + idx * laneH + (laneH - boxH) / 2 + floatY;

        newBoxes.push({ index: idx, value: opt, x: bx, y: by, w: boxW, h: boxH });

        const isCorrect = opt === p.question.correctAnswer;
        const isChosen = opt === p.chosenAnswer;
        const isHovered = s.hoveredIndex === idx || p.selectedAimIndex === idx;

        let bg = '#1E293B';
        let border = isHovered ? '#38BDF8' : '#475569';
        let textCol = '#F8FAFC';

        if (p.feedbackStatus !== 'none') {
          if (isCorrect) {
            bg = '#065F46';
            border = '#34D399';
            textCol = '#ECFDF5';
          } else if (isChosen && !isCorrect) {
            bg = '#7F1D1D';
            border = '#F87171';
            textCol = '#FEF2F2';
          } else {
            bg = '#0F172A';
            border = '#334155';
            textCol = '#64748B';
          }
        }

        // Targeting aim line if hovered/selected
        if (isHovered && p.feedbackStatus === 'none') {
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(locoX + 114, locoY + 16);
          ctx.lineTo(bx, by + boxH / 2);
          ctx.stroke();
          ctx.restore();
        }

        // Capsule Box
        ctx.fillStyle = bg;
        ctx.strokeStyle = border;
        ctx.lineWidth = isHovered ? 3 : 2;
        drawRoundedRect(bx, by, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        // Keycap number badge (1..4)
        ctx.fillStyle = '#0F172A';
        drawRoundedRect(bx + 6, by + 6, 18, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#94A3B8';
        ctx.font = '700 11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), bx + 15, by + 15.5);

        // Answer Value Text
        ctx.fillStyle = textCol;
        ctx.font = '800 20px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(opt), bx + boxW / 2 + 6, by + boxH / 2 + 1);
      });

      s.targetBoxes = newBoxes;

      // 10. Active Laser Shots
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        l.progress += dt * 7.5;
        if (l.progress >= 1.25) {
          s.lasers.splice(i, 1);
          continue;
        }
        const headT = Math.min(1, l.progress);
        const tailT = Math.max(0, l.progress - 0.35);
        const x1 = l.fromX + (l.toX - l.fromX) * tailT;
        const y1 = l.fromY + (l.toY - l.fromY) * tailT;
        const x2 = l.fromX + (l.toX - l.fromX) * headT;
        const y2 = l.fromY + (l.toY - l.fromY) * headT;

        ctx.strokeStyle = l.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 11. Explosion Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.08; // light gravity
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 12. Floating Combat/Score Texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= dt * 1.1;
        if (ft.alpha <= 0) {
          s.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = `800 ${Math.round(16 * ft.scale)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const findTargetAtPointer = (clientX: number, clientY: number): TargetBox | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (const box of stateRef.current.targetBoxes) {
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        return box;
      }
    }
    return null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (feedbackStatus !== 'none' || isPaused) {
      stateRef.current.hoveredIndex = -1;
      return;
    }
    const hit = findTargetAtPointer(e.clientX, e.clientY);
    stateRef.current.hoveredIndex = hit ? hit.index : -1;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (feedbackStatus !== 'none' || isPaused) return;
    const hit = findTargetAtPointer(e.clientX, e.clientY);
    if (hit) {
      onTargetClick(hit.value);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          stateRef.current.hoveredIndex = -1;
        }}
        onPointerDown={handlePointerDown}
        className="w-full h-full block"
      />

      {/* Danger / Approach Progress Bar at Bottom Edge */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-slate-800/90 pointer-events-none">
        <div
          className={`h-full transition-colors ${
            approachProgress > 0.72
              ? 'bg-red-500'
              : isTurbo
                ? 'bg-amber-400'
                : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, (1 - approachProgress) * 100))}%` }}
        />
      </div>
    </div>
  );
};
