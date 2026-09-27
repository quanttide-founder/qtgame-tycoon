# qtgame-tycoon

滁州夜市 · 串串摊 — 28 天摆摊经营小游戏。

教学主题：AI 能给流程和方法，但决定生死的数字必须自己去现实里拿。

## 快速开始

```bash
npm install   # 首次克隆后执行，安装依赖并启用 husky 钩子
npm run dev   # 本地开发
npm run build # 类型检查 + 构建，产物在 dist/
```

## 玩法概要

- 28 天、日均 150 签的经营目标，现金见底即收摊
- 每天押一注、每晚开奖：四档押注（80/120/160/200）加定价滑杆，开出的需求由天气、日历与实测数据共同决定
- 今天不押也可以：花一天探店或盲测，把军师的猜测换成实测
- 周日结算预测误差、备货准确率与断货次数，误差条随亲手拿到的数字收窄
- 五页场景驱动：开场、主场景、周结算、结局、复盘

## 项目结构

```
index.html       # Vite 入口（根目录）
src/
  main.tsx       # React 挂载入口
  App.tsx        # 五页状态机与押注/开奖流转
  styles.css     # 全局样式（原单文件 CSS 逐字节迁移）
  game/          # 纯游戏逻辑（常量、引擎、事件、reducer），不依赖 DOM，可在 Node 中加载做数值模拟
  ui/            # 页面与弹层组件
docs/            # 开发文档（玩法、页面设计）
.github/         # CI/CD
```

## 代码质量

pre-commit 钩子在每次提交前运行 ESLint 与 TypeScript 类型检查：

```bash
npm run lint       # ESLint 全量检查
npm run typecheck  # tsc -b 类型检查
npm run build      # 构建验证
```

## 技术栈

React 19 + TypeScript + Vite，运行时仅 React；开发期工具：ESLint、typescript-eslint、eslint-plugin-react-hooks、husky。
