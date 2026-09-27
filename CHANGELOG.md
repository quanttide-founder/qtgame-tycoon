# Changelog

## [Unreleased]

### Added

- React + TypeScript 工程化：Vite 构建、ESLint（含 react-hooks 规则）、`tsc -b` 类型检查
- pre-commit 钩子：提交前自动运行 `eslint .` 与 `tsc -b`
- `npm run dev` / `build` / `preview` / `lint` / `typecheck` 脚本

### Changed

- 按远端最新单文件版本（押注 / 开奖玩法）重写为 React 应用，玩法、数值与五页交互不变：
  - 逻辑集中在 `src/game/`（纯逻辑，不依赖 DOM，可在 Node 中加载做数值模拟），渲染在 `src/ui/`
  - 部署改为构建产物 `dist/`（assets 长缓存、入口 no-cache）；`file://` 直开不再支持，本地改用 `npm run dev`

### Fixed

- 场景注释中押注数显示 `undefined`：原单文件 `renderScene` 误用 `r.bet`（`lastResult` 展开自 `stall`，字段实为 `amount`），由类型检查暴露后修正

### Removed

- `src/index.html` 单文件入口（内容已全部迁移，新旧路径映射见下表）

| 旧路径（src/index.html） | 新路径 |
|--------------------------|--------|
| HTML 结构（五页 + 弹层） | `index.html` + `src/ui/*.tsx` |
| 内联 CSS | `src/styles.css`（逐字节迁移） |
| 内联 JS（游戏逻辑） | `src/game/*.ts`（常量 / 引擎 / 事件 / reducer） |
| 内联 JS（渲染与交互） | `src/App.tsx` + `src/ui/*.tsx` |

## [0.0.1] - 2026-04-30

### Added

- 初始项目结构和游戏入口 `src/index.html`
- README 文档和 src 目录结构调整
- GitHub Pages CI/CD 配置

### Fixed

- 修复 Pages 部署路径为 `./src`
