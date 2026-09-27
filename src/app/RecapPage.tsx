import type { UiProps } from './props';

interface ErrPoint { w: number; e: number }

function curveText(fh: number[], bh: number[], dh: number[]): string {
  if (!bh.length) return '（没有押注记录）';
  const pad = (v: number) => String(v).padStart(3, ' ');
  const rowFc = '军师  ' + fh.map(pad).join(' ');
  const rowBet = '押注  ' + bh.map(pad).join(' ');
  const rowDem = '需求  ' + dh.map(pad).join(' ');
  const rowMark = '      ' + bh.map((v, i) => {
    if (v === 0) return ' · ';
    if (v > dh[i]) return ' ↓ ';   // 押多了
    if (v < dh[i]) return ' ↑ ';   // 押少了
    return ' = ';
  }).join('');
  return rowFc + '\n' + rowBet + '\n' + rowDem + '\n' + rowMark;
}

export default function RecapPage({ state, dispatch }: UiProps) {
  const g = state.game;
  const errs = g.errors
    .map((e, i) => ({ w: i + 1, e }))
    .filter((x): x is ErrPoint => x.e != null);

  let head: string;
  if (errs.length >= 2) head = '预测误差 ' + errs[0].e + '% → ' + errs[errs.length - 1].e + '%';
  else if (errs.length === 1) head = '预测误差 ±' + errs[0].e + '%';
  else head = '没有出摊对照，没有误差记录';

  // 原实现：没有押注记录时只画「没有记录」并提前返回，关键转折不再渲染
  const hasBet = g.betHistory.length > 0;

  return (
    <section className="page on" id="pg-recap">
      <div className="end" style={{ textAlign: 'left', paddingTop: 24 }}>
        <h2>这 28 天</h2>
        <p className="tag">军师的预测误差</p>
        <p className="rc-head" id="rc-head">{head}</p>
        <div id="rc-chart">
          {errs.map((x) => (
            <div className="rc-row" key={x.w}>
              <span className="w">{'第' + x.w + '周'}</span>
              <span className="rc-track">
                <span
                  className={'rc-fill ' + (x.e > 30 ? 'hi' : x.e <= 15 ? 'lo' : '')}
                  style={{ width: Math.min(100, x.e) + '%' }}
                />
              </span>
              <span className="v">{'±' + x.e + '%'}</span>
            </div>
          ))}
        </div>
        <h3>三条线</h3>
        <div className="rc-curve" id="rc-curve">
          {curveText(g.fcHistory, g.betHistory, g.demandHistory)}
        </div>
        {hasBet && (
          <>
            <h3>关键转折</h3>
            <ul id="rc-marks">
              {g.milestones.length
                ? g.milestones.map((m, i) => <li key={i}>{m}</li>)
                : <li>这 28 天风平浪静。</li>}
            </ul>
          </>
        )}
        <p className="rc-quote">游戏里蹲两晚就能回填缺口----滁州的夜市也是。</p>
        <div className="acts">
          <button className="primary" id="b-again2" onClick={() => dispatch({ type: 'NEW_GAME' })}>再来一局</button>
        </div>
      </div>
    </section>
  );
}
