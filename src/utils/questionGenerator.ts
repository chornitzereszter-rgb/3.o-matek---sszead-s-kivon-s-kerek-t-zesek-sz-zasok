import {
  ComparisonSign,
  GameMode,
  MathQuestion,
  TrackId,
} from '../types/game';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function makeOptions(
  correct: number,
  candidates: number[],
  step: 10 | 100 | 'mixed'
): number[] {
  const set = new Set<number>([correct]);

  for (const c of candidates) {
    if (c >= 0 && c <= 1000 && c !== correct && set.size < 4) {
      set.add(c);
    }
  }

  const offsets =
    step === 100
      ? [-100, 100, -200, 200, -10, 10]
      : step === 10
        ? [-10, 10, -20, 20, -100, 100]
        : [-10, 10, -100, 100, -20, 20, -30, 30];

  let safety = 0;
  while (set.size < 4 && safety < 50) {
    safety++;
    const delta = pick(offsets);
    const val = correct + delta;
    if (val >= 0 && val <= 1000) {
      set.add(val);
    }
  }

  return Array.from(set).sort((x, y) => x - y);
}

// 43. oldal: Analógia elve (4 + 3 -> 40 + 30 -> 400 + 300), helyiértékes összeadás/kivonás
function generatePage43Question(
  stationIndex: number,
  forceChoice: boolean
): MathQuestion {
  const isCargo = !forceChoice && (stationIndex === 3 || stationIndex === 7);

  if (isCargo) {
    const op: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
    const useHundreds = stationIndex === 7;
    if (useHundreds) {
      const aH = op === '+' ? randInt(1, 5) : randInt(5, 9);
      const bH = op === '+' ? randInt(1, 9 - aH) : randInt(1, aH - 1);
      const tens = randInt(0, 8) * 10;
      const start = aH * 100 + tens;
      const b = bH * 100;
      const target = op === '+' ? start + b : start - b;
      return {
        id: `q-${Date.now()}-${Math.random()}`,
        type: 'cargo',
        operation: op,
        a: start,
        b,
        result: target,
        missingPart: 'result',
        promptText:
          op === '+'
            ? `A vonaton ${start} van. Pakolj fel még ${b}-at!`
            : `A vonaton ${start} van. Pakolj le ${b}-at!`,
        correctAnswer: target,
        options: [],
        cargoStart: start,
        cargoTarget: target,
        hintText: `Egy nagy láda 100-at ér. ${bH} darab százas ládát mozgass!`,
        explanation: `${start} ${op} ${b} = ${target}`,
      };
    }

    const h = randInt(2, 7) * 100;
    const aT = op === '+' ? randInt(1, 5) : randInt(4, 9);
    const bT = op === '+' ? randInt(1, 9 - aT) : randInt(1, aT - 1);
    const start = h + aT * 10;
    const b = bT * 10;
    const target = op === '+' ? start + b : start - b;
    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'cargo',
      operation: op,
      a: start,
      b,
      result: target,
      missingPart: 'result',
      promptText:
        op === '+'
          ? `A vonaton ${start} van. Pakolj fel még ${b}-et!`
          : `A vonaton ${start} van. Pakolj le ${b}-et!`,
      correctAnswer: target,
      options: [],
      cargoStart: start,
      cargoTarget: target,
      hintText: `Egy kis láda 10-et ér. ${bT} darab tízes ládát mozgass!`,
      explanation: `${start} ${op} ${b} = ${target}`,
    };
  }

  // Analogy ladder tasks (43. oldal fő módszere)
  const useAnalogy = stationIndex <= 2 || Math.random() < 0.4;
  if (useAnalogy) {
    const op: '+' | '-' = Math.random() < 0.55 ? '+' : '-';
    let d1 = 0;
    let d2 = 0;
    let d3 = 0;

    if (op === '+') {
      d1 = randInt(1, 7);
      d2 = randInt(1, 9 - d1);
      d3 = d1 + d2;
    } else {
      d1 = randInt(4, 9);
      d2 = randInt(1, d1 - 1);
      d3 = d1 - d2;
    }

    const a = d1 * 100;
    const b = d2 * 100;
    const result = d3 * 100;

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'analogy',
      operation: op,
      a,
      b,
      result,
      missingPart: 'result',
      promptText: `${a} ${op} ${b} = ?`,
      analogySteps: [
        `${d1} ${op} ${d2} = ${d3}`,
        `${d1 * 10} ${op} ${d2 * 10} = ${d3 * 10}`,
      ],
      correctAnswer: result,
      options: makeOptions(
        result,
        [result + 100, result - 100, d3 * 10, op === '+' ? Math.abs(a - b) : a + b],
        100
      ),
      hintText: `Használd az analógiát: ha ${d1} ${op} ${d2} = ${d3}, akkor ${d1} százas ${op} ${d2} százas mennyi?`,
      explanation: `${a} ${op} ${b} = ${result} (mert ${d1} ${op} ${d2} = ${d3}).`,
    };
  }

  // Place-value composing / tens within hundred (e.g. 500 + 40, 780 - 50, 780 - 80, 420 + 300)
  const subType = pick(['hundred_plus_ten', 'three_digit_tens', 'three_digit_hundreds'] as const);
  const op: '+' | '-' = Math.random() < 0.55 ? '+' : '-';
  let a = 0;
  let b = 0;
  let result = 0;

  if (subType === 'hundred_plus_ten') {
    const h = randInt(1, 9) * 100;
    const t = randInt(1, 9) * 10;
    if (op === '+') {
      a = h;
      b = t;
      result = h + t;
    } else {
      a = h + t;
      b = t;
      result = h;
    }
  } else if (subType === 'three_digit_tens') {
    const h = randInt(1, 9) * 100;
    if (op === '+') {
      const aT = randInt(1, 6);
      const bT = randInt(1, 9 - aT);
      a = h + aT * 10;
      b = bT * 10;
      result = a + b;
    } else {
      const aT = randInt(3, 9);
      const bT = randInt(1, aT - 1);
      a = h + aT * 10;
      b = bT * 10;
      result = a - b;
    }
  } else {
    const t = randInt(1, 9) * 10;
    if (op === '+') {
      const aH = randInt(1, 6);
      const bH = randInt(1, 9 - aH);
      a = aH * 100 + t;
      b = bH * 100;
      result = a + b;
    } else {
      const aH = randInt(3, 9);
      const bH = randInt(1, aH - 1);
      a = aH * 100 + t;
      b = bH * 100;
      result = a - b;
    }
  }

  const wrongOp = op === '+' ? Math.abs(a - b) : a + b;
  const step = b >= 100 ? 100 : 10;

  return {
    id: `q-${Date.now()}-${Math.random()}`,
    type: 'choice',
    operation: op,
    a,
    b,
    result,
    missingPart: 'result',
    promptText: `${a} ${op} ${b} = ?`,
    correctAnswer: result,
    options: makeOptions(result, [result + step, result - step, wrongOp], step),
    hintText:
      b >= 100
        ? `A tízesek maradnak, csak a százasokkal számolj!`
        : `A százas marad, csak a tízesekkel számolj!`,
    explanation: `${a} ${op} ${b} = ${result}.`,
  };
}

