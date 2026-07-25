# Taro 参考

将 HTML 原型转换为 Taro 时使用本参考。Taro 是一个开放式跨端框架，支持使用 React/Vue/Nerv 等框架开发微信小程序、H5、React Native 等多端应用。Taro 3.x 是当前主力版本。

---

## 文件结构

### 标准项目骨架

```
project/
├── src/
│   ├── pages/                    # 业务页面目录
│   │   └── home/
│   │       ├── index.tsx          # 页面组件
│   │       ├── index.module.scss  # 页面样式（CSS Modules 推荐）
│   │       └── index.config.ts    # 页面级配置
│   ├── components/                # 公共组件
│   ├── assets/                    # 静态资源
│   ├── utils/
│   │   ├── mock.ts                # Mock 数据集中管理
│   │   └── util.ts                # 工具函数
│   ├── store/                     # Redux / Zustand 状态管理
│   ├── app.config.ts              # 应用级配置（页面注册 + TabBar + window）
│   ├── app.ts                     # 入口组件
│   ├── app.scss                   # 全局样式
│   └── index.html                 # H5 入口 HTML
├── config/
│   └── index.ts                   # Taro 构建配置（designWidth、插件等）
├── custom-tab-bar/                # 自定义 TabBar（需原生格式组件声明）
└── package.json
```

---

## 一、React vs Vue — 选择与差异

Taro 同时支持 React 和 Vue。选择取决于原型源码风格。

| 维度 | React | Vue（Taro 3.x） |
|------|-------|------|
| 组件引入 | 需显式 import，大驼峰 | 无需引入，kebab-case 小写标签 |
| 组件名 | `<SwiperItem>` | `<swiper-item>` |
| 属性名 | `indicatorColor` | `indicator-color` |
| 事件绑定 | `onClick` | `@tap` |
| Boolean 属性 | 直接写 `autoplay` | 需显式绑定 `:autoplay="true"` |
| 生命周期 | Class + Hooks (`useDidShow`) | 同名方法写在 Vue 对象中 |
| 样式方案 | CSS Modules（推荐） | `<style scoped>`（小程序不支持，推荐 CSS Modules） |
| 状态管理 | Redux / Zustand / Recoil | Vuex / Pinia |

---

## 二、组件映射

> **核心规则**：从 `@tarojs/components` 导入组件。Taro v3.3+ 也支持使用 HTML 标签。

### React 写法

```tsx
import { View, Text, Image, Swiper, SwiperItem, ScrollView, Navigator } from '@tarojs/components'

function Page() {
  return (
    <View className="container">
      <Swiper autoplay interval={3000} indicatorColor="#999">
        <SwiperItem><Image src="..." mode="aspectFill" /></SwiperItem>
      </Swiper>
    </View>
  )
}
```

### Vue 写法

```vue
<template>
  <view class="container">
    <swiper :autoplay="true" :interval="3000" indicator-color="#999">
      <swiper-item><image src="..." mode="aspectFill" /></swiper-item>
    </swiper>
  </view>
</template>
```

### 完整标签映射表

