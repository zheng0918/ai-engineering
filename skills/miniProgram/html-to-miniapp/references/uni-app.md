# uni-app 参考

将 HTML 原型转换为 uni-app 时使用本参考。uni-app 基于 Vue 规范，一套代码编译到微信小程序、H5、App（iOS/Android）、支付宝/百度/抖音小程序等多个平台。

---

## 文件结构

### 标准项目骨架

```
project/
├── pages/                      # 业务页面目录
│   └── home/
│       └── home.vue            # 单文件页面（template + script + style）
├── components/                  # 公共组件（easycom 自动引入）
├── static/                      # 静态资源（图片、字体等）
├── uni_modules/                 # uni_module 规范插件
├── utils/
│   ├── mock.js                  # Mock 数据集中管理
│   └── util.js                  # 工具函数
├── store/                       # Vuex/Pinia 状态管理
├── App.vue                      # 应用配置（全局样式 + 应用生命周期）
├── main.js                      # Vue 初始化入口
├── manifest.json                # 应用名称、appid、版本、权限等配置
├── pages.json                   # 页面路由、导航栏、TabBar 配置
└── uni.scss                     # 内置常用样式变量
```

### 页面文件规范

每个页面是一个符合 **Vue SFC 规范** 的 `.vue` 文件：

```vue
<template>
  <view class="page">
    <!-- 模板内容 -->
  </view>
</template>

<script>
export default {
  data() { return {} },
  onLoad(options) { /* 接收页面参数 */ },
  methods: { /* 事件方法 */ }
}
</script>

<style scoped>
.page { /* 页面样式 */ }
</style>
```

- **Vue2**：`<template>` 二级节点只能有一个（通常 `<view>` 根）
- **Vue3**：可以有多个二级节点
- 使用 `<template/>`（推荐）或 `<block/>` 做条件/列表渲染包装，它们不渲染为实际 DOM

### easycom 组件规范

组件放在 `components/` 或 `uni_modules/` 下，满足 `组件名称/组件名称.vue` 结构即可**自动引入**，无需手动 import 和注册。标签名首字母大写。

---

## 一、标签映射

### 基础组件对照表

| HTML 标签 | uni-app 组件 | 说明 |
|---|---|---|
| `<div>` `<section>` `<main>` `<article>` `<aside>` `<header>` `<footer>` `<nav>` | `<view>` | 通用容器 |
| `<span>` `<p>` `<b>` `<strong>` `<em>` `<i>` `<s>` `<small>` `<label>` | `<text>` | 文本必须包在 text 中；不可嵌套块级元素 |
| `<h1>`~`<h6>` | `<view>` + 样式 | 需自定义字体大小 |
| `<img>` | `<image>` | 必须设宽高；常用 mode：`aspectFill`、`widthFix`、`aspectFit`、`scaleToFill` |
| `<a href>` | `<navigator>` / `@tap` | 动作型链接改为 `@tap` 事件 |
| `<ul>` `<ol>` `<li>` | `<view>` + `v-for` | 自行实现样式 |
| `<table>` `<thead>` `<tbody>` `<tr>` `<td>` `<th>` | `<view>` + Flex/Grid | 表格标签不自动映射，用 view 模拟 |
| `<input>` | `<input>` | 事件名变化，type 属性行为与 Web 不同 |
| `<textarea>` | `<textarea>` | 原生组件，层级最高 |
| `<select>` | `<picker>` | 选择器组件 |
| `<button>` | `<button>` | 小程序端有默认样式 |
| `<form>` | `<form>` | `@submit` 事件 |
| `<svg>` | 不支持 | 小程序端不支持 SVG 标签；用 base64 `<image>` 或图标替代方案 |
| 轮播图（JS 库） | `<swiper>` + `<swiper-item>` | 内置轮播，支持自动播放、循环、指示器 |
| `<video>` | `<video>` | 原生组件，需用 `<cover-view>` 覆盖 |
| `<audio>` | `<audio>` / `uni.createInnerAudioContext` | 推荐 API 方式 |
| `<input type="radio">` | `<radio-group>` + `<radio>` | 单选框 |
| `<input type="checkbox">` | `<checkbox-group>` + `<checkbox>` | 多选框 |
| toggle / switch | `<switch>` | 开关组件 |
| `<input type="range">` | `<slider>` | 滑块组件 |
| `<iframe>` | `<web-view>` | 承载网页容器 |
| `<canvas>` | `<canvas>` | 画布组件 |
| `<progress>` | `<progress>` | 进度条 |
| 滚动容器 | `<scroll-view>` | 必须设固定高度；支持横向滚动 |
| 覆盖原生浮层 | `<cover-view>` `<cover-image>` | 覆盖 video/map 等原生组件 |
| 可拖动区域 | `<movable-area>` + `<movable-view>` | |
| 富文本 HTML | `<rich-text :nodes="htmlNodes" />` | 支持部分 HTML 标签渲染 |

