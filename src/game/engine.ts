import { BLIND_CRIT, BLIND_NAMES, CAL_EVENTS, GAPS, L } from './constants';
import type { BlindScores, GameData, GapKey, Weather } from './types';

/* ── 展示格式 ── */
export const fmt = (n: number) => Math.round(n).toLocaleString('zh-CN');
export const money = (n: number) => '¥' + fmt(n);

/* ── 基础计算 ── */
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

export function actualDemand(g: GameData): number {
  const f = forecast(g);
  const half = f.u / 100;
  const r = (Math.random() * 2 - 1) * half;
  let d = f.v * (1 + r);
  if (g.weather === '小雨') d *= 0.82;
  else if (g.weather === '暴雨') d *= 0.5;
  else if (g.weather === '阴') d *= 0.95;
  const cal = CAL_EVENTS[g.day];
  if (cal) {
    if (cal.indexOf('周末') >= 0) d *= 1.2;
    if (cal.indexOf('游客高峰') >= 0) d *= 1.35;
    if (cal.indexOf('大闸蟹') >= 0) d *= 1.15;
  }
  const qm = g.q.shift();
  if (qm !== undefined) d *= qm;
  if (g.wechat < 15) d *= 0.92;
  // 定价弹性：每 +10% 价格，需求 -6%
  d *= (1 - (g.priceMultiplier - 1) * 0.6);
  // 价格带未实测：玩家在黑箱中定价，需求方差更大
  if (!g.gaps.price.filled) d *= (0.92 + Math.random() * 0.16);
  return Math.max(10, Math.round(d));
}

export const currentPrice = (g: GameData) => L.priceBase * g.priceMultiplier;

export function progress(g: GameData) {
  const stalls = g.records.filter((r) => r.act === '押注');
  const total = stalls.reduce((a, r) => a + r.sold, 0);
  return { played: stalls.length, total, avg: stalls.length ? total / stalls.length : 0 };
}

export const filledCount = (g: GameData) => GAPS.filter((x) => g.gaps[x.key].filled).length;
export const manualFilled = (g: GameData) =>
  GAPS.filter((x) => x.src !== '自动' && g.gaps[x.key].filled).length;
export const unc = (g: GameData) => [40, 30, 20, 12, 8][manualFilled(g)];

export function rollWeather(): Weather {
  const r = Math.random();
  return r < 0.5 ? '晴' : r < 0.8 ? '阴' : r < 0.93 ? '小雨' : '暴雨';
}

export const canBet = (g: GameData) => g.phase === 'bet' && !g.finished;

/* ── 状态变更原语 ── */
export function log(g: GameData, text: string, cls = '') {
  g.logs.unshift({ day: g.day, text, cls });
  if (g.logs.length > 40) g.logs.pop();
}
export const mark = (g: GameData, t: string) => { g.milestones.push(t); };

export function createGame(): GameData {
  const g: GameData = {
    day: 1, cash: L.start, weather: rollWeather(),
    pricing: 'est', mix: [60, 30, 10], priceCut: false, quality: 1,
    priceMultiplier: 1.0,
    gaps: {
      price: { filled: false, val: null, day: null },
      crowd: { filled: false, val: null, day: null },
      mix: { filled: false, val: null, day: null },
      broth: { filled: false, val: null, day: null },
      weekAvg: { filled: false, val: null, day: null },
      waste: { filled: false, val: null, day: null },
    },
    records: [], logs: [], milestones: [],
    wasteSum: 0, wasteN: 0, weekViolations: 0, weekShortages: 0,
    wechat: 0, declines: 0, loans: 0, q: [], guests: 0,
    cum: { rev: 0, cost: 0, act: 0, event: 0 },
    fc: [{ v: L.target, u: 0 }, null, null, null],
    errors: [null, null, null, null],
    paidWeeks: {}, rivalDone: false, finished: false,
    lastResult: null, stall: null, phase: 'bet',
    fcHistory: [], betHistory: [], demandHistory: [],
    oldGuess: 0,
  };
  g.oldGuess = oldMasterEstimate(g);
  log(g, '第 1 天：设备与货置办妥了，手里现金 20,000。');
  return g;
}