// 44. oldal: Pótlás kerek százasra, kivonás kerek százasból, számsorozatok szabályai, láncszámolások
function generatePage44Question(
  stationIndex: number,
  forceChoice: boolean
): MathQuestion {
  const isCargo = !forceChoice && (stationIndex === 3 || stationIndex === 7);

  if (isCargo) {
    // Cargo puzzle aligned with 44. oldal: complement to next round hundred!
    const h = randInt(2, 7);
    const t = randInt(2, 8);
    const start = h * 100 + t * 10;
    const nextH = (h + 1) * 100;
    const diff = nextH - start;
    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'cargo',
      operation: '+',
      a: start,
      b: diff,
      result: nextH,
      missingPart: 'result',
      promptText: `Pótold a rakományt ${start}-ról a következő százasra (${nextH}-ra)!`,
      correctAnswer: nextH,
      options: [],
      cargoStart: start,
      cargoTarget: nextH,
      hintText: `Mennyi tízes láda kell még ${start}-hoz, hogy pont ${nextH} legyen?`,
      explanation: `${start} + ${diff} = ${nextH} (pótlás kerek százasra).`,
    };
  }

  const variant = pick(['complement_hundred', 'subtract_from_hundred', 'sequence', 'chain'] as const);

  if (variant === 'sequence') {
    const dir: 1 | -1 = Math.random() < 0.55 ? 1 : -1;
    const step = pick([20, 30, 40, 50, 100, 150]);
    const start =
      dir === 1
        ? randInt(10, 45) * 10
        : randInt(Math.max(40, Math.ceil((step * 3 + 50) / 10)), 95) * 10;
    const seq = [start, start + dir * step, start + dir * step * 2];
    const nextVal = start + dir * step * 3;
    const signStr = dir === 1 ? `+${step}` : `-${step}`;

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'sequence',
      operation: dir === 1 ? '+' : '-',
      a: seq[2],
      b: step,
      result: nextVal,
      missingPart: 'result',
      promptText: `${seq[0]}, ${seq[1]}, ${seq[2]}, ?`,
      sequenceItems: seq,
      correctAnswer: nextVal,
      options: makeOptions(
        nextVal,
        [nextVal + 10, nextVal - 10, nextVal + step, seq[2] + (dir === 1 ? 100 : -100)],
        'mixed'
      ),
      hintText: `Figyeld meg, mennyivel változik egyik számról a másikra! (${seq[0]} → ${seq[1]})`,
      explanation: `A sorozat szabálya ${signStr}, így a következő szám ${seq[2]} ${signStr === `+${step}` ? '+' : '-'} ${step} = ${nextVal}.`,
    };
  }

  if (variant === 'chain') {
    // 3-term chain like 300 + 200 - 100 or 540 + 200 - 40
    const useHundredsChain = Math.random() < 0.5;
    if (useHundredsChain) {
      const a = randInt(2, 5) * 100;
      const b = randInt(1, 4) * 100;
      const mid = a + b;
      const c = randInt(1, Math.floor((mid - 100) / 100)) * 100;
      const result = mid - c;
      return {
        id: `q-${Date.now()}-${Math.random()}`,
        type: 'choice',
        operation: '-',
        a: mid,
        b: c,
        result,
        missingPart: 'result',
        promptText: `${a} + ${b} - ${c} = ?`,
        correctAnswer: result,
        options: makeOptions(result, [result + 100, result - 100, mid + c], 100),
        hintText: `Számolj sorban balról jobbra! Először: ${a} + ${b} = ${mid}.`,
        explanation: `${a} + ${b} = ${mid}, majd ${mid} - ${c} = ${result}.`,
      };
    } else {
      const h = randInt(2, 6) * 100;
      const t = randInt(2, 6) * 10;
      const a = h + t;
      const b = randInt(1, 3) * 100;
      const mid = a + b;
      const c = randInt(1, 5) * 10;
      const result = mid - c;
      return {
        id: `q-${Date.now()}-${Math.random()}`,
        type: 'choice',
        operation: '-',
        a: mid,
        b: c,
        result,
        missingPart: 'result',
        promptText: `${a} + ${b} - ${c} = ?`,
        correctAnswer: result,
        options: makeOptions(result, [result + 10, result - 10, result + 100], 'mixed'),
        hintText: `Lépésről lépésre: először ${a} + ${b} = ${mid}, aztán vond ki belőle a ${c}-et!`,
        explanation: `${a} + ${b} = ${mid}, majd ${mid} - ${c} = ${result}.`,
      };
    }
  }

  if (variant === 'complement_hundred') {
    const h = randInt(1, 8);
    const t = randInt(1, 9);
    const a = h * 100 + t * 10;
    const targetH = (h + 1) * 100;
    const b = targetH - a;
    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'choice',
      operation: '+',
      a,
      b,
      result: targetH,
      missingPart: 'b',
      promptText: `${a} + ? = ${targetH}`,
      correctAnswer: b,
      options: makeOptions(b, [b + 10, b - 10, 100 - b, b + 100], 10),
      hintText: `Gondolj a 100-ra való pótlásra! Mennyi ${t * 10} + ? = 100?`,
      explanation: `${a} + ${b} = ${targetH}.`,
    };
  }

  // subtract_from_hundred: e.g. 700 - 40 = 660
  const aH = randInt(2, 9);
  const a = aH * 100;
  const b = randInt(1, 9) * 10;
  const result = a - b;
  return {
    id: `q-${Date.now()}-${Math.random()}`,
    type: 'choice',
    operation: '-',
    a,
    b,
    result,
    missingPart: 'result',
    promptText: `${a} - ${b} = ?`,
    correctAnswer: result,
    options: makeOptions(result, [result + 10, result - 10, result + 100, a - b / 10], 10),
    hintText: `Vegyél el egy százast (${a - 100}), és a maradék 100-ból vond ki a ${b}-et!`,
    explanation: `${a} - ${b} = ${result} (mert 100 - ${b} = ${100 - b}).`,
  };
}