### 扩展组件（uni-ui）

常用组件包括：`<uni-badge>` 角标、`<uni-card>` 卡片、`<uni-collapse>` 折叠面板、`<uni-drawer>` 抽屉、`<uni-fab>` 悬浮按钮、`<uni-icons>` 图标、`<uni-list>` 列表、`<uni-nav-bar>` 自定义导航栏、`<uni-popup>` 弹出层、`<uni-search-bar>` 搜索栏、`<uni-steps>` 步骤条。

其他常用 uni-ui 组件：

| 组件 | 标签 | 用途 |
|------|------|------|
| 分段器 | `<uni-segmented-control>` | 视图切换，比 Tabs 更轻量 |
| 分页器 | `<uni-pagination>` | 数据列表分页 |
| 数据选择器 | `<uni-data-select>` | 下拉选择，比 `<picker>` 更接近 Web 体验 |
| 评分 | `<uni-rate>` | 星级评分 |
| 标签 | `<uni-tag>` | 标签/徽标 |
| 骨架屏 | 自定义或社区方案 | uni-ui 无内置，推荐 CSS 动画实现 |

---

## 二、事件映射

| Web 事件 | uni-app 事件 | 说明 |
|---|---|---|
| `onClick` | `@tap` | 点击事件（推荐） |
| `onClick`（阻止冒泡） | `@tap.stop` | |
| `onChange`（input） | `@input` | 输入框值变化 |
| `onChange`（picker/switch/slider） | `@change` | 选择器/开关值变化 |
| `onSubmit` | `@submit` | 表单提交 |
| `onFocus` | `@focus` | 获取焦点 |
| `onBlur` | `@blur` | 失去焦点 |
| `onScroll` | `@scroll` | scroll-view 滚动 |
| 长按 | `@longpress` | 超过 350ms 触发 |
| `onTouchStart` | `@touchstart` | |
| `onTouchMove` | `@touchmove` | |
| `onTouchEnd` | `@touchend` | |
| `onLoad`（img） | `@load` | 图片加载完成 |
| `onError`（img） | `@error` | 图片加载失败 |

### 属性映射

| Web 属性 | uni-app 属性 | 说明 |
|---|---|---|
| `className` | `class` | 标准 Vue |
| `style={{}}` | `:style` | 动态样式绑定 |
| `dangerouslySetInnerHTML` | `<rich-text :nodes>` | 富文本渲染 |
| `v-show` / `hidden` | `v-show` / `hidden` | uni-app 中 `v-show` 不支持 nvue |
| `data-*` | `data-*` | 通过 `e.currentTarget.dataset` 获取 |

---

## 三、路由与导航

