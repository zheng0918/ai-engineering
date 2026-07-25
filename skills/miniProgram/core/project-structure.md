# project-structure — 小程序项目骨架生成技能

> 本技能根据 `rule.md` 约束生成 uniapp/taro 项目骨架。

---

## 触发条件

"创建小程序项目"、"初始化 uniapp 项目"、"初始化 taro 项目"

---

## 生成流程

### 1. 确认框架

```
uniapp（Vue 3 + Pinia + uView Plus）    ← 默认推荐
taro（React 18 + Zustand + NutUI）
```

### 2. 初始化命令

```bash
# uniapp
npx degit dcloudio/uni-preset-vue#vite-ts my-app
cd my-app && npm install

# taro
npx @tarojs/cli init my-app
# 选择：React + TypeScript + SCSS
```

### 3. 安装必须依赖

```bash
# uniapp
npm install pinia uview-plus

# taro
npm install zustand @nutui/nutui-react-taro
```

### 4. 创建目录与基础文件

按 `rule.md` 包结构创建所有目录和入口文件。

---

## 核心文件模板

### pages.json（uniapp）

```json
{
  "pages": [
    {
      "path": "pages/tab/home/index",
      "style": { "navigationBarTitleText": "首页" }
    },
    {
      "path": "pages/tab/category/index",
      "style": { "navigationBarTitleText": "分类" }
    }
  ],
  "subPackages": [
    {
      "root": "pages/goods",
      "pages": [
        { "path": "detail/index", "style": { "navigationBarTitleText": "商品详情" } }
      ]
    }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/tab/home/index", "text": "首页", "iconPath": "...", "selectedIconPath": "..." }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "我的应用",
    "backgroundColor": "#F8F8F8"
  }
}
```

### app.config.ts（taro）

```ts
export default defineAppConfig({
  pages: [
    'pages/tab/home/index',
    'pages/tab/category/index',
  ],
  subPackages: [
    {
      root: 'pages/goods',
      pages: ['detail/index'],
    },
  ],
  tabBar: {
    list: [
      { pagePath: 'pages/tab/home/index', text: '首页' },
    ],
  },
  window: {
    navigationBarTitleText: '我的应用',
    backgroundColor: '#F8F8F8',
  },
});
```

### main.ts（uniapp 入口）

```ts
import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import uviewPlus from 'uview-plus';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(uviewPlus);
  return { app, pinia };
}
```

### App.vue（uniapp 入口组件）

```vue
<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('小程序启动');
});

onShow(() => {
  console.log('小程序显示');
});
</script>

<style lang="scss">
@import 'uview-plus/index.scss';
@import '@/styles/variables.scss';
@import '@/styles/global.scss';
</style>
```

### 全局 SCSS 变量（styles/variables.scss）

```scss
// 主题色
$primary-color: #1989fa;
$success-color: #07c160;
$warning-color: #ff976a;
$danger-color: #ee0a24;

// 文字色
$text-color: #323233;
$text-color-light: #969799;
$text-color-placeholder: #c8c9cc;

// 背景色
$bg-color: #f7f8fa;
$bg-color-white: #ffffff;

// 字号
$font-size-xs: 20rpx;
$font-size-sm: 24rpx;
$font-size-md: 28rpx;
$font-size-lg: 32rpx;
$font-size-xl: 36rpx;

// 间距
$padding-xs: 8rpx;
$padding-sm: 16rpx;
$padding-md: 24rpx;
$padding-lg: 32rpx;

// 圆角
$border-radius-sm: 8rpx;
$border-radius-md: 12rpx;
$border-radius-lg: 16rpx;
```
