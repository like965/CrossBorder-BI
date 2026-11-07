import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages 项目站点路径形如 https://<user>.github.io/<repo>/
 * base: './' 让 index.html 中的 JS/CSS 与 public/data/*.csv 全部使用相对路径，
 * 无需把仓库名硬编码进配置；对用户名站点（根路径）同样适用。
 * 前提：当前应用用 state 切换五个页面，不使用 history 路由，也不会产生更深的 URL 层级。
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // V1 面向现代桌面浏览器
    target: 'esnext',
    minify: true,
    // 使用 Vite 默认的 emptyOutDir=true：每次构建自动清空 dist，避免旧 hash 产物累积
  },
});