| Web 路由方式 | uni-app | 说明 |
|---|---|---|
| React Router / Vue Router | `pages.json` 的 `pages` 注册 | |
| `<a href>` 跳转 | `<navigator url="">` | 组件方式 |
| Tab 切换 | `uni.switchTab({ url })` | Tab 间必须用 switchTab |
| 页面跳转 | `uni.navigateTo({ url })` | 新页面入栈 |
| 页面重定向 | `uni.redirectTo({ url })` | 当前页出栈，新页入栈 |
| 重启应用 | `uni.reLaunch({ url })` | 清空页面栈，打开新页 |
| 返回上一页 | `uni.navigateBack({ delta })` | delta 为返回层数 |
| 参数传递 | `onLoad(options)` 接收 | query string 形式 |

> [!WARNING]
> - `navigateTo` / `redirectTo` 只能打开**非 TabBar 页面**
> - `switchTab` 只能打开 **TabBar 页面**
> - 页面栈最多 **10 层**，超限用 `redirectTo` 或 `reLaunch`
> - 不能在首页 `onReady` 之前进行页面跳转
> - H5 端 `uni.switchTab` 可能静默失败，需用 `uni.reLaunch` 代替

---

## 四、样式转换

### 4.1 单位转换

| 单位 | 说明 |
|---|---|
| `rpx`（推荐） | 响应式 px，以 750px 宽屏幕为基准自动适配。**1px（设计稿）= 1rpx**（设计稿 750px 基准） |
| `px` | 固定像素。border 保留 `1px`；与系统 API 配合的尺寸用 px |
| `upx` | 旧版单位，已废弃，统一用 `rpx` |

**PostCSS 自动转换**（配合 `postcss-px2rpx-transform`）：
```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-px2rpx-transform')({
      platform: 'weapp',
      designWidth: 750,
    }),
  ],
}
```

### 4.2 选择器兼容性

| 选择器 | 小程序端 | H5/App 端 |
|---|---|---|
| 类选择器 `.class` | 支持 | 支持 |
| ID 选择器 `#id` | 支持 | 支持 |
| 后代选择器 `.a .b` | 支持 | 支持 |
| 子选择器 `.a > .b` | 支持 | 支持 |
| 伪类 `:active` `:first-child` `:last-child` `:nth-child` | 支持 | 支持 |
| 伪元素 `::before` `::after` | 支持 | 支持 |
| `:deep(.class)` (Vue3) / `::v-deep` (Vue2) | 支持 | 支持 穿透 scoped |
| 标签选择器 (`div {}`) | 部分支持，编译后可用 | 支持 |
| `*` 通配符 | 不支持，部分端 | 支持 |
| 属性选择器 `[attr]` | 不支持，部分端 | 支持 |
| `gap`（Flex gap） | 部分支持，部分端不支持 | 支持，用 margin + `:not(:last-child)` 替代 |
| `backdrop-filter` | 不支持，小程序不支持 | 支持，H5 支持 |

### 4.3 布局属性

| 属性 | 支持 | 说明 |
|---|---|---|
| `display: flex` 全系列 | 支持 | **首选布局方式** |
| `display: grid` | 部分支持 | 部分端不支持，H5 全支持 |
| `float` | 部分支持 | 支持但 Flex 容器内失效 |
| `position: fixed` | 部分支持 | 父元素有 `transform` 时失效 |
| `position: sticky` | 部分支持 | 多端行为不一致 |
| `overflow: scroll` | 部分支持 | 推荐用 `<scroll-view>` |

### 4.4 CSS 变量

- 在 `App.vue` 的全局样式中定义（小程序端 `:root` 不生效）
- Scoped 样式中使用 `v-bind()` (Vue3) 绑定 JS 变量

```css
/* App.vue */
page {
  --color-primary: #3b82f6;
  --color-bg: #f8fafc;
}
```

### 4.5 nvue 样式特殊限制（App 原生渲染）

- 只能用 **flex 布局**（默认竖排 column），不支持其他布局
- 文字必须写在 `<text>` 组件内；字体大小/颜色只能在 `<text>` 上设置
- 不支持百分比、媒体查询、背景图（用 `<image>` + 层级模拟）
- 仅支持 **class 选择器**；`:class` 绑定仅支持**数组语法**
- 不支持 `v-show`，只能用 `v-if`
- Android 端大量圆角边框影响性能

