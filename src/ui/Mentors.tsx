import type { ReactNode } from 'react';
import { forecast } from '../game/query';
import type { AppState } from '../game/types';

export default function Mentors({ state }: { state: AppState }) {
  const g = state.game;
  let adv: ReactNode;
  let old: ReactNode;

  if (g.day === 1) {
    adv = <>日均 150，没问题！我这版模型很稳。今天先押 <em>160</em>，我给你打个样。</>;
    old = '二十年了，这街的生意我一眼能看出来。你先跟着 AI 走一步。';
  } else if (g.day === 3) {
    adv = '这几个数我是编的。你去隔壁摊数一晚，我才能算准。';
    old = '他那几个数虚得很。明天早上菜市场蹲一小时，比什么都强。';
  } else if (g.cash < 3000) {
    adv = '现金快见底了，别再花钱探店，先押小一点回血。';
    old = '你这摊子快不行了。实在不行，从我这儿借锅底，别再乱花钱。';
  } else if (g.priceCut) {
    adv = '跟降的账迟早要还----你看，老客已经在走了。';
    old = '降价？我摆了二十年，没见过跟降价能长久的。';
  } else {
    const f = forecast(g);
    const missing: string[] = [];
    if (!g.gaps.price.filled) missing.push('价格带');
    if (!g.gaps.crowd.filled) missing.push('翻台率');
    if (!g.gaps.broth.filled) missing.push('底料');
    if (!g.gaps.mix.filled) missing.push('品类');
    adv = (
      <>
        {'今晚 '}
        <em>{f.v}±{f.u}</em>。
        {missing.length
          ? <span className="guessed">{missing.join(' / ') + '----我还在猜。'}</span>
          : '每个数都是你亲手拿的。'}
      </>
    );
    const og = g.oldGuess;
    const guessCls = og > f.v + 10 ? '（比 AI 高）' : og < f.v - 10 ? '（比 AI 低）' : '';
    old = (
      <>
        {'我看今晚 '}
        <b>{og}</b>
        {' 上下'}
        {guessCls ? <span className="mut">{guessCls}</span> : null}
        <span className="guessed">别的不敢说，这条街的人几点来我清楚。</span>
      </>
    );
  }

  return (
    <>
      <div className="mentor-row">
        <div className="who">军师</div>
        <p id="adv-line">{adv}</p>
      </div>
      <div className="mentor-row" id="old-row">
        <div className="who old">摊主</div>
        <p id="old-line">{old}</p>
      </div>
    </>
  );
}
