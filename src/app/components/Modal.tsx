import type { ReactNode } from 'react';
import { L } from '../../engine/constants';
import { money, probeOptions, skipOptions } from '../../engine/query';
import BlindTest from './BlindTest';
import type { UiProps } from '../props';

export default function Modal({ state, dispatch }: UiProps) {
  const p = state.pending;
  if (!p) return null;
  const g = state.game;

  let body: ReactNode = null;
  switch (p.kind) {
    case 'choice':
      body = (
        <>
          <h3>{p.ev.label}</h3>
          <p>{p.ev.text}</p>
          {p.ev.options.map((o, i) => (
            <button key={i} className="opt" onClick={() => dispatch({ type: 'CHOOSE', index: i })}>
              <b>{o.label}</b><span>{o.sub}</span>
            </button>
          ))}
        </>
      );
      break;
    case 'rival':
      body = (
        <>
          <h3>对手降价</h3>
          <p>隔壁新来了个摊，素签直接降到 3 毛，有人来问你跟不跟。</p>
          <button className="opt" onClick={() => dispatch({ type: 'RIVAL', index: 0 })}>
            <b>守价，推套餐应对</b><span>明晚客流 +5%，价格不丢</span>
          </button>
          <button className="opt" onClick={() => dispatch({ type: 'RIVAL', index: 1 })}>
            <b>跟降 15%</b><span>签价永久 -15%：明晚多来人，随后三天老客流失</span>
          </button>
        </>
      );
      break;
    case 'skip':
      body = (
        <>
          <h3>今天不押</h3>
          <p className="tag">{'这一天没有营收，固定成本 ' + money(L.fixed) + ' 照扣。'}</p>
          {skipOptions(g).map((k) => (
            <button key={k} className="opt" onClick={() => dispatch({ type: 'SKIP_PICK', key: k })}>
              {k === 'probe'
                ? <><b>探店调研</b><span>{money(L.probe) + ' · 换回一条实测'}</span></>
                : <><b>底料盲测</b><span>{money(L.blind) + ' · 选出冠军料'}</span></>}
            </button>
          ))}
          <div className="acts">
            <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>再想想</button>
          </div>
        </>
      );
      break;
    case 'skipEmpty':
      body = (
        <>
          <h3>没得可拿了</h3>
          <p>该探的都探完了。今天只能押注。</p>
          <div className="acts">
            <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>好</button>
          </div>
        </>
      );
      break;
    case 'probe':
      body = (
        <>
          <h3>探店调研</h3>
          <p className="tag">{'花 ' + money(L.probe) + '，今天不出摊，换回一条实测。'}</p>
          {probeOptions(g).map((x) => (
            <button key={x.key} className="opt" onClick={() => dispatch({ type: 'PROBE', key: x.key })}>
              <b>{x.label}</b><span>{x.how}</span>
            </button>
          ))}
          <div className="acts">
            <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>再想想</button>
          </div>
        </>
      );
      break;
    case 'probeBroke':
      body = (
        <>
          <h3>现金不够</h3>
          <p>{'探店要 ' + money(L.probe) + '，你现在只有 ' + money(g.cash) + '。'}</p>
          <div className="acts">
            <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>知道了</button>
          </div>
        </>
      );
      break;
    case 'blind':
      body = <BlindTest state={state} dispatch={dispatch} />;
      break;
    case 'blindBroke':
      body = (
        <>
          <h3>现金不够</h3>
          <p>{'盲测要 ' + money(L.blind) + '，你现在只有 ' + money(g.cash) + '。'}</p>
          <div className="acts">
            <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>知道了</button>
          </div>
        </>
      );
      break;
  }

  return (
    <div id="overlay" className="on">
      <div className="modal" id="modal">{body}</div>
    </div>
  );
}