### 4.6 条件编译处理样式差异

```css
/* 仅小程序端生效 */
/* #ifdef MP-WEIXIN */
.box { padding: 40rpx; }
/* #endif */

/* 仅 H5 端生效 */
/* #ifdef H5 */
.box { padding: 20px; }
/* #endif */
```

### 4.7 Tailwind CSS 迁移

使用 `@uni-helper/unocss-preset-uni` 或 `weapp-tailwindcss` 可实现 Tailwind 在 uni-app 中运行：
- 自动将 `px` 转为 `rpx`
- 过滤不支持的 CSS 属性
- 需要配置 PostCSS 和构建插件

---

## 五、生命周期

### 应用生命周期（App.vue）

| 函数 | 说明 |
|---|---|
| `onLaunch` | 应用初始化（全局只触发一次） |
| `onShow` | 应用启动/从后台进入前台 |
| `onHide` | 应用从前台进入后台 |
| `onError` | 报错时触发 |

### 页面生命周期

| 函数 | 说明 | 关键时序 |
|---|---|---|
| `onLoad(options)` | 页面加载，接收传参 | ① 执行。适合接收参数、网络请求 |
| `onShow` | 页面显示（每次出现都触发） | ② 执行。适合刷新数据 |
| `onReady` | 页面初次渲染完成 | ③ 执行。DOM 可用，可操作节点 |
| `onHide` | 页面隐藏 | 切后台 / 跳转到其他页 |
| `onUnload` | 页面卸载 | 页面关闭时 |
| `onPullDownRefresh` | 下拉刷新 | 需在 pages.json 中启用 |
| `onReachBottom` | 滚动到底部 | `scroll-view` 的触底不会触发此事件 |
| `onPageScroll` | 页面滚动（nvue 不支持） | 参数 `{ scrollTop }` |
| `onBackPress` | 返回事件 | 不可用 async |
| `onTabItemTap` | 点击 Tab 时触发 | |
| `onResize` | 窗口尺寸变化 | App、微信/快手小程序 |

> [!TIP]
> - `onLoad` 适合初始化数据；`onShow` 适合刷新数据（TabBar 切换回来时会再次触发）
> - 不要在 `onReady` 里联网（太慢），在 `onLoad` 里联网
> - `onLoad` 中避免大量同步耗时运算（会卡住页面动画）
> - 页面返回时自动关闭 loading/toast，但不会关闭 modal/actionSheet

### 组件生命周期（Vue 标准）

`beforeCreate` → `created` → `beforeMount` → `mounted` → `beforeUpdate` → `updated` → `beforeUnmount` → `unmounted`

---

## 六、数据与逻辑

| Web 概念 | uni-app 对应 |
|---|---|
| `useState` / `data()` | `data() { return {} }` |
| `setState` / 赋值 | 直接赋值（Vue 响应式）；或 `this.$set` |
| `useEffect` / `mounted` | `onLoad()` / `mounted()` |
| `props` | `props` |
| `context` / `provide` | `getApp().globalData` / Vuex / Pinia |
| `fetch` / `axios` | Mock 数据直接引入（不实现真实请求） |
| `localStorage` | `uni.setStorageSync()` / `getStorageSync()` |
| 条件渲染 `{cond && <X/>}` | `v-if` / `v-show` |
| 列表渲染 `.map()` | `v-for="item in list" :key="item.id"` |
| 模板字符串 | `{{ }}` 插值 |
| 事件总线 | `uni.$emit` / `uni.$on` / `uni.$off` |

### 页面通讯

```javascript
// 全局事件
uni.$emit('updateData', { key: 'value' })
uni.$on('updateData', (data) => { /* ... */ })
// 记得在 onUnload 中 uni.$off 移除监听

// 获取页面栈
const pages = getCurrentPages()
const prevPage = pages[pages.length - 2]  // 上一页

// 全局数据
const app = getApp()
app.globalData.userInfo = { name: 'test' }
```

