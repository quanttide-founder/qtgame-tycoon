export default function OpeningPage({ onStart }: { onStart: () => void }) {
  return (
    <section className="page on" id="pg-open">
      <div className="silhouette">
        <div className="pot" style={{ bottom: 76, left: '34%' }} />
        <div className="steam" style={{ bottom: 120, left: '36%' }}><i /><i /><i /></div>
        <div className="skewers" style={{ bottom: 78, right: '30%' }} />
        <div className="table" style={{ bottom: 20, left: '14%', right: '14%' }} />
      </div>
      <h1>滁州夜市 · 串串摊</h1>
      <div className="place">开 张</div>
      <p>你揣着 2 万块，想在夜市摆个串串摊。</p>
      <p>28 天，日均 150 签，做到就站稳了。</p>
      <p>每天你押一注，每晚夜市开奖。</p>
      <p>一个 AI 军师和一个老摊主说要帮你。</p>
      <div className="risk">现金见底就收摊。开局明示，没有退路。</div>
      <button className="primary" id="b-start" onClick={onStart}>出摊</button>
    </section>
  );
}
