import { money, unc } from '../game/query';
import type { ReactNode } from 'react';
import type { UiProps } from './props';

export default function ResultPanel({ state, dispatch }: UiProps) {
  const g = state.game;
  const st = g.stall;

  let attrs: ReactNode = null;
  let compare: ReactNode = null;
  let detail: ReactNode;

  if (st) {
    attrs = (
      <div className="attr-row" id="r-attrs">
        <div>押 <b id="r-bet">{st.amount}</b></div>
        <div>需 <b id="r-demand">{st.demand}</b></div>
        <div id="r-left-box" className={st.leftover > 0 ? 'lose' : 'win'}>
          剩 <b id="r-left">{Math.max(0, st.leftover)}</b>
        </div>
      </div>
    );

    const u = unc(g);
    const diff = st.amount - st.fc;
    if (Math.abs(diff) <= u) {
      compare = (
        <>
          {'军师说 '}
          <b>{st.fc + '±' + u}</b>
          {'。你押在了区间内。'}
          <span className="good">跟军师同调。</span>
        </>
      );
    } else if (diff > 0) {
      compare = (
        <>
          {'军师说 '}
          <b>{st.fc + '±' + u}</b>
          {'。你比军师多押了 '}
          <b>{diff}</b>
          {' 签。'}
          <span className="warn">赌了一把大的。</span>
        </>
      );
    } else {
      compare = (
        <>
          {'军师说 '}
          <b>{st.fc + '±' + u}</b>
          {'。你比军师少押了 '}
          <b>{Math.abs(diff)}</b>
          {' 签。'}
          <span className="warn">保守了一把。</span>
        </>
      );
    }

    const netCls = st.net >= 0 ? 'good' : 'bad';
    detail = (
      <>
        {st.shortage > 0 && <span className="bad">{'断货 ' + st.shortage + ' 签'}</span>}
        {st.shortage > 0 && ' · '}
        {st.leftover > 0 && <>损耗 <span className="bad">{(st.wasteRate * 100).toFixed(0) + '%'}</span></>}
        {st.leftover > 0 && ' · '}
        {'流水 '}
        <span className="num">{money(st.rev)}</span>
        {' · 净 '}
        <span className={netCls}>{money(st.net)}</span>
        {st.fine > 0 && (
          <>
            <br />
            <span className="bad">{'损耗超线，罚款 ' + money(st.fine)}</span>
          </>
        )}
      </>
    );
  } else {
    detail = g.lastResult && g.lastResult.kind !== 'stall'
      ? g.lastResult.text
      : '今天没有出摊。';
  }

  return (
    <>
      <div className="result-panel">
        {attrs}
        <div className="compare" id="r-compare">{compare}</div>
        <div className="attr-detail" id="r-detail">{detail}</div>
      </div>
      <div className="acts" style={{ marginTop: 12 }}>
        <button
          className="primary" id="b-next" style={{ width: '100%' }}
          onClick={() => dispatch({ type: 'NEXT_DAY' })}
        >
          {g.day >= 28 ? '收摊 · 查看结局' : '收摊 · 进入第 ' + (g.day + 1) + ' 天'}
        </button>
      </div>
    </>
  );
}
