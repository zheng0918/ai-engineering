# project-structure — 项目骨架生成技能

> 本技能根据 `rule.md` 约束生成 Vue 3 + Vite + Element Plus 项目骨架。

---

## 初始化命令

```bash
# Vue 3（默认推荐）
pnpm create vite my-app --template vue-ts
cd my-app
pnpm add vue-router@4 pinia element-plus axios
pnpm add -D sass @types/node unplugin-auto-import unplugin-vue-components

# React（备选）
pnpm create vite my-app --template react-ts
cd my-app
pnpm add react-router-dom zustand antd axios
pnpm add -D sass @types/node
```

---

## vite.config.ts（Vue 3）

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;`,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8200',
        changeOrigin: true,
      },
    },
  },
});
```

---

## main.ts（Vue 3 入口）

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import '@/styles/global.scss';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount('#app');
```

---

## App.vue

```vue
<template>
  <router-view />
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/app';

const appStore = useAppStore();
appStore.init();
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100vh;
}
</style>
```

---

## .env.development

```bash
VITE_API_BASE = http://localhost:8200
VITE_APP_TITLE = 管理后台(Dev)
```

## .env.production

```bash
VITE_API_BASE = https://api.example.com
VITE_APP_TITLE = 管理后台
```
