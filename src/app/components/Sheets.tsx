import type { ReactNode } from 'react';
import { GAPS } from '../../engine/constants';
import { money, unc } from '../../engine/query';
import type { GameData } from '../../engine/types';
import Row from './Row';
import type { UiProps } from '../props';

function ledgerBody(g: GameData): ReactNode {
  const net = g.cum.rev - g.cum.cost;
  return (
    <>
      <Row label="累计流水" value={money(g.cum.rev)} />
      <Row label="累计经营成本" value={money(g.cum.cost)} />
      <Row label="累计净赚" value={money(net)} />
      <Row label="行动支出" value={money(g.cum.act)} />
      <Row label="事件与罚息" value={money(g.cum.event)} />
      <div className="srow total">
        <span>现金</span>
        <span className="num">{money(g.cash)}</span>
      </div>
      <div className="logs">
        {g.logs.slice(0, 8).map((l, i) => (
          <div key={i} className={'log ' + l.cls}>
            <span>{'D' + l.day}</span>
            {l.text}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Sheets({ state, dispatch }: UiProps) {
  const g = state.game;
  return (
    <>
      <div className={'sheet' + (state.ui.sheet === 'ledger' ? ' on' : '')} id="sh-ledger">
        <h3>账本 <button onClick={() => dispatch({ type: 'CLOSE_SHEET' })}>收起</button></h3>
        <div id="ld-body">{ledgerBody(g)}</div>
      </div>
      <div className={'sheet' + (state.ui.sheet === 'gaps' ? ' on' : '')} id="sh-gaps">
        <h3>缺口 <button onClick={() => dispatch({ type: 'CLOSE_SHEET' })}>收起</button></h3>
        <div id="gp-body">
          {GAPS.map((x) => {
            const gp = g.gaps[x.key];
            let right: ReactNode;
            if (gp.filled) right = <span className="ok">{gp.val}</span>;
            else if (x.src === '自动') right = <span className="mut">第一周结算回填</span>;
            else right = <span className="mut">{x.src}</span>;
            const st = gp.filled
              ? '已实测'
              : x.src === '自动'
                ? '待回填'
                : '军师在猜 · 影响预测 ±' + unc(g) + '%';
            return (
              <div className="grow" key={x.key}>
                <div><b>{x.label}</b><small className="mut">{st}</small></div>
                {right}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
