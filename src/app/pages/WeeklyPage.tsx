import type { ReactNode } from 'react';
import { GAPS, L } from '../../engine/constants';
import { filledCount, money, unc, weekStats } from '../../engine/query';
import type { UiProps } from '../props';
import Row from '../components/Row';

export default function WeeklyPage({ state, dispatch }: UiProps) {
  const g = state.game;
  const w = Math.ceil(g.day / 7);
  const st = weekStats(g, w);
  const f = g.fc[w - 1];
  const fc = f ? f.v : null;
  const err = g.errors[w - 1];

  let fillW = '0%';
  let fillCls = 'wk-fill';
  let cap: string;
  if (err == null) {
    cap = '没有对照，谈不上误差';
  } else {
    fillW = Math.min(100, err) + '%';
    fillCls = 'wk-fill' + (err > 30 ? '' : err > 15 ? ' mid' : ' on');
    const prev = w > 1 ? g.errors[w - 2] : null;
    cap = '误差 ±' + err + '%';
    if (w === 1) {
      if (st.avg != null && fc != null) cap += st.avg < fc ? '----说好的 150 呢' : '----我居然报少了';
    } else if (prev != null) {
      cap += err < prev ? '，比上周收窄 ' + (prev - err) + ' 个点' : '，比上周扩大 ' + (err - prev) + ' 个点';
    }
  }

  const firstUnfilled = GAPS.find((x) => x.src !== '自动' && !g.gaps[x.key].filled);
  let comment: string;
  if (g.cash <= L.bottom) comment = '现金见底，这局到头了。';
  else if (st.avg == null) comment = '一周没押注，什么都没验证。';
  else if (firstUnfilled) {
    comment = '误差主要卡在「' + firstUnfilled.label + '」----你帮我拿到它，下周能压到 ±' +
      Math.max(8, unc(g) - 8) + '。';
  } else comment = '数据齐了，我这边没什么可猜的了。';

  const rows: ReactNode[] = [
    <Row
      key="fc" label="军师周一预测"
      value={fc == null
        ? '--'
        : fc + ' 签/天' + (f && f.u ? '（±' + f.u + '%）' : '（我很有把握）')}
    />,
    <Row key="avg" label="实际出摊日均" value={st.avg == null ? '本周没押注' : st.avg.toFixed(0) + ' 签/天'} />,
    <Row key="acc" label="备货准确率" value={st.acc == null ? '--' : Math.round(st.acc * 100) + '%'} />,
    <Row key="short" label="断货次数" value={String(st.shortages)} />,
    <Row key="cash" label="现金" value={money(g.cash)} />,
    <Row key="gap" label="缺口" value={(GAPS.length - filledCount(g)) + ' 个待回填'} />,
  ];

  return (
    <section className="page on" id="pg-weekly">
      <div className="wk">
        <h2 id="wk-title">{'第 ' + w + ' 周 · 结算'}</h2>
        <div id="wk-rows">{rows}</div>
        <div className="wk-track">
          <div className={fillCls} id="wk-fill" style={{ width: fillW }} />
        </div>
        <div className="wk-cap" id="wk-cap">{cap}</div>
        <p className="tag" id="wk-comment" style={{ marginTop: 14, lineHeight: 1.8 }}>
          {'军师：' + comment}
        </p>
        <div className="acts">
          <button className="primary" id="b-wk" onClick={() => dispatch({ type: 'WEEK_NEXT' })}>
            {g.day >= 28 ? '查看结局' : '进入第 ' + (w + 1) + ' 周'}
          </button>
        </div>
      </div>
    </section>
  );
}