| HTML | Taro React | Taro Vue | 说明 |
|---|---|---|---|
| `<div>` `<section>` `<main>` `<header>` `<footer>` `<nav>` | `<View>` | `<view>` | 通用容器 |
| `<span>` `<p>` `<b>` `<strong>` `<em>` `<i>` | `<Text>` | `<text>` | 文本；`<span>` 默认映射为 `<View>`（需手动设 `display: inline`） |
| `<h1>`~`<h6>` | `<View>` + className | `<view>` + className | 自定义样式 |
| `<img>` | `<Image>` | `<image>` | **必须设宽高**；常用 mode：`aspectFill`、`widthFix`、`aspectFit` |
| `<a href>` | `<Navigator>` / `onClick` | `<navigator>` / `@tap` | 动作型链接改事件处理 |
| `<a href="javascript:;">` | `<View>` | `<view>` | 空链接 |
| `<ul>` `<ol>` `<li>` | `<View>` + `.map()` | `<view>` + `v-for` | 使用稳定 `key` |
| `<table>` `<tr>` `<td>` | `<View>` + Flex | `<view>` + Flex | 用 view 模拟 |
| `<input>` | `<Input>` | `<input>` | type 属性行为与 Web 不同 |
| `<textarea>` | `<Textarea>` | `<textarea>` | 原生组件 |
| `<select>` | `<Picker>` | `<picker>` | 选择器组件 |
| `<button>` | `<Button>` | `<button>` | |
| `<form>` | `<Form>` | `<form>` | `onSubmit` 事件 |
| `<input type="radio">` | `<RadioGroup>`+`<Radio>` | `<radio-group>`+`<radio>` | 需补充容器组件 |
| `<input type="checkbox">` | `<CheckboxGroup>`+`<Checkbox>` | `<checkbox-group>`+`<checkbox>` | 需补充容器组件 |
| toggle / switch | `<Switch>` | `<switch>` | |
| `<input type="range">` | `<Slider>` | `<slider>` | |
| `<svg>` | 不支持 | 不支持 | 用 base64 `<Image>` 或图标替代 |
| 轮播图 | `<Swiper>`+`<SwiperItem>` | `<swiper>`+`<swiper-item>` | |
| `<video>` | `<Video>` | `<video>` | 原生组件 |
| `<audio>` | `<Audio>` | `<audio>` | 推荐 API 方式 |
| `<iframe>` | `<WebView>` | `<web-view>` | |
| `<canvas>` | `<Canvas>` | `<canvas>` | |
| `<progress>` | `<Progress>` | `<progress>` | |
| 滚动容器 | `<ScrollView>` | `<scroll-view>` | **必须设固定高度**；支持横向滚动 |
| 覆盖浮层 | `<CoverView>` `<CoverImage>` | `<cover-view>` `<cover-image>` | 覆盖原生组件 |
| 富文本 | `<RichText nodes={html} />` | `<rich-text :nodes="html" />` | |

---

## 三、事件映射

| Web | Taro React | Taro Vue | 说明 |
|---|---|---|---|
| `onClick` | `onClick` | `@tap` | 点击 |
| 阻止冒泡 | `e.stopPropagation()` | `@tap.stop` | |
| `onChange`（input） | `onInput` | `@input` | 输入变化 |
| `onChange`（picker/switch） | `onChange` | `@change` | 值变化 |
| `onSubmit` | `onSubmit` | `@submit` | 表单提交 |
| `onFocus` | `onFocus` | `@focus` | |
| `onBlur` | `onBlur` | `@blur` | |
| `onScroll` | `onScroll` | `@scroll` | |
| 长按 | `onLongPress` | `@longpress` | |
| `onTouchStart/Move/End` | `onTouchStart/Move/End` | `@touchstart/move/end` | |

> [!TIP]
> **阻止滚动穿透**：小程序端 `e.stopPropagation()` 无法阻止。两种方案：
> 1. **CSS 禁止滚动**（推荐）：为被穿透组件设 `overflow: hidden`
> 2. **catchMove**：`<View catchMove>`（React）/ `<view :catch-move="true">`（Vue）

---

## 四、样式转换

### 4.1 单位转换（自动 px → rpx）

Taro 默认使用 `postcss-pxtransform` 自动转换。**书写时按设计稿 1:1 即可**。

```javascript
// config/index.ts
const config = {
  designWidth: 750,        // 设计稿宽度
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,                // 1px = 1rpx
    828: 1.81 / 2,
    375: 2 / 1,            // 375 设计稿：1px = 2rpx
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          onePxTransform: true,    // 1px 不转换（细边框保留）
          selectorBlackList: [],    // 黑名单类名不转换
        },
      },
    },
  },
}
```

### 跳过转换的方法

- **行内样式**：`Taro.pxTransform(10)` 运行时转换
- **样式文件**：大写 `Px` 或 `PX` 跳过转换
- **黑名单**：`selectorBlackList: ['.van-', '.adm-']` 过滤第三方组件库

### 4.2 CSS Modules（推荐）

```tsx
// React
import styles from './index.module.scss'
<View className={styles.container} />
```

Vue 中 `<style scoped>` 在小程序端**不支持**（因小程序无法实现 `getComputedStyle`）。推荐使用 CSS Modules：

```vue
<style module>
.container { /* 通过 $style.container 引用 */ }
</style>
```

