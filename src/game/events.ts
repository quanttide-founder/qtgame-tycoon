import { L } from './constants';
import { log, mark, money } from './engine';
import type { GameData, GameEvent } from './types';

export function rollEvent(g: GameData): GameEvent | null {
  if (g.day === 1) return null;                 // 第 1 天强制出摊，不触发事件
  if (Math.random() > 0.30) return null;
  const pool: GameEvent[] = [];
  if (g.weather === '小雨') pool.push({ kind: 'auto', mult: 1, label: '小雨', text: '雨天客流少，但老客照来。', cls: '' });
  if (g.weather === '暴雨') pool.push({ kind: 'auto', mult: 1, label: '暴雨', text: '雨太大，街上没剩几个人。', cls: 'warn' });
  pool.push({ kind: 'auto', mult: 0.4, label: '商圈改造', text: '前方施工围挡，今天客流腰斩。', cls: 'warn' });
  pool.push({ kind: 'auto', mult: 1, next: 1.05, wechat: 5, label: '熟客推荐',
    text: '熟客带朋友来，加了 5 个微信，明晚多来些人。', cls: 'good' });
  pool.push({
    kind: 'choice', label: '设备故障', text: '卡式炉点不着火，串好的签等着下锅。',
    options: [
      { label: '找师傅修', sub: '花 700 元，必成', fn(g) {
        g.cash -= 700; g.cum.event += 700; log(g, '维修花了 700 元，当天照常出摊。');
      } },
      { label: '自己捣鼓', sub: '六成花 300 修好；四成花 800 还得叫师傅', fn(g) {
        if (Math.random() < 0.6) { g.cash -= 300; g.cum.event += 300; log(g, '自己修好了，只花 300 元零件。', 'good'); }
        else { g.cash -= 800; g.cum.event += 800; log(g, '没修好，还是叫了师傅，花 800。', 'bad'); }
      } },
    ],
  });
  pool.push({
    kind: 'choice', label: '恶意差评', text: '有人说「又贵又难吃」，还发了帖。',
    options: [
      { label: '诚恳回复并补偿', sub: '花 100 元，帖子不扩大', fn(g) {
        g.cash -= 100; g.cum.event += 100; log(g, '回复加一份补偿，帖子没有扩散。', 'good');
      } },
      { label: '冷处理', sub: '明晚客流 -15%', fn(g) {
        g.q.push(0.85); log(g, '帖子发酵，明晚客流受影响。', 'bad');
      } },
    ],
  });
  if (g.cash < 5000 && g.loans < 1) {
    pool.push({
      kind: 'choice', label: '现金吃紧', text: '有人递来「周转贷」。',
      options: [
        { label: '借 ' + money(L.loan), sub: '每周利息 400，本金不还', fn(g) {
          g.cash += L.loan; g.loans += 1;
          mark(g, '第' + g.day + '天 你借了周转贷');
          log(g, '借了 8,000 元，每周多一笔 400 利息。', 'bad');
        } },
        { label: '不借，收缩过日子', sub: '每步用上一步的利润', fn(g) {
          log(g, '不借钱。');
        } },
      ],
    });
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
