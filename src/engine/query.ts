import { BLIND_CRIT, BLIND_NAMES, CAL_EVENTS, GAPS, L } from './constants';
import type { BlindScores, GameData } from './types';

/**
 * 只读派生层：全部是 (g) => 值 的纯查询，不修改任何状态。
 * app/ 允许直接引用本层；写操作一律在 mutate.ts，经 reducer 流转。
 */

/* ── 展示格式 ── */
export const fmt = (n: number) => Math.round(n).toLocaleString('zh-CN');
export const money = (n: number) => '¥' + fmt(n);

/* ── 预测与需求 ── */
export function multCore(g: GameData): number {
  let m = g.gaps.price.filled ? 1.05 : 0.78;
  if (g.gaps.crowd.filled) m *= 1.15;
  if (g.gaps.broth.filled) m *= g.quality;
  return m;
}

export const forecast = (g: GameData) => ({ v: Math.round(L.target * multCore(g)), u: unc(g) });

/** 老摊主：一个点估计，比军师偏差大，但有自己偏向 */
export function oldMasterEstimate(g: GameData): number {
  const f = forecast(g);
  const bias = (Math.random() * 0.2 - 0.1);   // -10% ~ +10%
  const cal = CAL_EVENTS[g.day];
  let mod = 1;
  if (cal && cal.indexOf('周末') >= 0) mod = 1.1;
  if (cal && cal.indexOf('游客高峰') >= 0) mod = 1.15;
  return Math.max(40, Math.round(f.v * (1 + bias) * mod));
}

export const currentPrice = (g: GameData) => L.priceBase * g.priceMultiplier;

/* ── 进度与缺口 ── */
export function progress(g: GameData) {
  const stalls = g.records.filter((r) => r.act === '押注');
  const total = stalls.reduce((a, r) => a + r.sold, 0);
  return { played: stalls.length, total, avg: stalls.length ? total / stalls.length : 0 };
}

export const filledCount = (g: GameData) => GAPS.filter((x) => g.gaps[x.key].filled).length;
export const manualFilled = (g: GameData) =>
  GAPS.filter((x) => x.src !== '自动' && g.gaps[x.key].filled).length;
export const unc = (g: GameData) => [40, 30, 20, 12, 8][manualFilled(g)];

export const canBet = (g: GameData) => g.phase === 'bet' && !g.finished;

/* ── 弹层候选项 ── */
export const probeOptions = (g: GameData) =>
  GAPS.filter((x) => x.src === '探店' && !g.gaps[x.key].filled);

export function skipOptions(g: GameData): ('probe' | 'blind')[] {
  const opts: ('probe' | 'blind')[] = [];
  if (probeOptions(g).length) opts.push('probe');
  if (!g.gaps.broth.filled) opts.push('blind');
  return opts;
}

export const blindComplete = (scores: BlindScores) =>
  BLIND_NAMES.every((n) => BLIND_CRIT.every((c) => scores[n]?.[c]));

/* ── 周统计 ── */
export function weekStats(g: GameData, w: number) {
  const from = (w - 1) * 7 + 1, to = w * 7;
  const rs = g.records.filter((r) => r.day >= from && r.day <= to);
  const stalls = rs.filter((r) => r.act === '押注' && r.bet > 0);
  const soldSum = stalls.reduce((a, r) => a + r.sold, 0);
  const betSum = stalls.reduce((a, r) => a + r.bet, 0);
  const demandSum = stalls.reduce((a, r) => a + r.demand, 0);
  const acc = stalls.length && demandSum > 0
    ? Math.max(0, 1 - Math.abs(betSum - demandSum) / demandSum)
    : null;
  return {
    n: stalls.length,
    avg: stalls.length ? soldSum / stalls.length : null,
    acc,
    shortages: g.weekShortages,
  };
}