CSS Modules 配置：
```javascript
mini: {
  postcss: {
    cssModules: {
      enable: true,                      // 默认 false，需手动开启
      config: {
        namingPattern: 'module',         // global / module
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
    },
  },
}
```

### 4.3 选择器限制

| 选择器 | 组件内 | 全局样式 | 说明 |
|---|---|---|---|
| 类选择器 `.class` | 支持 | 支持 | 推荐 |
| ID 选择器 `#id` | 不支持 | 支持 | 组件不支持 |
| 属性选择器 `[attr]` | 不支持 | 支持 | 组件不支持 |
| 标签选择器 `button` | 不支持 | 部分支持 | 编译后标签名会变 |
| 后代选择器 `.a .b` | 部分支持 | 支持 | 极端情况可能非预期 |
| 子选择器 `.a > .b` | 部分支持 | 支持 | 仅 `<View>` 与其子节点 |
| `*` 通配符 | 不支持 | 不支持 | 不支持 |
| 媒体查询 | 不支持 | 不支持 | 小程序端不支持 |
| 继承样式（`font` `color`） | 支持 | 支持 | 从父组件继承到组件内 |

### 4.4 外部样式类（externalClasses）

用于向自定义组件传递样式（kebab-case 命名）：

```tsx
// 自定义组件声明
static externalClasses = ['my-class']
<View className="my-class">...</View>

// 外部使用
<CustomComp my-class="red-text" />
```

### 4.5 全局样式穿透（addGlobalClass）

```tsx
static options = { addGlobalClass: true }
// 使外部样式可影响组件内部（基础库 2.2.3+）
```

### 4.6 Tailwind CSS / UnoCSS

使用 `weapp-tailwindcss` 插件可实现 Tailwind 在 Taro 小程序中运行，自动处理 `px2rpx`、过滤不支持的选择器等。

---

## 五、路由与导航

| Web | Taro | 说明 |
|---|---|---|
| React Router | `app.config.ts` pages 注册 | 文件系统路由 |
| Tab 切换 | `Taro.switchTab({ url })` | Tab 间必须用 switchTab |
| 页面跳转 | `Taro.navigateTo({ url })` | 新页面入栈 |
| 页面重定向 | `Taro.redirectTo({ url })` | 替换当前页 |
| 重启 | `Taro.reLaunch({ url })` | 清空栈打开新页 |
| 返回 | `Taro.navigateBack({ delta })` | |
| 参数传递 | `onLoad(options)` / `useLoad` hook | |

> [!WARNING]
> - `navigateTo` / `redirectTo` 只能打开非 TabBar 页面
> - 页面栈最多 **10 层**
> - `app.config.ts` 中 `pages` 数组第一项为首页

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/detail/index',
  ],
  tabBar: {
    custom: true,  // 自定义 TabBar
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
    ],
  },
})
```

---

## 六、生命周期

### React（函数组件 + Hooks）

| Web React | Taro Hooks | 说明 |
|---|---|---|
| `useEffect(() => {}, [])` | `useLoad((options) => {})` | 页面加载（接收参数） |
| `useEffect(() => {})` | `useDidShow(() => {})` | 页面显示（每次） |
| — | `useReady(() => {})` | 渲染完成，可获取节点 |
| — | `useDidHide(() => {})` | 页面隐藏 |
| `useEffect` cleanup | `useUnload(() => {})` | 页面卸载 |
| — | `usePullDownRefresh(() => {})` | 下拉刷新 |
| — | `useReachBottom(() => {})` | 触底加载 |
| — | `usePageScroll((e) => {})` | 页面滚动 |
| — | `useShareAppMessage((res) => {})` | 分享 |

> [!CAUTION]
> `componentDidMount` / `useEffect(() => {}, [])` 之后**不能立即**用 `createSelectorQuery` 获取渲染层节点——需等到 `onReady` / `useReady`。

### React（Class Component）

同名方法：`onLoad(options)`、`onShow()`、`onReady()`、`onHide()`、`onUnload()` 等。

### Vue

同名方法写在 Vue 对象中：`onLoad`、`onShow`、`onReady`、`onHide`、`onUnload`、`onPullDownRefresh`、`onReachBottom` 等。

---

## 七、数据与逻辑

### React

```tsx
import { useState } from 'react'
import { useDidShow } from '@tarojs/taro'
import { homeData } from '@/utils/mock'

