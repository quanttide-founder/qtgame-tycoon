export type Weather = '晴' | '阴' | '小雨' | '暴雨';
export type GapKey = 'price' | 'crowd' | 'mix' | 'broth' | 'weekAvg' | 'waste';
export type Pricing = 'est' | 'locked';
/** 一天之内的阶段：押注中 → 已开奖，等玩家点「收摊」 */
export type DayPhase = 'bet' | 'result';

export interface GapDef {
  key: GapKey;
  label: string;
  src: '探店' | '盲测' | '自动';
  how: string;
}

export interface GapState {
  filled: boolean;
  val: string | null;
  day: number | null;
}

export interface StallRecord {
  day: number;
  act: '押注' | '探店' | '盲测';
  sold: number;
  bet: number;
  demand: number;
  leftover: number;
  shortage: number;
  rev: number;
  cost: number;
}

export interface LogEntry {
  day: number;
  text: string;
  cls: string;
}

export interface Forecast {
  v: number;
  u: number;
}

/** 开奖归因面板数据 */
export interface StallResult {
  amount: number;
  demand: number;
  sold: number;
  leftover: number;
  shortage: number;
  rev: number;
  cost: number;
  net: number;
  wasteRate: number;
  fine: number;
  fc: number;
}

export type LastResult =
  | ({ kind: 'stall'; day: number } & StallResult)
  | { kind: 'skip'; day: number; text: string }
  | { kind: 'probe' | 'blind'; day: number; text: string };

/** 纯游戏数据：可 structuredClone，不含任何函数 */
export interface GameData {
  day: number;
  cash: number;
  weather: Weather;
  pricing: Pricing;
  mix: [number, number, number];
  priceCut: boolean;
  quality: number;
  priceMultiplier: number;
  gaps: Record<GapKey, GapState>;
  records: StallRecord[];
  logs: LogEntry[];
  milestones: string[];
  wasteSum: number;
  wasteN: number;
  weekViolations: number;
  weekShortages: number;
  wechat: number;
  declines: number;
  loans: number;
  q: number[];
  guests: number;
  cum: { rev: number; cost: number; act: number; event: number };
  fc: (Forecast | null)[];
  errors: (number | null)[];
  paidWeeks: Record<number, boolean>;
  rivalDone: boolean;
  finished: boolean;
  lastResult: LastResult | null;
  stall: StallResult | null;
  phase: DayPhase;
  fcHistory: number[];
  betHistory: number[];
  demandHistory: number[];
  oldGuess: number;
}

export interface EventOption {
  label: string;
  sub: string;
  fn: (g: GameData) => void;
}

export type GameEvent =
  | { kind: 'auto'; mult: number; label: string; text: string; cls?: string; next?: number; wechat?: number }
  | { kind: 'choice'; label: string; text: string; options: EventOption[] };

export type ChoiceEvent = Extract<GameEvent, { kind: 'choice' }>;

/** 模态框：choice 事件的选项闭包只随 pending 引用传递，不参与克隆 */
export type Pending =
  | { kind: 'choice'; ev: ChoiceEvent; amount: number }
  | { kind: 'rival'; amount: number }
  | { kind: 'skip' }
  | { kind: 'skipEmpty' }
  | { kind: 'probe' }
  | { kind: 'probeBroke' }
  | { kind: 'blind' }
  | { kind: 'blindBroke' };

export type BlindScores = Record<string, Partial<Record<string, number>>>;

export type PagePhase = 'open' | 'main' | 'weekly' | 'ending' | 'recap';

export interface AppState {
  page: PagePhase;
  game: GameData;
  pending: Pending | null;
  /** 飘字：seq 用于强制重挂载，保证每次开奖动画重新播放 */
  float: { text: string; seq: number } | null;
  sheet: 'ledger' | 'gaps' | null;
}
