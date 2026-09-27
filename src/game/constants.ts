import type { GapDef } from './types';

/* ── 常量 ── */
export const L = {
  days: 28, target: 150, start: 20000, bottom: 0, wasteCap: 0.10,
  probe: 150, blind: 80,
  unitCost: 1.2, priceBase: 3.0, localAvg: 3.2,
  fixed: 80,
  fine: 200, loan: 8000, loanInt: 400,
};

export const GAPS: GapDef[] = [
  { key: 'price',   label: '本地价格带', src: '探店', how: '看隔壁摊都卖多少钱' },
  { key: 'crowd',   label: '真实客流',   src: '探店', how: '数一晚过路的人和翻台' },
  { key: 'mix',     label: '品类偏好',   src: '探店', how: '看客人点荤多还是点素多' },
  { key: 'broth',   label: '底料冠军',   src: '盲测', how: '五款盲打分，选出冠军' },
  { key: 'weekAvg', label: '实测日均',   src: '自动', how: '第一周结算回填' },
  { key: 'waste',   label: '实际损耗',   src: '自动', how: '第一周结算回填' },
];

export const CAL_EVENTS: Record<number, string> = {
  6: '周六 · 周末夜', 7: '周日 · 收摊早', 13: '周六 · 周末夜', 14: '周日 · 收摊早',
  15: '琅琊山 · 游客高峰', 20: '周六 · 周末夜', 21: '周日 · 收摊早',
  22: '女山湖 · 大闸蟹到货', 27: '周六 · 周末夜', 28: '月末决算',
};

/** 押注四档：金额（签） */
export const BET_TIERS: { amount: number; label: string; danger?: boolean }[] = [
  { amount: 80, label: '保守' },
  { amount: 120, label: '稳' },
  { amount: 160, label: '攻' },
  { amount: 200, label: '赌', danger: true },
];

export const BLIND_NAMES = ['A', 'B', 'C', 'D', 'E'] as const;
export const BLIND_CRIT = ['闻香', '耐煮', '回甘'] as const;
