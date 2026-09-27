import { L } from './constants';
import {
  advanceDay, applyBlind, applyProbe, canBet, createGame, log, mark,
  oldMasterEstimate, probeOptions, resolveBet, skipOptions, settleWeek,
} from './engine';
import { rollEvent } from './events';
import type { AppState, BlindScores, GameData, GapKey } from './types';

export type Action =
  | { type: 'START' }
  | { type: 'BET'; amount: number }
  | { type: 'CHOOSE'; index: number }
  | { type: 'RIVAL'; index: number }
  | { type: 'SKIP' }
  | { type: 'SKIP_PICK'; key: 'probe' | 'blind' }
  | { type: 'PROBE'; key: GapKey }
  | { type: 'BLIND_SUBMIT'; scores: BlindScores }
  | { type: 'CLOSE_MODAL' }
  | { type: 'NEXT_DAY' }
  | { type: 'WEEK_NEXT' }
  | { type: 'RECAP' }
  | { type: 'SET_PRICE'; mult: number }
  | { type: 'TOGGLE_SHEET'; sheet: 'ledger' | 'gaps' }
  | { type: 'CLOSE_SHEET' }
  | { type: 'NEW_GAME' };

export function initialAppState(): AppState {
  return { page: 'open', game: createGame(), pending: null, float: null, sheet: null };
}

const clone = (g: GameData): GameData => structuredClone(g);

/** 开奖落账完成：挂飘字，关弹窗；text 为 null 时不出飘字 */
function withFloat(state: AppState, game: GameData, text: string | null): AppState {
  return {
    ...state,
    game,
    pending: null,
    float: text != null ? { text, seq: (state.float?.seq ?? 0) + 1 } : null,
  };
}

function openProbePicker(state: AppState): AppState {
  const g = state.game;
  if (!canBet(g)) return state;
  if (!probeOptions(g).length) return state;
  if (g.cash < L.probe) return { ...state, pending: { kind: 'probeBroke' } };
  return { ...state, pending: { kind: 'probe' } };
}

function openBlind(state: AppState): AppState {
  const g = state.game;
  if (!canBet(g)) return state;
  if (g.gaps.broth.filled) return state;
  if (g.cash < L.blind) return { ...state, pending: { kind: 'blindBroke' } };
  return { ...state, pending: { kind: 'blind' } };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START': {
      if (state.page !== 'open') return state;
      const next = clone(state.game);
      next.phase = 'bet';
      next.oldGuess = oldMasterEstimate(next);
      return { ...state, game: next, page: 'main' };
    }

    case 'BET': {
      const g = state.game;
      if (!canBet(g) || state.pending) return state;
      if (g.cash < action.amount * L.unitCost) return state;
      // 对手降价（第 15 天脚本钉死）
      if (!g.rivalDone && g.day >= 15) {
        const next = clone(g);
        next.rivalDone = true;
        return { ...state, game: next, pending: { kind: 'rival', amount: action.amount } };
      }
      const ev = rollEvent(g);
      if (ev && ev.kind === 'choice') {
        return { ...state, pending: { kind: 'choice', ev, amount: action.amount } };
      }
      const next = clone(g);
      let mult: number | null = 1;
      if (ev && ev.kind === 'auto') {
        if (ev.next) next.q.push(ev.next);
        if (ev.wechat) next.wechat += ev.wechat;
        log(next, ev.label + '：' + ev.text, ev.cls || '');
        mult = ev.mult;
      }
      return withFloat(state, next, resolveBet(next, action.amount, mult));
    }

    case 'CHOOSE': {
      const p = state.pending;
      if (!p || p.kind !== 'choice') return state;
      const opt = p.ev.options[action.index];
      if (!opt) return state;
      const next = clone(state.game);
      opt.fn(next);
      return withFloat(state, next, resolveBet(next, p.amount, 1));
    }

    case 'RIVAL': {
      const p = state.pending;
      if (!p || p.kind !== 'rival') return state;
      const next = clone(state.game);
      if (action.index === 0) {
        next.q.push(1.05);
        log(next, '守住价格，推套餐应对，明晚客流 +5%。', 'good');
        mark(next, '第' + next.day + '天 你守住了价格');
      } else {
        next.declines += 1; next.priceCut = true; next.q.push(1.25, 0.9, 0.85, 0.8);
        log(next, '跟降 15%：明晚多来人，之后三天老客流失。', 'bad');
        mark(next, '第' + next.day + '天 你跟了降价----三天老客流失');
      }
      return withFloat(state, next, resolveBet(next, p.amount, 1));
    }

    case 'SKIP': {
      const g = state.game;
      if (!canBet(g) || g.day === 1 || state.pending) return state;
      const opts = skipOptions(g);
      return { ...state, pending: { kind: opts.length ? 'skip' : 'skipEmpty' } };
    }

    case 'SKIP_PICK': {
      // 原交互：关掉「今天不押」弹窗后立刻打开下一层弹窗
      const base: AppState = { ...state, pending: null };
      if (action.key === 'probe') return openProbePicker(base);
      return openBlind(base);
    }

    case 'PROBE': {
      const next = clone(state.game);
      const text = applyProbe(next, action.key);
      // 原交互：点选项即关弹窗，条件不满足时静默无事发生
      if (text == null) return { ...state, pending: null };
      return withFloat(state, next, text);
    }

    case 'BLIND_SUBMIT': {
      const next = clone(state.game);
      const text = applyBlind(next, action.scores);
      // 未打完分或条件不满足：弹窗保持，由组件给出提示
      if (text == null) return state;
      return withFloat(state, next, text);
    }

    case 'CLOSE_MODAL':
      return state.pending ? { ...state, pending: null } : state;

    case 'NEXT_DAY': {
      const g = state.game;
      if (g.finished || g.phase !== 'result') return state;
      const next = clone(g);
      const base: AppState = { ...state, float: null, pending: null };
      if (next.cash <= L.bottom) {
        next.finished = true;
        return { ...base, game: next, page: 'ending' };
      }
      if (next.day % 7 === 0) {
        settleWeek(next, Math.ceil(next.day / 7));
        return { ...base, game: next, page: 'weekly' };
      }
      advanceDay(next);
      return { ...base, game: next, page: 'main' };
    }

    case 'WEEK_NEXT': {
      const next = clone(state.game);
      if (next.day >= 28) {
        next.finished = true;
        return { ...state, game: next, page: 'ending' };
      }
      advanceDay(next);
      return { ...state, game: next, page: 'main' };
    }

    case 'RECAP':
      return state.page === 'ending' ? { ...state, page: 'recap' } : state;

    case 'SET_PRICE': {
      if (state.game.phase !== 'bet' || state.game.finished) return state;
      const next = clone(state.game);
      next.priceMultiplier = action.mult;
      return { ...state, game: next };
    }

    case 'TOGGLE_SHEET':
      return { ...state, sheet: state.sheet === action.sheet ? null : action.sheet };

    case 'CLOSE_SHEET':
      return state.sheet ? { ...state, sheet: null } : state;

    case 'NEW_GAME':
      return initialAppState();

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