---

## 七、Mock 数据管理

```javascript
// utils/mock.js
const homeData = {
  banners: [ /* ... */ ],
  categories: [ /* ... */ ],
}
const detailData = { /* ... */ }

export default { homeData, detailData }
```

```vue
<!-- pages/home/home.vue -->
<script>
import mock from '@/utils/mock.js'
export default {
  data() { return { banners: [] } },
  onLoad() {
    this.banners = mock.homeData.banners
  }
}
</script>
```

---

## 八、图标处理方案

### 方案 A：Lucide Base64 内联（快速原型）

同原生小程序方案，使用 Lucide SVG → base64 Data URI + `<image>` 标签引用，详见 [native-mini-program.md 方案 A](./native-mini-program.md#方案-alucide-base64-内联图标推荐快速原型)。

### 方案 B：uni-icons（推荐）

```vue
<uni-icons type="home" size="24" color="#666"></uni-icons>
```

### 方案 C：Base64 内联图片（全端兼容）

```html
<image src="data:image/svg+xml;base64,PHN2Zy..."></image>
```

### 方案 D：Iconfont 字体图标

- 小程序端不支持外部字体文件，需转 base64 引入
- H5/App 端可直接 `@import` iconfont.css

### 各端图标支持总结

| 方案 | 微信小程序 | H5 | App |
|------|:---:|:---:|:---:|
| Lucide Base64 内联 | 支持 | 支持 | 支持 |
| uni-icons | 支持 | 支持 | 支持 |
| Base64 image | 支持 | 支持 | 支持 |
| Iconfont | 部分支持，需 base64 | 支持 | 支持 |
| SVG | 不支持 | 支持 | 支持 |
| 本地 PNG | 支持 | 支持 | 支持 |

---

## 九、自定义 TabBar

### 配置步骤

1. `pages.json` 中设置 `"tabBar": { "custom": true, "list": [...] }`
   - 即使 `custom: true`，`list` 仍需完整配置（框架要求，数组不能为空）

2. 使用完全自定义 Vue 组件（推荐 Vuex 管理选中态）：
   ```vue
   <!-- components/custom-tabbar.vue -->
   <template>
     <view class="tabbar" :style="{ paddingBottom: safeAreaBottom + 'px' }">
       <view v-for="(item, idx) in tabs" :key="idx"
         class="tab-item" @tap="switchTab(idx)">
         <image :src="current === idx ? item.selectedIcon : item.icon" />
         <text :class="{ active: current === idx }">{{ item.text }}</text>
       </view>
     </view>
   </template>
   ```

3. **每个 Tab 页面**的 `onShow` 中更新选中态（通过 Vuex commit）

### 常见陷阱

- **H5 端**：`uni.switchTab` 可能静默失败，用 `uni.reLaunch` 代替
- **微信小程序端**：`custom-tab-bar/` 目录必须放在项目根目录（与 `pages/` 同级），且使用原生格式（`.wxml/.wxss/.js/.json`），不是 `.vue`
- **安全区域**：必须加 `padding-bottom: env(safe-area-inset-bottom)`
- **首次闪烁**：在 `App.vue` 的 `onLaunch` 中从 Storage 恢复状态

---

## 十、自定义导航栏

```vue
<!-- pages.json 中页面配置 -->
{ "path": "pages/detail/detail", "style": { "navigationStyle": "custom" } }
```

```vue
<template>
  <view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <text class="nav-title">页面标题</text>
    </view>
  </view>
</template>
<script>
export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,  // 默认高度
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    // 胶囊按钮信息（仅微信小程序）
    // #ifdef MP-WEIXIN
    const menuButton = uni.getMenuButtonBoundingClientRect()
    this.navBarHeight = (menuButton.top - systemInfo.statusBarHeight) * 2 + menuButton.height
    // #endif
  }
}
</script>
```

---

## 十一、富文本边界

- 文章正文/协议/CMS 内容：用 `<rich-text :nodes="nodes" />` 渲染 HTML 字符串
- 图片 URL 补全为绝对路径，处理 `width: 100%` 适配
- 高保真页面原型：**不要整页塞进富文本**，拆成 Vue 页面和组件

---

## 十二、条件编译

```javascript
// #ifdef MP-WEIXIN
// 仅微信小程序执行
// #endif

// #ifndef H5
// 除 H5 外所有平台执行
// #endif

// #ifdef H5 || MP-WEIXIN
// H5 或微信小程序
// #endif
```

可用于 JS、CSS、template 中。常用平台标识：`APP-PLUS`（App）、`H5`、`MP-WEIXIN`（微信小程序）、`MP-ALIPAY`、`MP-BAIDU`、`MP-TOUTIAO`。

---

## 十三、常见陷阱

1. **文本必须包在 `<text>` 中**：`<view>` 中直接写文字，样式可能不生效
2. **`<image>` 必须设宽高**：否则默认尺寸不可预期
3. **`<scroll-view>` 必须设固定高度**：否则无法滚动
4. **小程序端不支持 SVG**：图标用 `<image>` 或 base64
5. **小程序端 `backdrop-filter` 不支持**：用半透明背景替代
6. **`gap`（Flex gap）部分端不支持**：用 margin + `:not(:last-child)` 替代
7. **H5 端 `uni.switchTab` 可能静默失败**：改用 `uni.reLaunch`
8. **TabBar `custom: true` 时 `list` 不能为空**：保留完整配置
9. **`onReachBottom` 与 `scroll-view` 冲突**：使用 scroll-view 时页面级触底失效
10. **nvue 仅支持 class 选择器和 flex 布局**：回退方案见 4.5 节
11. **内联样式中的 `px`** 不会被 PostCSS 自动转换：手动写 `rpx` 或用 `uni.upx2px()`
12. **页面栈 10 层限制**：深层跳转用 `redirectTo` 或 `reLaunch`
13. **`position: fixed` 在父元素有 `transform` 时失效**：移到根层级
14. **微信小程序自定义 TabBar 必须用原生格式**：`.vue` 文件不生效
15. **`onLoad` 和 `onShow` 的执行时机**：TabBar 切换时不触发 `onLoad`，只触发 `onShow`

---

## 十四、验证 checklist

完成转换后，按以下清单逐项验证：

### 页面完整性
- [ ] 每个页面文件存在且路径在 `pages.json` 注册
- [ ] TabBar 页面配置正确（含 `custom: true` 时 `list` 不为空）

### 路由
- [ ] TabBar 页面用 `switchTab`，非 TabBar 用 `navigateTo`
- [ ] 页面返回正常（`navigateBack`）
- [ ] 参数传递正确（`onLoad(options)` 接收）
- [ ] H5 端路由不静默失败

### 样式
- [ ] CSS 变量在 `page {}`（非 `:root`）中定义
- [ ] rpx 单位使用正确（设计稿 750px 基准 1:1）
- [ ] 不支持的选择器/属性已替换
- [ ] 条件编译处理了平台差异样式
- [ ] nvue 页面仅使用 flex 布局 + class 选择器

### 图标
- [ ] 小程序端 SVG 已替换为 base64/uni-icons/PNG
- [ ] 图标在各端显示正常

### 交互
- [ ] 简单交互（跳转、切换、提醒）正常工作
- [ ] 业务逻辑部分已用 Toast 占位
- [ ] Mock 数据正确显示
- [ ] 事件绑定正确（`@tap` 非 `@click`）

### 数据
- [ ] `utils/mock.js` 包含所有页面数据
- [ ] 各页面数据引用路径正确
- [ ] Vuex/Pinia（如有）状态管理正确

### 多端
- [ ] 条件编译标签正确
- [ ] 至少测试了微信小程序 + H5 两端