export default function Home() {
  const [data, setData] = useState<any>({})
  useDidShow(() => {
    setData(homeData)
  })
  return <View>{/* ... */}</View>
}
```

### Vue

```vue
<script>
import { homeData } from '@/utils/mock'
export default {
  data() { return { items: [] } },
  onLoad() { this.items = homeData.items }
}
</script>
```

### 跨页面通讯

```tsx
// Taro.eventCenter 全局事件
import { eventCenter } from '@tarojs/taro'

eventCenter.trigger('updateData', payload)
eventCenter.on('updateData', (data) => { /* ... */ })
```

---

## 八、Mock 数据管理

```typescript
// src/utils/mock.ts
export const homeData = {
  banners: [ /* ... */ ],
  categories: [ /* ... */ ],
}
export const detailData = { /* ... */ }
```

---

## 九、推荐 UI 库

Taro 的跨端能力使得组件库选择更灵活：

| UI 库 | 技术栈 | 特点 |
|-------|--------|------|
| **[NutUI](https://nutui.jd.com/)** | React / Vue | 京东开源，设计现代，组件全面（60+），Vue 版本更成熟 |
| **[Taroify](https://taroify.gitee.io/)** | React / Vue | Vant 风格迁移到 Taro，与 Vant Weapp 设计语言一致 |

**选择建议：** Vue 项目优先 NutUI（京东团队长期维护），React 项目可选 Taroify（API 风格更 React）。**二选一，不混用。**

常见组件映射：

| 需求 | NutUI React | NutUI Vue | Taroify |
|------|-----------|-----------|---------|
| 弹窗 | `<Dialog>` | `<nut-dialog>` | `<Dialog>` |
| 标签页 | `<Tabs>` | `<nut-tabs>` | `<Tabs>` |
| 标签/徽标 | `<Tag>` | `<nut-tag>` | `<Tag>` / `<Badge>` |
| 空状态 | `<Empty>` | `<nut-empty>` | `<Empty>` |
| 骨架屏 | `<Skeleton>` | `<nut-skeleton>` | `<Skeleton>` |
| 评分 | `<Rate>` | `<nut-rate>` | `<Rate>` |
| 分页 | `<Pagination>` | `<nut-pagination>` | `<Pagination>` |

---

## 十、图标处理方案

| 方案 | 小程序 | H5 | 说明 |
|------|:---:|:---:|------|
| Lucide Base64 内联 | 支持 | 支持 | 推荐快速方案，现代简约 |
| `Taro.pxTransform` + 本地 PNG | 支持 | 支持 | 稳定可靠 |
| Base64 内联 image | 支持 | 支持 | 小图标（<2KB）推荐 |
| Iconfont | 部分支持，需处理样式隔离 | 支持 | Taro 组件内需 `addGlobalClass` |
| SVG | 不支持 | 支持 | 小程序不支持 |
| 组件库图标（NutUI/Taroify） | 支持 | 支持 | 功能完整 |

---

## 十一、自定义 TabBar

### 关键配置

1. `src/app.config.ts`：`tabBar: { custom: true, list: [...] }` — `list` 不能为空

2. `src/custom-tab-bar/` 目录（名称固定）下创建组件：
   ```tsx
   // src/custom-tab-bar/index.tsx
   import { View, Image, Text } from '@tarojs/components'
   import Taro from '@tarojs/taro'
   import { useSelector } from 'react-redux'

   export default function CustomTabBar() {
     const current = useSelector(state => state.tab.current)
     // ...
   }
   ```

3. **状态必须全局管理**：自定义 TabBar 在每个 Tab 页面初始化时创建**新的组件实例**，状态不共享。必须用 Redux/Vuex/Pinia/Zustand。

4. 每个 Tab 页面的 `page.config.ts` 需声明 `usingComponents: {}`

### 常见陷阱

- **样式隔离**：设置 `options.addGlobalClass = true`（Vue 中必须用 Options API 写法，不支持 `<script setup>`）
- **图片转 base64**：`import`/`require` 的图片被 `url-loader` 处理，需用原生路径
- **安全区域**：`safe-area-inset-bottom` + 调整 TabBar 高度
- **首次闪烁**：在 `app.ts` 的 `componentDidMount` 中从 Storage 恢复状态

---

## 十二、自定义导航栏

```tsx
// page.config.ts
export default definePageConfig({
  navigationStyle: 'custom',
})
```

```tsx
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

