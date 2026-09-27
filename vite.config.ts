import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base 用相对路径：产物同时服务于 OSS 自定义域名根路径与 GitHub Pages 子路径
export default defineConfig({
  plugins: [react()],
  base: "./",
});
