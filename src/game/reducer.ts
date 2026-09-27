import { L } from './constants';
import {
  advanceDay, applyBlind, applyProbe, createGame, log, mark,
  resolveBet, settleWeek,
} from './mutate';
import {
  canBet, oldMasterEstimate, probeOptions, skipOptions,
} from './query';
import { rollEvent } from './events';
import type { Action, AppState, GameData, Pending, UiState } from './types';

export function initialAppState(): AppState {
  return {
    ui: { page: 'open', sheet: null, float: null },
    game: createGame(),
    pending: null,
  };
}

const clone = (g: GameData): GameData => structuredClone(g);

interface Commit {
  /** 必须是 clone(game) 出来的草稿，由 mutate 层原地修改后整只替换 */
  game: GameData;
  ui?: Partial<UiState>;
  /** 不传 = 原样带过；传 null = 显式关弹窗。永不拷贝 */
  pending?: Pending | null;
}

/**
 * 唯一的状态提交点——三段克隆边界的执行处：
 * game 整只替换、ui 浅铺、pending 按引用带过（闭包不能被 structuredClone）。
 */
function commit(state: AppState, c: Commit): AppState {
  return {
    ui: c.ui ? { ...state.ui, ...c.ui } : state.ui,
    game: c.game,
    pending: c.pending !== undefined ? c.pending : state.pending,
  };
}

/** 开奖落账完成：关弹窗、挂飘字；text 为 null 时不出飘字 */
function settleCommit(state: AppState, game: GameData, text: string | null): AppState {
  return commit(state, {
    game,
    pending: null,
    ui: { float: text != null ? { text, seq: (state.ui.float?.seq ?? 0) + 1 } : null },
  });
}

function openProbePicker(state: AppState): AppState {
  const g = state.game;
  if (!canBet(g)) return state;
  if (!probeOptions(g).length) return state;
  if (g.cash < L.probe) return commit(state, { game: g, pending: { kind: 'probeBroke' } });
  return commit(state, { game: g, pending: { kind: 'probe' } });
}

function openBlind(state: AppState): AppState {
  const g = state.game;
  if (!canBet(g)) return state;
  if (g.gaps.broth.filled) return state;
  if (g.cash < L.blind) return commit(state, { game: g, pending: { kind: 'blindBroke' } });
  return commit(state, { game: g, pending: { kind: 'blind' } });
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START': {
      if (state.ui.page !== 'open') return state;
      const next = clone(state.game);
      next.phase = 'bet';
      next.oldGuess = oldMasterEstimate(next);
      return commit(state, { game: next, ui: { page: 'main' } });
    }

    case 'BET': {
      const g = state.game;
      if (!canBet(g) || state.pending) return state;
      if (g.cash < action.amount * L.unitCost) return state;
      // 对手降价（第 15 天脚本钉死）
      if (!g.rivalDone && g.day >= 15) {
        const next = clone(g);
        next.rivalDone = true;
        return commit(state, { game: next, pending: { kind: 'rival', amount: action.amount } });
      }
      const ev = rollEvent(g);
      if (ev && ev.kind === 'choice') {
        return commit(state, { game: g, pending: { kind: 'choice', ev, amount: action.amount } });
      }
      const next = clone(g);
      let mult: number | null = 1;
      if (ev && ev.kind === 'auto') {
        if (ev.next) next.q.push(ev.next);
        if (ev.wechat) next.wechat += ev.wechat;
        log(next, ev.label + '：' + ev.text, ev.cls || '');
        mult = ev.mult;
      }
      return settleCommit(state, next, resolveBet(next, action.amount, mult));
    }

    case 'CHOOSE': {
      const p = state.pending;
      if (!p || p.kind !== 'choice') return state;
      const opt = p.ev.options[action.index];
      if (!opt) return state;
      const next = clone(state.game);
      opt.fn(next);
      return settleCommit(state, next, resolveBet(next, p.amount, 1));
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
      return settleCommit(state, next, resolveBet(next, p.amount, 1));
    }

    case 'SKIP': {
      const g = state.game;
      if (!canBet(g) || g.day === 1 || state.pending) return state;
      const opts = skipOptions(g);
      return commit(state, { game: g, pending: { kind: opts.length ? 'skip' : 'skipEmpty' } });
    }

    case 'SKIP_PICK': {
      // 原交互：关掉「今天不押」弹窗后立刻打开下一层弹窗
      const base = commit(state, { game: state.game, pending: null });
      if (action.key === 'probe') return openProbePicker(base);
      return openBlind(base);
    }

    case 'PROBE': {
      const next = clone(state.game);
      const text = applyProbe(next, action.key);
      // 原交互：点选项即关弹窗，条件不满足时静默无事发生
      if (text == null) return commit(state, { game: state.game, pending: null });
      return settleCommit(state, next, text);
    }

    case 'BLIND_SUBMIT': {
      const next = clone(state.game);
      const text = applyBlind(next, action.scores);
      // 未打完分或条件不满足：弹窗保持，由组件给出提示
      if (text == null) return state;
      return settleCommit(state, next, text);
    }

    case 'CLOSE_MODAL':
      return state.pending ? commit(state, { game: state.game, pending: null }) : state;

    case 'NEXT_DAY': {
      const g = state.game;
      if (g.finished || g.phase !== 'result') return state;
      const next = clone(g);
      if (next.cash <= L.bottom) {
        next.finished = true;
        return commit(state, { game: next, ui: { page: 'ending', float: null }, pending: null });
      }
      if (next.day % 7 === 0) {
        settleWeek(next, Math.ceil(next.day / 7));
        return commit(state, { game: next, ui: { page: 'weekly', float: null }, pending: null });
      }
      advanceDay(next);
      return commit(state, { game: next, ui: { page: 'main', float: null }, pending: null });
    }

    case 'WEEK_NEXT': {
      const next = clone(state.game);
      if (next.day >= 28) {
        next.finished = true;
        return commit(state, { game: next, ui: { page: 'ending' } });
      }
      advanceDay(next);
      return commit(state, { game: next, ui: { page: 'main' } });
    }

    case 'RECAP':
      return state.ui.page === 'ending'
        ? commit(state, { game: state.game, ui: { page: 'recap' } })
        : state;

    case 'SET_PRICE': {
      if (state.game.phase !== 'bet' || state.game.finished) return state;
      const next = clone(state.game);
      next.priceMultiplier = action.mult;
      return commit(state, { game: next });
    }

    case 'TOGGLE_SHEET':
      return commit(state, {
        game: state.game,
        ui: { sheet: state.ui.sheet === action.sheet ? null : action.sheet },
      });

    case 'CLOSE_SHEET':
      return state.ui.sheet ? commit(state, { game: state.game, ui: { sheet: null } }) : state;

    case 'NEW_GAME':
      return initialAppState();

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
