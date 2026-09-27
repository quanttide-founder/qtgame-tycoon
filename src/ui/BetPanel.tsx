import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { BET_TIERS, CAL_EVENTS, GAPS, L } from '../game/constants';
import { filledCount, forecast, money } from '../game/engine';
import type { UiProps } from './props';

export default function BetPanel({ state, dispatch }: UiProps) {
  const g = state.game;
  const f = forecast(g);
  const lo = f.v - f.u, hi = f.v + f.u;
  const cal = CAL_EVENTS[g.day];

  const intel: ReactNode[] = [<Fragment key="w">天气 <b>{g.weather}</b></Fragment>];
  if (cal) intel.push(<Fragment key="c">日历 <b>{cal}</b></Fragment>);
  intel.push(<Fragment key="f">已实测 <b>{filledCount(g)}/{GAPS.length}</b></Fragment>);

  const priceFilled = g.gaps.price.filled;
  const pv = (L.priceBase * g.priceMultiplier).toFixed(1);
  // 本地均价标记：3.2 / 3.0 → 106.7%，映射到 70–130 滑杆行程
  const pct = (L.localAvg / L.priceBase) * 100;
  const markLeft = Math.max(0, Math.min(100, (pct - 70) / 60 * 100));

  return (
    <>
      <div className="board">
        <div className="fc-line">
          <span className="fc-big" id="b-fc">{f.v + '±' + f.u}</span>
          <span className="fc-cap">军师今晚预测</span>
        </div>
        <div className="intel" id="b-intel">
          {intel.map((p, i) => (
            <Fragment key={i}>{i > 0 ? ' · ' : null}{p}</Fragment>
          ))}
        </div>

        <div className="bet-grid" id="bet-grid">
          {BET_TIERS.map((t) => {
            const cost = t.amount * L.unitCost;
            const inRange = t.amount >= lo && t.amount <= hi;
            return (
              <button
                key={t.amount}
                className={'bet-btn' + (t.danger ? ' danger' : '') + (inRange ? ' covered' : '')}
                disabled={g.cash < cost}
                onClick={() => dispatch({ type: 'BET', amount: t.amount })}
              >
                <b>{t.amount}</b>
                <small>{t.label}</small>
                <span id={'cost-' + t.amount}>{money(cost)}</span>
              </button>
            );
          })}
        </div>

        <div className="price-block">
          <div className="p-head">
            <span>{'定价 '}
              <b id="p-val">{pv}</b>
              {' 元/签'}
            </span>
            <span id="p-ref" className={priceFilled ? 'ok' : 'mut'}>
              {priceFilled ? '本地均价 ' + L.localAvg.toFixed(1) + ' 元' : '本地价格带：未知'}
            </span>
          </div>
          <div className="slider-wrap">
            <input
              type="range" id="p-slider" min={70} max={130} step={1}
              value={Math.round(g.priceMultiplier * 100)}
              onChange={(e) => dispatch({ type: 'SET_PRICE', mult: Number(e.target.value) / 100 })}
            />
            <div
              className="slider-mark" id="p-mark"
              style={{ display: priceFilled ? 'block' : 'none', left: markLeft + '%' }}
            />
          </div>
          <div className="slider-scale"><span>2.1</span><span>3.0</span><span>3.9</span></div>
        </div>

        <button
          className="skip-btn" id="b-skip" disabled={g.day === 1}
          onClick={() => dispatch({ type: 'SKIP' })}
        >
          {'今天不押 · 亏 ' + money(L.fixed) + ' 固定成本，去拿个数'}
        </button>
      </div>
      <div className="hint" id="hint">
        {g.day === 1
          ? '军师：今天先押 160，我给你打个样。'
          : '押注当场扣原料钱。区间内的档位 = 军师建议区间。'}
      </div>
    </>
  );
}
