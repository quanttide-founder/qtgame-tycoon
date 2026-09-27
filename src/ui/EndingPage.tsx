import { GAPS, L } from '../game/constants';
import { filledCount, money, progress } from '../game/query';
import type { UiProps } from './props';

export default function EndingPage({ state, dispatch }: UiProps) {
  const g = state.game;
  const p = progress(g);
  const filled = filledCount(g);

  let title: string;
  let quote: string;
  let cls: string;
  if (g.cash <= L.bottom) {
    title = '触底出局';
    quote = '现金见底，这局到此为止。下局先活下来。';
    cls = 'bad';
  } else {
    const pass = p.avg >= L.target;
    const ready = filled >= 5;
    if (pass && ready) { title = '你心里有数'; quote = '军师的模型，你的数字----这摊子，是你的了'; cls = 'good'; }
    else if (pass && !ready) { title = '运气替你付了学费'; quote = '这局的赢和你的判断没关系'; cls = 'warn'; }
    else if (!pass && ready) { title = '数字对了，执行输了'; quote = '赔率算对了，最后还是押错档'; cls = 'warn'; }
    else { title = '你全程在赌'; quote = '你不知道自己在赌什么'; cls = 'bad'; }
  }

  return (
    <section className="page on" id="pg-ending">
      <div className="end">
        <h1 id="end-title" className={cls}>{title}</h1>
        <p className="line" id="end-a">{'日均 ' + p.avg.toFixed(0) + ' 签 · 盈余 ' + money(g.cash - L.start)}</p>
        <p className="line" id="end-b">{GAPS.length + ' 个数字，' + filled + ' 个是你亲手拿的'}</p>
        <p className="quote" id="end-quote">{'「' + quote + '」'}</p>
        <div className="acts">
          <button className="ghost" id="b-recap" onClick={() => dispatch({ type: 'RECAP' })}>看复盘</button>
          <button className="primary" id="b-again1" onClick={() => dispatch({ type: 'NEW_GAME' })}>再来一局</button>
        </div>
      </div>
    </section>
  );
}
