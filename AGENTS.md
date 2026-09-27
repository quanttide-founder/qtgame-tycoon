# AGENTS

一、项目意图（一句话，定死的）
我在做串串摊题材的寓教于乐游戏（既好玩也有教学作用）。教学主题：AI能给流程和方法，但决定生死的数字必须自己去现实里拿。
这句话是最高优先级。这次对话最大的弯路（我劝你别做游戏去摆摊）就是因为它缺席。标注清楚：这是定死的，AI 不许质疑、不许建议你改方向。
二、项目定位和已锁定的决策
已定决策：核心体验是“拍脑袋会输、亲手拿数字会赢”，课程必须成为获胜的必要条件；页面走场景驱动（摊位居中、军师对话化），不走报表仪表盘。
每次方向被你确认过的结论都归到这里。没有这条，新对话的 AI 会把这些当成“待讨论的选项”重新提一遍，你已经锁定的东西会被反复动摇。
三、代码结构（2026-09-27 确认：React 重写，旧单文件方案作废）
游戏已从单文件 src/index.html 重写为 React + TypeScript（Vite 构建），原「单文件与多文件的拆分触发条件」整体作废。现行约束：
• index.html 是 Vite 入口（仓库根目录）；src/engine/ 是纯逻辑、按依赖方向分层：types（契约）→ constants（数据表）→ query（只读派生）→ mutate（状态变更）+ events（事件池）→ reducer（流转，AppState 三段结构 ui/game/pending，唯一提交点 commit()）；不依赖 DOM，可在 Node 里加载跑千局模拟；src/app/ 是页面与弹层组件，五页共享同一状态机（engine/reducer.ts）；
• 分层边界由 ESLint 强制：app/ 只许 import query/constants/types，引用 mutate/reducer/events 会被 no-restricted-imports 拦截；写操作一律 dispatch → reducer；
• file:// 直开不再可用：本地用 npm run dev，构建用 npm run build（产物 dist/）；
• 部署是构建产物多文件（index.html + 哈希 assets/）：assets 长缓存、入口 no-cache，deploy-site.yml 已配；
• 玩法与页面的锁定决策不变，仍以 docs/dev-guide/ 为准。
四、你这个人的偏好（写给 AI 看的工作方式说明）
• 不要替我做决策，不要质疑我的意图，只在框架内给方案
• 回答前先确认层级：我要的是意图层 / 全局结构 / 具体实现，没说清时先问我，不要猜
• 我说“看全盘”“不要细节”时，意思是禁止任何单点展开
• 纠偏时我只给结论不给理由，收到就立刻停，不用我重复第二遍
这几条是你这次用血泪换来的，也是最值得记的——它管的不只是这一个项目，是你和所有 AI 的协作方式。