/* ── 开奖结算（唯一出口）：返回飘字，null 表示不飘字 ── */
export function resolveBet(g: GameData, amount: number, mult: number | null): string | null {
  g.phase = 'result';
  g.stall = null;

  if (g.cash < amount * L.unitCost) {
    amount = Math.max(0, Math.floor(g.cash / L.unitCost));
  }

  if (amount === 0) {
    g.cash -= L.fixed;
    g.cum.cost += L.fixed;
    g.lastResult = { kind: 'skip', day: g.day, text: '现金见底，今天没出摊。' };
    g.fcHistory.push(forecast(g).v);
    g.betHistory.push(0);
    g.demandHistory.push(0);
    g.records.push({ day: g.day, act: '押注', sold: 0, bet: 0, demand: 0, leftover: 0, shortage: 0, rev: 0, cost: L.fixed });
    return null;
  }

  const cost = amount * L.unitCost;
  g.cash -= cost;
  g.cum.cost += cost;

  const fc = forecast(g).v;
  const demand = Math.max(0, Math.round(actualDemand(g) * (mult == null ? 1 : mult)));
  const sold = Math.min(amount, demand);
  const leftover = Math.max(0, amount - demand);
  const shortage = Math.max(0, demand - amount);
  const price = currentPrice(g);
  const rev = sold * price;
  const net = rev - cost - L.fixed;

  g.cash += rev - L.fixed;
  g.cum.rev += rev;
  g.cum.cost += L.fixed;

  g.wechat += Math.min(5, Math.round(sold / 30));
  g.guests = Math.max(0, Math.min(9, Math.round(sold / 22)));

  g.fcHistory.push(fc);
  g.betHistory.push(amount);
  g.demandHistory.push(demand);

  const wasteRate = amount > 0 ? leftover / amount : 0;
  g.wasteSum += wasteRate; g.wasteN += 1;
  let fine = 0;
  if (wasteRate > L.wasteCap) {
    g.weekViolations += 1;
    fine = L.fine;
    g.cash -= fine;
    g.cum.event += fine;
  }
  if (shortage > 0) g.weekShortages += 1;

  g.records.push({ day: g.day, act: '押注', sold, bet: amount, demand, leftover, shortage, rev, cost });
  g.stall = { amount, demand, sold, leftover, shortage, rev, cost, net, wasteRate, fine, fc };
  g.lastResult = { kind: 'stall', day: g.day, ...g.stall };

  log(g, '押 ' + amount + ' → 需 ' + demand + ' → 售 ' + sold +
      (shortage ? '（断货 ' + shortage + '）' : '') +
      '，流水 ' + money(rev) + '，净 ' + money(net),
      shortage ? 'warn' : (sold >= amount ? 'good' : ''));

  return '+' + sold + '签';
}

/* ── 今天不押（探店 / 盲测入口） ── */
export const probeOptions = (g: GameData) =>
  GAPS.filter((x) => x.src === '探店' && !g.gaps[x.key].filled);

export function skipOptions(g: GameData): ('probe' | 'blind')[] {
  const opts: ('probe' | 'blind')[] = [];
  if (probeOptions(g).length) opts.push('probe');
  if (!g.gaps.broth.filled) opts.push('blind');
  return opts;
}

export function applyProbe(g: GameData, key: GapKey): string | null {
  if (!canBet(g)) return null;
  const def = GAPS.find((x) => x.key === key);
  const gap = g.gaps[key];
  if (!def || def.src !== '探店' || gap.filled || g.cash < L.probe) return null;

  g.phase = 'result';
  g.stall = null;
  gap.filled = true; gap.day = g.day;
  g.cash -= L.probe; g.cum.act += L.probe;
  g.cash -= L.fixed; g.cum.cost += L.fixed;

  if (key === 'price') { g.pricing = 'locked'; gap.val = '本地均价 ' + L.localAvg.toFixed(1) + ' 元'; }
  else if (key === 'crowd') { gap.val = '接待上限 +15%'; }
  else if (key === 'mix') { g.mix = [55, 35, 10]; gap.val = '55 : 35 : 10'; }

  g.records.push({ day: g.day, act: '探店', sold: 0, bet: 0, demand: 0, leftover: 0, shortage: 0, rev: 0, cost: L.probe + L.fixed });
  g.lastResult = { kind: 'probe', day: g.day, text: '探店：带回「' + def.label + '」实测' };
  g.fcHistory.push(forecast(g).v);
  g.betHistory.push(0);
  g.demandHistory.push(0);
  log(g, '探店回填「' + def.label + '」：' + gap.val + '。', 'good');
  mark(g, '第' + g.day + '天 你去探了店');
  return '实测到手';
}

