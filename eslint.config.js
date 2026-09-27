import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", ".husky/_/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 页面与引擎均不允许遗留调试输出（警告不拦截提交，仅提示）
      "no-console": "warn",
    },
    languageOptions: { globals: globals.browser },
  },
  {
    // 分层边界（机器强制）：ui 只许读 query/constants/types；
    // 写操作（mutate）、流转（reducer）、事件池（events）只能在 game 层内部使用
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/game/mutate", "**/game/reducer", "**/game/events"],
          message: "ui 层禁止引用变更/流转/事件层：读用 query、constants、types，写只能 dispatch → reducer。",
        }],
      }],
    },
  },
);