// 45. oldal: Százasátlépéses tízesek, relációjelek (< = >), hiányzó tag, vegyes gyakorlás
function generatePage45Question(
  stationIndex: number,
  forceChoice: boolean
): MathQuestion {
  const isCargo = !forceChoice && (stationIndex === 3 || stationIndex === 7);

  if (isCargo) {
    const start = randInt(2, 6) * 100 + randInt(1, 8) * 10;
    const deltaH = randInt(1, 2) * 100;
    const deltaT = randInt(1, 4) * 10;
    const op: '+' | '-' = start + deltaH + deltaT <= 980 && Math.random() < 0.55 ? '+' : '-';
    const target = op === '+' ? start + deltaH + deltaT : start - deltaH - deltaT;
    const diff = Math.abs(target - start);
    const hNeed = Math.floor(diff / 100);
    const tNeed = (diff % 100) / 10;

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'cargo',
      operation: op,
      a: start,
      b: diff,
      result: target,
      missingPart: 'result',
      promptText: `A vonaton ${start} van. Állítsd be pontosan ${target}-ra!`,
      correctAnswer: target,
      options: [],
      cargoStart: start,
      cargoTarget: target,
      hintText:
        op === '+'
          ? `Adj hozzá ${hNeed} százast és ${tNeed} tízest!`
          : `Vegyél el ${hNeed} százast és ${tNeed} tízest!`,
      explanation: `${start} ${op} ${diff} = ${target}.`,
    };
  }

  const variant = pick(['comparison', 'crossing_tens', 'missing_b', 'sequence_hard'] as const);

  if (variant === 'comparison') {
    const leftOp: '+' | '-' = Math.random() < 0.55 ? '+' : '-';
    const rightOp: '+' | '-' = Math.random() < 0.55 ? '+' : '-';

    const la = randInt(2, 6) * 100 + randInt(1, 8) * 10;
    const lb = leftOp === '+' ? randInt(1, 3) * 100 : randInt(1, 2) * 100;
    const lVal = leftOp === '+' ? la + lb : la - lb;

    // Make equal roughly 30% of the time so '=' appears naturally!
    let ra = 0;
    let rb = 0;
    let rVal = 0;

    if (Math.random() < 0.32) {
      rVal = lVal;
      if (rightOp === '+') {
        rb = randInt(1, 9) * 10;
        ra = rVal - rb;
      } else {
        rb = randInt(1, 9) * 10;
        ra = rVal + rb;
      }
    } else {
      const offset = pick([-100, -50, -20, -10, 10, 20, 50, 100]);
      rVal = Math.max(100, Math.min(990, lVal + offset));
      if (rightOp === '+') {
        rb = randInt(1, 5) * 10;
        ra = rVal - rb;
      } else {
        rb = randInt(1, 5) * 10;
        ra = rVal + rb;
      }
    }

    const sign: ComparisonSign = lVal < rVal ? '<' : lVal > rVal ? '>' : '=';

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'comparison',
      operation: leftOp,
      a: lVal,
      b: Math.abs(lVal - rVal),
      result: rVal,
      missingPart: 'result',
      promptText: `${la} ${leftOp} ${lb}  ?  ${ra} ${rightOp} ${rb}`,
      comparisonLeft: `${la} ${leftOp} ${lb}`,
      comparisonRight: `${ra} ${rightOp} ${rb}`,
      comparisonLeftVal: lVal,
      comparisonRightVal: rVal,
      correctAnswer: sign,
      options: ['<', '=', '>'],
      hintText: `Számold ki először a bal oldalt (${la} ${leftOp} ${lb}), majd a jobb oldalt (${ra} ${rightOp} ${rb})!`,
      explanation: `${la} ${leftOp} ${lb} = ${lVal}, és ${ra} ${rightOp} ${rb} = ${rVal}, tehát ${lVal} ${sign} ${rVal}.`,
    };
  }

  if (variant === 'sequence_hard') {
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const step = pick([60, 70, 80, 120, 150]);
    const start =
      dir === 1
        ? randInt(10, 35) * 10
        : randInt(Math.ceil((step * 3 + 80) / 10), 96) * 10;
    const seq = [start, start + dir * step, start + dir * step * 2];
    const nextVal = start + dir * step * 3;
    const signStr = dir === 1 ? `+${step}` : `-${step}`;

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'sequence',
      operation: dir === 1 ? '+' : '-',
      a: seq[2],
      b: step,
      result: nextVal,
      missingPart: 'result',
      promptText: `${seq[0]}, ${seq[1]}, ${seq[2]}, ?`,
      sequenceItems: seq,
      correctAnswer: nextVal,
      options: makeOptions(nextVal, [nextVal + 10, nextVal - 10, nextVal + 100], 'mixed'),
      hintText: `Mennyi a különbség ${seq[0]} és ${seq[1]} között?`,
      explanation: `A szabály ${signStr}, így a következő elem ${nextVal}.`,
    };
  }

  if (variant === 'crossing_tens') {
    const op: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
    let a = 0;
    let b = 0;
    let result = 0;
    if (op === '+') {
      const h = randInt(1, 8);
      const t = randInt(4, 9);
      a = h * 100 + t * 10;
      const minBT = 10 - t + 1;
      b = randInt(Math.min(9, minBT), 9) * 10;
      if (a + b > 1000) a -= 100;
      result = a + b;
    } else {
      const h = randInt(2, 9);
      const t = randInt(1, 5);
      a = h * 100 + t * 10;
      b = randInt(t + 1, 9) * 10;
      result = a - b;
    }
    const boundary = op === '+' ? Math.ceil(a / 100) * 100 : Math.floor(a / 100) * 100;
    return {
      id: `q-${Date.now()}-${Math.random()}`,
      type: 'choice',
      operation: op,
      a,
      b,
      result,
      missingPart: 'result',
      promptText: `${a} ${op} ${b} = ?`,
      correctAnswer: result,
      options: makeOptions(result, [result + 10, result - 10, result + 100], 'mixed'),
      hintText: `Bontsd két lépésre a kerek százasnál (${boundary})!`,
      explanation: `${a} ${op} ${b} = ${result}.`,
    };
  }

  // missing_b
  const op: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
  let a = 0;
  let b = 0;
  let result = 0;
  if (op === '+') {
    a = randInt(15, 72) * 10;
    b = randInt(2, Math.min(9, Math.floor((990 - a) / 10))) * 10;
    result = a + b;
  } else {
    a = randInt(32, 95) * 10;
    b = randInt(3, 9) * 10;
    result = a - b;
  }

  return {
    id: `q-${Date.now()}-${Math.random()}`,
    type: 'choice',
    operation: op,
    a,
    b,
    result,
    missingPart: 'b',
    promptText: `${a} ${op} ? = ${result}`,
    correctAnswer: b,
    options: makeOptions(b, [b + 10, b - 10, b + 100], 'mixed'),
    hintText:
      op === '+'
        ? `Mennyit kell ${a}-hoz adni, hogy ${result} legyen?`
        : `Mennyit vettünk el ${a}-ból, ha ${result} maradt?`,
    explanation: `${a} ${op} ${b} = ${result}.`,
  };
}

export function generateQuestion(
  trackId: TrackId,
  stationIndex: number,
  mode: GameMode,
  previousPrompt?: string
): MathQuestion {
  const forceChoice = mode === 'villam' || mode === 'gamer';
  let q: MathQuestion;
  let attempts = 0;

  do {
    attempts++;
    if (trackId === 'tizesek') {
      q = generatePage43Question(stationIndex, forceChoice);
    } else if (trackId === 'szazasok') {
      q = generatePage44Question(stationIndex, forceChoice);
    } else {
      q = generatePage45Question(stationIndex, forceChoice);
    }
  } while (q.promptText === previousPrompt && attempts < 10);

  return q;
}