/* ── 盲测 ── */
export const blindComplete = (scores: BlindScores) =>
  BLIND_NAMES.every((n) => BLIND_CRIT.every((c) => scores[n]?.[c]));

export function applyBlind(g: GameData, scores: BlindScores): string | null {
  if (!blindComplete(scores)) return null;
  if (!canBet(g)) return null;

  g.phase = 'result';
  g.stall = null;
  const totals = BLIND_NAMES.map((n) =>
    BLIND_CRIT.reduce((a, c) => a + (scores[n]?.[c] ?? 0), 0));
  const best = Math.max(...totals);
  const champ = BLIND_NAMES[totals.indexOf(best)];
  g.quality = 1.08 + (best / 15) * 0.07;
  const gap = g.gaps.broth;
  gap.filled = true; gap.day = g.day;
  gap.val = champ + ' 款（' + best + '/45）';
  g.cash -= L.blind; g.cum.act += L.blind;
  g.cash -= L.fixed; g.cum.cost += L.fixed;

  g.records.push({ day: g.day, act: '盲测', sold: 0, bet: 0, demand: 0, leftover: 0, shortage: 0, rev: 0, cost: L.blind + L.fixed });
  g.lastResult = { kind: 'blind', day: g.day, text: '盲测：' + champ + ' 款胜出，底料系数 ' + g.quality.toFixed(2) };
  g.fcHistory.push(forecast(g).v);
  g.betHistory.push(0);
  g.demandHistory.push(0);
  log(g, '盲测：冠军 ' + champ + ' 款（' + best + '/45），底料系数 ' + g.quality.toFixed(2) + '。', 'good');
  mark(g, '第' + g.day + '天 你盲测出冠军料');
  return '冠军 ' + champ + ' 款';
}

/* ── 回合推进 ── */
export function advanceDay(g: GameData) {
  g.day += 1;
  g.weather = rollWeather();
  g.phase = 'bet';
  g.stall = null;
  g.guests = 0;
  g.oldGuess = oldMasterEstimate(g);
  const w = Math.ceil(g.day / 7);
  if (g.fc[w - 1] == null) g.fc[w - 1] = { v: Math.round(L.target * multCore(g)), u: unc(g) };
}

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

/** 进入周结算页时的落账：利息、误差记录、首周缺口回填 */
export function settleWeek(g: GameData, w: number) {
  const st = weekStats(g, w);
  const f = g.fc[w - 1];
  const fc = f ? f.v : null;
  g.errors[w - 1] =
    fc != null && st.avg != null ? Math.round(Math.abs(fc - st.avg) / st.avg * 100) : null;
  if (g.paidWeeks[w]) return;
  g.paidWeeks[w] = true;
  const interest = g.loans * L.loanInt;
  if (interest > 0) { g.cash -= interest; g.cum.event += interest; log(g, '借款利息 ' + money(interest) + '。', 'bad'); }
  if (w === 1) {
    if (st.avg != null) {
      const gp = g.gaps.weekAvg;
      gp.filled = true; gp.day = 7; gp.val = Math.round(st.avg) + ' 签';
    }
    if (g.wasteN > 0) {
      const gp = g.gaps.waste;
      gp.filled = true; gp.day = 7;
      gp.val = ((g.wasteSum / g.wasteN) * 100).toFixed(1) + '%';
    }
  }
  g.weekShortages = 0;
  g.weekViolations = 0;
}