export default function CustomNav() {
  const { statusBarHeight } = Taro.getSystemInfoSync()
  const menuButton = Taro.getMenuButtonBoundingClientRect()
  const navHeight = (menuButton.top - statusBarHeight!) * 2 + menuButton.height

  return (
    <View style={{ paddingTop: `${statusBarHeight}px` }}>
      <View style={{ height: `${navHeight}px` }}>
        <Text>页面标题</Text>
      </View>
    </View>
  )
}
```

---

## 十三、富文本处理

- 小程序端：用 `<RichText nodes={htmlString} />`
- H5 端：`dangerouslySetInnerHTML` 或 `react-render-html`
- 跨端封装：条件编译 `process.env.TARO_ENV === 'weapp'`
- 图片适配：富文本中图片需处理 `mode="widthFix"`

---

## 十四、常见陷阱

1. **不要使用标签选择器**：编译后标签名会变，H5 端会包裹 `taro-[tag]-core`
2. **`<span>` 默认是块级元素**：Taro 将其映射为 `<View>`。需手动 `display: inline` 或引入 `@tarojs/taro/html.css`
3. **`<Image>` 必须显式设宽高**：H5 不设会用原图尺寸，小程序用默认尺寸
4. **`box-sizing` 默认值不同**：全局重置 `* { box-sizing: border-box }`
5. **`componentDidMount` / `mounted` 后不能获取渲染层节点**：需等到 `onReady` / `useReady`
6. **`position: fixed` 在父元素有 `transform` 时失效**：移到根层级
7. **小程序端 `backdrop-filter` 不支持**：用半透明背景替代
8. **`gap`（Flex gap）部分端不支持**：用 margin + `:not(:last-child)` 替代
9. **小程序端不支持 `rem`、媒体查询、`*` 通配符、属性选择器**
10. **页面栈 10 层限制**：深层跳转用 `redirectTo` / `reLaunch`
11. **表单组件需补充容器**：`<input type="checkbox">` → `<CheckboxGroup>` + `<Checkbox>`
12. **CSS Modules 默认关闭**：需在 `config/index.ts` 中手动开启
13. **行内样式不会被自动转换**：JS 中的 style 值需 `Taro.pxTransform()`
14. **Vue `<style scoped>` 小程序端不支持**：改用 CSS Modules
15. **Vue `transition` 组件需手动设 `transitionDuration`**：小程序无法实现 `getComputedStyle`
16. **自定义 TabBar 状态不共享**：必须用全局状态管理（Redux/Vuex/Pinia）
17. **`<Input>` 的 `onInput` 返回值**：`e.detail.value`（非 Web 的 `e.target.value`）

---

## 十五、验证 checklist

### 页面完整性
- [ ] 所有页面在 `app.config.ts` 中注册
- [ ] TabBar 配置正确（`custom: true` 时 `list` 不为空）
- [ ] `designWidth` 配置与设计稿匹配

### 路由
- [ ] TabBar 页面用 `Taro.switchTab`，非 TabBar 用 `Taro.navigateTo`
- [ ] 页面返回正常（`Taro.navigateBack`）
- [ ] 参数传递正确

### 样式
- [ ] CSS Modules 启用 + 生成规则合理
- [ ] `selectorBlackList` 过滤了第三方组件库
- [ ] 不使用标签选择器、`*` 通配符、属性选择器（组件内）
- [ ] `box-sizing` 全局重置
- [ ] 不支持属性（`backdrop-filter`、`gap` 等）已替换

### 图标
- [ ] 小程序端 SVG 已替换为 base64/PNG/组件库图标
- [ ] 图标样式隔离已处理（`addGlobalClass`）

### 交互
- [ ] 简单交互正常工作
- [ ] 业务逻辑用 Toast 占位
- [ ] Mock 数据正确显示

### 数据
- [ ] `utils/mock.ts` 包含所有页面数据
- [ ] 自定义 TabBar 状态通过全局 Store 管理
