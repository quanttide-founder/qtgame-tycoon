import { GAPS, L } from '../../engine/constants';
import { money, progress } from '../../engine/query';
import BetPanel from '../components/BetPanel';
import type { UiProps } from '../props';
import ResultPanel from '../components/ResultPanel';
import Scene from '../components/Scene';
import Sheets from '../components/Sheets';
import Mentors from '../components/Mentors';

export default function MainPage({ state, dispatch }: UiProps) {
  const g = state.game;
  const w = Math.min(4, Math.ceil(g.day / 7));
  const p = progress(g);
  const fillCls = p.avg >= L.target ? 'fill on' : p.avg >= L.target * 0.85 ? 'fill mid' : 'fill';
  const fillW = Math.min(100, (p.avg / L.target) * 100) + '%';
  const gapLeft = GAPS.filter((x) => !g.gaps[x.key].filled).length;

  return (
    <section className="page on" id="pg-main">
      <header>
        <span id="h-day">第 <b>{g.day}</b> 天 · 第 <b>{w}</b> 周</span>
        <span id="h-cash">现金 <b>{money(g.cash)}</b></span>
      </header>
      <div className="prog">
        <span id="h-avg">{'日均 ' + p.avg.toFixed(0) + ' / ' + L.target}</span>
        <span className="track">
          <span className={fillCls} id="h-fill" style={{ width: fillW }} />
        </span>
      </div>

      <Scene state={state} />
      <Mentors state={state} />

      {g.phase === 'bet'
        ? <BetPanel state={state} dispatch={dispatch} />
        : <ResultPanel state={state} dispatch={dispatch} />}

      <div className="tabs">
        <button id="tab-ledger" onClick={() => dispatch({ type: 'TOGGLE_SHEET', sheet: 'ledger' })}>账本</button>
        <button id="tab-gaps" onClick={() => dispatch({ type: 'TOGGLE_SHEET', sheet: 'gaps' })}>
          {'缺口（' + gapLeft + '）'}
        </button>
      </div>

      <Sheets state={state} dispatch={dispatch} />
    </section>
  );
}
