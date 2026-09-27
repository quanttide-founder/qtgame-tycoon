import { CAL_EVENTS } from '../game/constants';
import type { AppState } from '../game/types';

export default function Scene({ state }: { state: AppState }) {
  const g = state.game;
  const cal = CAL_EVENTS[g.day];
  const rainCls = g.weather === '暴雨' ? 'rain heavy' : 'rain';
  const rainOn = g.weather === '小雨' || g.weather === '暴雨';

  // 签子堆高度 = 剩货比例：押注前是空堆，开奖后按售出比例变矮
  const st = g.stall;
  const empty = g.phase === 'bet' || !st;
  const ratio = st ? Math.min(1, st.sold / Math.max(1, st.amount)) : 1;
  const skewerH = empty ? 44 : Math.max(8, Math.round(44 * (1 - ratio)));

  const r = g.lastResult;
  let note: string;
  if (g.phase === 'bet') {
    note = g.day === 1 ? '今天做什么，你定。' : '今天押多少，你定。';
  } else if (r && r.kind === 'stall') {
    // 远端单文件此处误用 r.bet（lastResult 展开自 stall，字段是 amount），会显示 undefined，按本意修正
    note = '押 ' + r.amount + ' · 需 ' + r.demand + ' · 售 ' + r.sold +
      (r.shortage ? ' · 断货 ' + r.shortage : (r.leftover ? ' · 剩 ' + r.leftover : ''));
  } else if (r) {
    note = r.text;
  } else {
    note = '今天做什么，你定。';
  }

  return (
    <div className="scene" id="scene">
      <div className="lights" />
      <div className="sky-tag" id="sc-weather">{'夜市 · ' + g.weather}</div>
      <div className="cal-tag" id="sc-cal" style={{ display: cal ? 'block' : 'none' }}>
        {cal ? '📅 ' + cal : ''}
      </div>
      <div className="ground" />
      <div className="table" />
      <div className="pot" />
      <div className="steam"><i /><i /><i /></div>
      <div
        className={'skewers' + (empty ? ' empty' : '')} id="sc-skewers"
        style={{ height: skewerH }}
      />
      <div className="guests" id="sc-guests">
        {Array.from({ length: g.guests }, (_, i) => (
          <i key={i} className={i % 2 ? 'guest b' : 'guest'} />
        ))}
      </div>
      <div className="rival" id="sc-rival" style={{ display: g.day >= 15 ? 'block' : 'none' }} />
      <div className={rainCls} id="sc-rain" style={{ display: rainOn ? 'block' : 'none' }} />
      {state.ui.float && (
        <div className="float go" key={state.ui.float.seq}>{state.ui.float.text}</div>
      )}
      <div className="note" id="sc-note">{note}</div>
    </div>
  );
}
