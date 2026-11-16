export type TrackId = 'tizesek' | 'szazasok' | 'expressz';

export type GameMode = 'gamer' | 'kaland' | 'villam';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY';

export type StationChallengeType =
  | 'choice'
  | 'cargo'
  | 'analogy'
  | 'sequence'
  | 'comparison';

export type ComparisonSign = '<' | '=' | '>';

export interface MathQuestion {
  id: string;
  type: StationChallengeType;
  operation: '+' | '-';
  a: number;
  b: number;
  result: number;
  missingPart: 'result' | 'b';
  promptText: string;
  correctAnswer: number | ComparisonSign;
  options: (number | ComparisonSign)[];
  analogySteps?: string[];
  sequenceItems?: number[];
  comparisonLeft?: string;
  comparisonRight?: string;
  comparisonLeftVal?: number;
  comparisonRightVal?: number;
  cargoStart?: number;
  cargoTarget?: number;
  hintText: string;
  explanation: string;
}

export interface AnsweredRecord {
  question: MathQuestion;
  userAnswer: number | ComparisonSign;
  isCorrect: boolean;
  usedHint: boolean;
}

export interface TrackProgress {
  bestScore: number;
  stars: number;
  gamesPlayed: number;
}

export type ProgressMap = Record<TrackId, TrackProgress>;

export interface TrackConfig {
  id: TrackId;
  pageTag: string;
  title: string;
  subtitle: string;
  description: string;
  difficultyLabel: string;
  examples: string;
  stationNames: string[];
}

export const TRACK_CONFIGS: TrackConfig[] = [
  {
    id: 'tizesek',
    pageTag: '43. oldal',
    title: 'Analógiák Völgye',
    subtitle: 'Kerek százasok, tízesek és analógiák',
    description:
      'Összeadás és kivonás kerek százasokkal és tízesekkel az analógia elve alapján.',
    difficultyLabel: 'Könnyű',
    examples: '4+3 → 40+30 → 400+300 · 780 - 50',
    stationNames: [
      'Analógia-kapu',
      'Kerek-erdő',
      'Tízes-patak',
      'Százas-tisztás',
      'Helyiérték-domb',
      'Mókus-megálló',
      'Aranykalász',
      'Rakodó-tér',
      'Völgy-állomás',
      'Főpályaudvar',
    ],
  },
  {
    id: 'szazasok',
    pageTag: '44. oldal',
    title: 'Pótlások Hídja',
    subtitle: 'Pótlás százasra, láncszámolás, sorozatok',
    description:
      'Pótlás kerek százasra, szabályfelismerés számsorozatokban és többtagú láncszámolások.',
    difficultyLabel: 'Közepes',
    examples: '240 + ? = 300 · 700 - 40 · 120, 150, 180',
    stationNames: [
      'Szomszéd-híd',
      'Pótló-part',
      'Sorozat-torony',
      'Szabály-lejtő',
      'Lánc-alagút',
      'Fenyves-kanyar',
      'Öreg-tölgy',
      'Kerekítő-bánya',
      'Hídfő-állomás',
      'Király-vár',
    ],
  },
  {
    id: 'expressz',
    pageTag: '45. oldal',
    title: 'Nagy Expressz',
    subtitle: 'Vegyes gyakorlás és relációjelek',
    description:
      'Tízesátlépés, összehasonlítás (< = >), hiányzó tagok és összetett rakodás.',
    difficultyLabel: 'Haladó',
    examples: '380 + 50 · 400+200 ? 700-50 · 820 - ? = 760',
    stationNames: [
      'Induló-vágány',
      'Mérleg-szakasz',
      'Reláció-elágazás',
      'Magas-viadukt',
      'Sziporka-alagút',
      'Tópart-sétány',
      'Szikla-szoros',
      'Hegyi-hágó',
      'Csúcs-állomás',
      'Arany-végállomás',
    ],
  },
];

export const TOTAL_KALAND_STATIONS = 10;
export const TOTAL_GAMER_WAVES = 12;
export const VILLAM_DURATION_SECONDS = 60;
export const MAX_HEARTS = 3;
