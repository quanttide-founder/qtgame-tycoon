import { useState } from 'react';
import { BLIND_CRIT, BLIND_NAMES, L } from '../game/constants';
import { canBet, money } from '../game/query';
import type { BlindScores } from '../game/types';
import type { UiProps } from './props';

export default function BlindTest({ state, dispatch }: UiProps) {
  const [scores, setScores] = useState<BlindScores>({});
  const [msg, setMsg] = useState('五款全部打完才能提交。');

  const pick = (n: string, c: string, v: number) =>
    setScores((s) => ({ ...s, [n]: { ...s[n], [c]: v } }));

  const submit = () => {
    if (!BLIND_NAMES.every((n) => BLIND_CRIT.every((c) => scores[n]?.[c]))) {
      setMsg('还有款没打完分。');
      return;
    }
    if (!canBet(state.game)) return;
    dispatch({ type: 'BLIND_SUBMIT', scores });
  };

  return (
    <>
      <h3>底料盲测</h3>
      <p className="tag">{'花 ' + money(L.blind) + '，今天不出摊。五款编号，三个维度各打 1–5 分。'}</p>
      <table>
        <tbody>
          <tr>
            <th>编号</th>
            {BLIND_CRIT.map((c) => <th key={c}>{c}</th>)}
            <th>合计</th>
          </tr>
          {BLIND_NAMES.map((n) => {
            const done = BLIND_CRIT.every((c) => scores[n]?.[c]);
            const sum = BLIND_CRIT.reduce((a, c) => a + (scores[n]?.[c] ?? 0), 0);
            return (
              <tr key={n}>
                <td><b>{n}</b></td>
                {BLIND_CRIT.map((c) => (
                  <td key={c}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={'vbtn' + (scores[n]?.[c] === v ? ' on' : '')}
                        onClick={() => pick(n, c, v)}
                      >
                        {v}
                      </button>
                    ))}
                  </td>
                ))}
                <td id={'sum-' + n}>{done ? sum + ' / 15' : '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="tag" id="blind-msg">{msg}</p>
      <div className="acts">
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>放弃</button>
        <button className="primary" onClick={submit}>提交评分</button>
      </div>
    </>
  );
}
