# 微信原生小程序参考

将 HTML 原型转换为微信原生小程序代码时使用本参考。

## 外部项目抽取结论

已检索并校验 6 个 GitHub 项目/工具：`tencs/html-to-wxapp`、`timezhong/html2wxml`、`skyFi/html2wxml`、`kevenfeng/html-to-wxml`、`qwqoffice/html2wxml`、`jboltai/html2wxml4J`。没有发现可直接用于"高保真 HTML 原型整页转原生小程序"的成熟 skill；大多数项目是富文本/文章详情渲染器。

可抽取结论：

- `tencs/html-to-wxapp` 最接近整页转换：HTML 标签映射、CSS 到 WXSS、`rem -> rpx`、资源复制、stylelint 兼容检查可借鉴；但实现主要靠正则和老 gulp 生态，不适合原样复制。
- `timezhong/html2wxml` 是简单 Electron/正则转换器，只适合抽取基础标签映射和 `image mode` 提醒。
- `skyFi/html2wxml` 将 HTML 解析成 JSON 节点树，再用 WXML 模板渲染，适合富文本片段；不适合高保真整页布局。
- `kevenfeng/html-to-wxml` 适合资讯正文：连续文本合并为段落、图片单独节点、图片加载后按比例计算高度；不覆盖完整 CSS 迁移。
- `qwqoffice/html2wxml` 是较完整的富文本组件：支持组件/模板接入、图片 `widthFix` 与预览、列表、表格、标题和代码块默认样式；适合文章/CMS 内容，不适合原型整页转换。
- `jboltai/html2wxml4J` 用 Jsoup 服务端解析 HTML 到 JSON，保留 `style/class`、补全资源绝对路径、给图片编号、处理 `pre` 代码块；可借鉴"结构化解析优先"的策略，但 Java/JFinal/FastJSON 版本较旧。

执行高保真原型转换时，采用"结构化解析 + 页面重建 + WXSS 迁移"的路线。不要用纯正则直接生成最终代码；只把正则用于小范围清洗或后处理。

---

## 文件结构

- 页面放在 `pages/<page-name>/` 下。
- 每个页面通常包含 `<page>.wxml`、`<page>.wxss`、`<page>.js` 和 `<page>.json`。
- 公共组件通常放在 `components/<component-name>/` 下，并包含同名 `.wxml`、`.wxss`、`.js` 和 `.json`。
- 全局样式放在 `app.wxss`；全局生命周期和数据放在 `app.js`；页面注册放在 `app.json`。
- 静态图片通常放在 `assets/`、`images/` 或 `static/`；优先遵循现有仓库约定。
- `project.config.json` 必须配置 `"miniprogramRoot": "miniprogram/"`，确保微信开发者工具正确识别源码目录。

### 推荐项目骨架

```
miniprogram/
├── app.js            # 全局入口
├── app.json          # 页面注册 + TabBar + window 配置
├── app.wxss          # 全局样式（CSS 变量 + 工具类）
├── project.config.json
├── sitemap.json
├── custom-tab-bar/   # 如需自定义 TabBar
│   ├── index.js / index.json / index.wxml / index.wxss
├── assets/
│   └── icons/        # 图标资源
├── utils/
│   ├── mock.js       # 所有 Mock 数据集中管理
│   └── util.js       # 工具函数
└── pages/            # 每个页面 4 个文件
    ├── page-name/
    │   ├── page-name.js
    │   ├── page-name.json
    │   ├── page-name.wxml
    │   └── page-name.wxss
```

---

## 一、标签映射

### 完整映射表

| HTML / React | 微信小程序 | 说明 |
|---|---|---|
| `<div>` `<section>` `<main>` `<article>` `<aside>` `<header>` `<footer>` `<nav>` | `<view>` | 通用容器 |
| `<span>` `<p>` `<b>` `<strong>` `<em>` `<i>` `<s>` `<small>` 等内联文本 | `<text>` | 文本必须包在 text 中；嵌套块级元素时改用 `view` |
| `<img>` | `<image>` | 必须设宽高；常用 mode：`aspectFill`（裁剪填充）、`aspectFit`（完整显示）、`widthFix`（宽度固定高度自适应）、`scaleToFill`（默认拉伸） |
| `<input>` | `<input>` | 保留，但事件名不同 |
| `<textarea>` | `<textarea>` | 原生组件，层级最高 |
| `<button>` | `<button>` / `<view>` | 视需求选择 |
| `<a href>` | `<navigator>` / 事件 | 小程序无 a 标签；动作型链接改为 `bindtap` |
| `<ul>` `<li>` `<ol>` | `<view>` + `wx:for` | 列表渲染 |
| `<svg>` | 不支持 | 用 image 替代（见图标方案） |
| `<select>` | `<picker>` | 选择器组件 |
| `<form>` | `<form>` | 保留，事件名变化 |
| 滚动容器 | `<scroll-view>` | 必须设固定高度才能滚动 |
| 轮播图（JS 库） | `<swiper>` + `<swiper-item>` | 内置轮播组件，支持自动播放和循环 |
| `<video>` | `<video>` | 原生组件，需用 `cover-view` 覆盖 |
| `<audio>` | `<audio>` / `wx.createInnerAudioContext` | 推荐用 API 方式 |
| `<input type="radio">` | `<radio-group>` + `<radio>` | 单选框 |
| `<input type="checkbox">` | `<checkbox-group>` + `<checkbox>` | 多选框 |
| toggle / switch | `<switch>` | 开关组件 |
| `<input type="range">` | `<slider>` | 滑块组件 |
| 富文本 HTML 内容 | `<rich-text nodes="{{html}}">` | 支持部分 HTML 标签渲染 |
| 覆盖原生组件的浮层 | `<cover-view>` / `<cover-image>` | 用于覆盖 video 等原生组件 |

### 1.1 推荐 UI 库

微信原生小程序组件有限，以下 UI 库可补充弹窗、标签、空状态等常见组件：

| UI 库 | 特点 | 适用场景 |
|-------|------|---------|
| **[WeUI](https://github.com/Tencent/weui-wxss)** | 微信官方设计语言，风格与微信原生一致 | 需要与微信生态视觉统一的场景 |
| **[Vant Weapp](https://vant-ui.github.io/vant-weapp/)** | 有赞开源，设计现代，组件丰富（60+），社区活跃 | 追求现代设计风格，需要丰富组件的场景 |

**推荐二选一，不混用。** Vant Weapp 设计更现代、组件更全，是大多数项目的首选。

### 1.2 组件选择指引

小程序中无原生支持的组件，推荐实现方式：

| 需求 | 推荐方案 | 说明 |
|------|---------|------|
| 弹窗/对话框 | Vant Weapp `<van-dialog>` 或 WeUI `<mp-dialog>` | 避免手写遮罩层 |
| 表格/列表 | Vant Weapp `<van-cell-group>` 或 `<view>` + Flex | 数据表格用 Flex 布局模拟 |
| 标签/徽标 | Vant Weapp `<van-tag>` / `<van-badge>` | |
| 空状态 | 自定义 `<view>` 组件（插画 + 文案 + 按钮） | 参考 [empty state 设计指南](https://www.smashingmagazine.com/2021/02/empty-state-ui-design/) |
| 加载态 | 骨架屏（`<view>` + CSS 动画）优先于 loading spinner | 提升感知性能 |
| 分页 | `<scroll-view>` + 触底加载 `bindscrolltolower` | 移动端优先无限滚动，避免传统分页器 |
| Tab 切换 | Vant Weapp `<van-tabs>` 或 `<view>` + CSS + `bindtap` | 组件级 Tab，与页面级 TabBar 区分 |
| 下拉刷新 | 页面级 `enablePullDownRefresh: true` + `onPullDownRefresh` | 小程序原生支持 |
| 日期选择 | `<picker mode="date">` | 小程序原生 picker，支持 date/time/region/selector |
| 评分 | Vant Weapp `<van-rate>` | 小程序无原生评分组件 |

---

## 二、事件映射

| Web 事件 | 小程序事件 | 说明 |
|---|---|---|
| `onClick` | `bindtap` | 点击事件（冒泡） |
| `onClick`（阻止冒泡） | `catchtap` | 点击事件（阻止冒泡，如弹窗遮罩防穿透） |
| 长按 | `bindlongpress` | 超过 350ms 触发，推荐代替 longtap |
| `onTouchStart` | `bindtouchstart` | 手指触摸开始 |
| `onTouchMove` | `bindtouchmove` | 手指触摸后移动 |
| `onTouchEnd` | `bindtouchend` | 手指触摸结束 |
| `onChange`（input） | `bindinput` | 输入框内容变化 |
| `onChange`（picker/switch） | `bindchange` | picker、switch、slider 等值变化 |
| `onFocus` | `bindfocus` | 输入框获取焦点 |
| `onBlur` | `bindblur` | 输入框失去焦点 |
| `onSubmit` | `bindsubmit` | 表单提交 |
| `onScroll` | `bindscroll` | 滚动事件（scroll-view） |
| `onLoad`（img） | `bindload` | 图片/视频加载成功 |
| `onError`（img） | `binderror` | 图片/视频加载失败 |

### 属性映射

| Web 属性 | 小程序属性 | 说明 |
|---|---|---|
| `className` | `class` | 类名属性 |
| `style={{}}` | `style=""` | 内联样式（字符串格式） |
| `dangerouslySetInnerHTML` | `<rich-text nodes>` | 富文本渲染 |
| `hidden` / `v-show` | `hidden="{{bool}}"` | 控制显隐（不销毁节点，频繁切换优于 `wx:if`） |
| `data-*` | `data-*` | 通过 `e.currentTarget.dataset` 获取 |

---

## 三、样式转换（CSS → WXSS）

### 3.1 单位转换

- 布局尺寸优先使用 `rpx`：1px = 2rpx（基于 375px 设计稿）
- 以下情况保留 `px`：
  - `border`：细边框保留 `1px`（避免高分屏过粗）
  - 与系统 API 返回值配合的尺寸（如 `statusBarHeight`）
- 原型使用 `rem` 时，按 `1rem = 40rpx` 初始换算，再通过真机/开发者工具视觉校正

### 3.2 选择器支持情况

| 选择器类型 | 支持 | 说明 |
|---|---|---|
| 类选择器 `.class {}` | 支持 | 推荐 |
| ID 选择器 `#id {}` | 支持 | |
| 后代选择器 | 支持 | |
| 子选择器 `>` | 支持 | |
| 兄弟选择器 `~` `+` | 支持 | |
| 伪类 `:active` `:first-child` `:last-child` `:not` `:nth-child` | 支持 | |
| 伪元素 `::before` `::after` | 支持 | 仅这两个 |
| 标签选择器 `div {}` `span {}` | 不支持 | |
| `*` 通配符选择器 | 不支持 | |
| 属性选择器 `[attr]` `[type="text"]` | 不支持 | |

### 3.3 布局属性

| 属性 | 支持 | 说明 |
|---|---|---|
| `display: flex` 全系列 | 支持 | **推荐首选布局方式** |
| `display: grid` | 支持 | 支持 |
| `float` | 部分支持 | 支持但在 Flex 容器内失效，推荐用 Flex 替代 |
| `display: inline-block` | 部分支持 | 行为可能与 Web 不完全一致 |
| `position: fixed` | 部分支持 | 支持，但父元素有 `transform` 时会失效 |
| `overflow: scroll` | 部分支持 | 不稳定，推荐用 `<scroll-view>` |
| `position: sticky` | 支持 | 支持 |

### 3.4 现代 CSS 支持

- `backdrop-filter: blur()` — 支持
- `linear-gradient()` — 支持
- `box-shadow` — 支持
- CSS 变量 `var(--xxx)` — 支持，在 `page {}` 中定义，**不是 `:root`**
- `border-radius` — 支持
- `@import` 导入外部样式表 — 支持
- WXSS 中**不支持引入本地字体文件和本地图片**，必须使用在线资源或 Base64

### 3.5 Tailwind CSS 迁移

将工具类转为等效 WXSS：
- 提取颜色为 CSS 变量定义在 `app.wxss` 的 `page {}` 选择器中
- 将 `flex`、`grid`、`gap`、`rounded` 等转为对应属性
- `hover:` 伪类可用 `.active` 类 + `bindtouchstart/end` 模拟，或省略

### 3.6 全局样式策略

- CSS 变量定义在 `app.wxss` 的 `page {}` 中（**不是 `:root`**）
- 通用工具类（flex 布局、文本截断等）定义在 `app.wxss`
- 页面私有样式写在各自的 `.wxss` 文件中
- 自定义组件默认启用**样式隔离**，组件内外样式互不影响
- 使用全局 `page` 样式设置页面级背景和最小高度

---

## 四、路由与导航

| Web 路由方式 | 小程序对应 | 说明 |
|---|---|---|
| React Router / hash 路由 | `app.json` 的 `pages` 注册 | |
| Tab 切换 | `wx.switchTab({ url })` | Tab 间必须用 switchTab，不能用 navigateTo |
| 页面跳转 | `wx.navigateTo({ url })` | |
| 页面重定向 | `wx.redirectTo({ url })` | 替换当前页，不增加页面栈 |
| 返回上一页 | `wx.navigateBack()` | |
| 参数传递 | `options` 参数 / `globalData` | |

> [!WARNING]
> **页面栈限制**：小程序页面栈最多 **10 层**，超过后 `navigateTo` 会失败。深层级跳转考虑用 `redirectTo`。

---

## 五、数据与逻辑

| Web 概念 | 小程序对应 |
|---|---|
| `useState` / `data()` | `Page({ data: {} })` |
| `setState` / 赋值 | `this.setData({ key: value })` |
| `useEffect` / `mounted` | `onLoad()` / `onShow()` |
| `props` | 组件的 `properties` |
| `context` / `provide` | `getApp().globalData` |
| `fetch` / `axios` | Mock 数据直接引入（不实现真实请求） |
| `localStorage` | `wx.setStorageSync()` / `getStorageSync()` |
| 条件渲染 `{cond && <X/>}` | `wx:if="{{cond}}"` |
| 列表渲染 `.map()` | `wx:for="{{list}}" wx:key="id"` |
| 模板字符串 | `{{}}` 数据绑定 |

> [!TIP]
> **`wx:key` 用法**：值为列表项的**属性名字符串**（不加 `item.` 前缀），如 `wx:key="id"`。如果列表项本身是唯一字符串/数字，可用 `wx:key="*this"`。不设 `wx:key` 会触发警告且影响渲染性能。

---

## 六、Mock 数据管理

所有页面数据集中在 `utils/mock.js` 中管理：

```javascript
// utils/mock.js

// 首页数据
const homeData = {
  banners: [ /* ... */ ],
  categories: [ /* ... */ ],
  hotItems: [ /* ... */ ],
};

// 其他页面数据...
const profileData = { /* ... */ };

module.exports = {
  homeData,
  profileData,
  // ...
};
```

**页面中引用方式：**

```javascript
// pages/home/home.js
const mock = require('../../utils/mock.js')

Page({
  data: {},
  onLoad() {
    this.setData(mock.homeData)
  },
  // 简单交互
  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },
  onButtonTap() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})
```

---

## 七、图标处理方案

> [!IMPORTANT]
> 本项目使用 **[Lucide](https://lucide.dev/)** 作为图标库。Lucide 是 shadcn/ui 默认图标库，1000+ 极简线条风格图标，ISC 开源协议，社区最活跃的现代图标库。

### 方案 A：Lucide Base64 内联图标（推荐快速原型）

使用 Lucide SVG 图标，通过 Node.js 脚本转为 base64 Data URI，在 WXML 中以 `<image>` 标签引用。无需额外资源文件，一次生成全局复用。

**实施步骤：**

1. 创建图标生成脚本 `scripts/generate_icons_base64.js`（见下方完整脚本）
2. 运行 `node scripts/generate_icons_base64.js` 生成 `utils/icons.js`
3. 在页面 JS 中引入：
```js
const icons = require('../../utils/icons')
Page({
  data: { icons }
})
```

4. WXML 写法：
```html
<image src="{{icons.home}}" class="icon" mode="aspectFit" />
<image src="{{icons.search}}" class="icon" mode="aspectFit" />
```

5. WXSS：
```css
.icon {
  width: 40rpx;
  height: 40rpx;
}
```

**Base64 生成脚本**（Node.js，跨平台通用）：

```js
// scripts/generate_icons_base64.js
const https = require('https')
const fs = require('fs')
const path = require('path')

const ICONS = [
  { name: 'house', key: 'home', color: '#94a3b8' },
  { name: 'house', key: 'homeActive', color: '#3b82f6' },
  { name: 'search', key: 'search', color: '#94a3b8' },
  { name: 'user-round', key: 'user', color: '#94a3b8' },
  { name: 'settings', key: 'settings', color: '#94a3b8' },
  { name: 'phone', key: 'phone', color: '#94a3b8' },
  { name: 'pencil', key: 'edit', color: '#94a3b8' },
  { name: 'trash-2', key: 'delete', color: '#94a3b8' },
  { name: 'plus', key: 'add', color: '#94a3b8' },
  { name: 'check', key: 'check', color: '#22c55e' },
  { name: 'ban', key: 'ban', color: '#ef4444' },
  { name: 'file-text', key: 'file', color: '#94a3b8' },
  { name: 'calendar', key: 'calendar', color: '#94a3b8' },
  { name: 'map-pin', key: 'location', color: '#94a3b8' },
  { name: 'bar-chart-3', key: 'chart', color: '#94a3b8' },
  { name: 'chevron-left', key: 'back', color: '#333333' },
  { name: 'chevron-right', key: 'forward', color: '#333333' },
  { name: 'shopping-cart', key: 'cart', color: '#94a3b8' },
  { name: 'heart', key: 'heart', color: '#ef4444' },
  { name: 'share-2', key: 'share', color: '#94a3b8' },
  { name: 'more-horizontal', key: 'more', color: '#333333' },
]

const CACHE_DIR = path.join(__dirname, '..', 'assets', 'icons-svg')

function fetchSvg(iconName, color) {
  return new Promise((resolve, reject) => {
    const cachePath = path.join(CACHE_DIR, `${iconName}.svg`)

    // 优先读取本地缓存，避免网络依赖
    if (fs.existsSync(cachePath)) {
      const cached = fs.readFileSync(cachePath, 'utf-8')
      const colored = cached.replace(/currentColor/g, color)
      const b64 = Buffer.from(colored).toString('base64')
      return resolve(`data:image/svg+xml;base64,${b64}`)
    }

    // 缓存未命中 → CDN 下载并写入缓存
    console.log(`  ↓ downloading ${iconName} (cache miss)`)
    const url = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${iconName}`))
        return
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        // 写入本地缓存（纳入版本控制）
        fs.mkdirSync(CACHE_DIR, { recursive: true })
        fs.writeFileSync(cachePath, data)
        // 生成 base64
        const colored = data.replace(/currentColor/g, color)
        const b64 = Buffer.from(colored).toString('base64')
        resolve(`data:image/svg+xml;base64,${b64}`)
      })
    }).on('error', reject)
  })
}

async function main() {
  const result = {}
  for (const icon of ICONS) {
    try {
      result[icon.key] = await fetchSvg(icon.name, icon.color)
      console.log(`✓ ${icon.key} (${icon.name})`)
    } catch (e) {
      console.error(`✗ ${icon.key}: ${e.message}`)
    }
  }
  const output = [
    '// Auto-generated by generate_icons_base64.js',
    '// Source: Lucide Icons (https://lucide.dev/) — ISC License',
    'module.exports = ' + JSON.stringify(result, null, 2),
    ''
  ].join('\n')
  const outPath = path.join(__dirname, '..', 'utils', 'icons.js')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, output)
  console.log(`Done! Generated ${outPath}`)
}

main()
```

**常用 Lucide 图标映射参考：**

| 用途 | Lucide 图标名 | 推荐颜色 | 预览 |
|------|-------------|---------|------|
| 首页 | `house` | `#94a3b8` / 激活 `#3b82f6` | ![](https://unpkg.com/lucide-static@latest/icons/house.svg) |
| 搜索 | `search` | `#94a3b8` | |
| 用户/头像 | `user-round` | `#94a3b8` | |
| 设置 | `settings` | `#94a3b8` | |
| 电话 | `phone` | `#94a3b8` | |
| 编辑 | `pencil` | `#94a3b8` | |
| 删除 | `trash-2` | `#ef4444` | |
| 添加 | `plus` | `#94a3b8` | |
| 已认证/通过 | `check` | `#22c55e` | |
| 禁止/下架 | `ban` | `#ef4444` | |
| 文档 | `file-text` | `#94a3b8` | |
| 日历 | `calendar` | `#94a3b8` | |
| 位置 | `map-pin` | `#94a3b8` | |
| 图表 | `bar-chart-3` | `#94a3b8` | |
| 返回 | `chevron-left` | `#333333` | |
| 前进/更多 | `chevron-right` | `#333333` | |
| 购物车 | `shopping-cart` | `#94a3b8` | |
| 收藏/喜欢 | `heart` | `#ef4444` | |
| 分享 | `share-2` | `#94a3b8` | |
| 更多菜单 | `more-horizontal` | `#333333` | |

> 完整图标列表和在线预览：https://lucide.dev/icons/

### 方案 B：Lucide SVG → PNG 本地图标（正式项目）

适合对图标质量有精细要求的正式项目。使用 Node.js 脚本批量下载 Lucide SVG 并转换为 PNG 文件。

```js
// scripts/generate_icons_png.js
const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ICONS = [
  { name: 'house', file: 'home.png', color: '#94a3b8' },
  { name: 'house', file: 'home-active.png', color: '#3b82f6' },
  { name: 'search', file: 'search.png', color: '#94a3b8' },
  { name: 'user-round', file: 'user.png', color: '#94a3b8' },
  { name: 'settings', file: 'settings.png', color: '#94a3b8' },
  { name: 'phone', file: 'phone.png', color: '#94a3b8' },
  { name: 'pencil', file: 'edit.png', color: '#94a3b8' },
  { name: 'trash-2', file: 'delete.png', color: '#94a3b8' },
  { name: 'plus', file: 'add.png', color: '#94a3b8' },
  { name: 'check', file: 'check.png', color: '#22c55e' },
  { name: 'ban', file: 'ban.png', color: '#ef4444' },
  { name: 'file-text', file: 'file.png', color: '#94a3b8' },
  { name: 'calendar', file: 'calendar.png', color: '#94a3b8' },
  { name: 'map-pin', file: 'location.png', color: '#94a3b8' },
  { name: 'bar-chart-3', file: 'chart.png', color: '#94a3b8' },
  { name: 'chevron-left', file: 'back.png', color: '#333333' },
  { name: 'chevron-right', file: 'forward.png', color: '#333333' },
]

function fetchSvg(iconName) {
  return new Promise((resolve, reject) => {
    const url = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

async function main() {
  const outDir = path.join(__dirname, '..', 'miniprogram', 'assets', 'icons')
  fs.mkdirSync(outDir, { recursive: true })

  // Try using sharp (cross-platform), fallback to ImageMagick
  const hasSharp = (() => { try { require.resolve('sharp'); return true } catch { return false } })()
  const hasMagick = (() => { try { execSync('magick --version', { stdio: 'ignore' }); return true } catch { return false } })()

  for (const icon of ICONS) {
    try {
      const svg = await fetchSvg(icon.name)
      const colored = svg.replace(/currentColor/g, icon.color)
      const svgPath = path.join(outDir, `_temp_${icon.name}.svg`)
      const pngPath = path.join(outDir, icon.file)
      fs.writeFileSync(svgPath, colored)

      if (hasSharp) {
        const sharp = require('sharp')
        await sharp(svgPath).resize(64, 64).png().toFile(pngPath)
      } else if (hasMagick) {
        execSync(`magick "${svgPath}" -resize 64x64 "${pngPath}"`)
      } else {
        console.error(`✗ No image processor found. Install sharp (npm i sharp) or ImageMagick.`)
        process.exit(1)
      }
      fs.unlinkSync(svgPath)
      console.log(`✓ ${icon.file} (${icon.name})`)
    } catch (e) {
      console.error(`✗ ${icon.file}: ${e.message}`)
    }
  }
  console.log(`Done! Generated ${ICONS.length} icons in ${outDir}`)
}

main()
```

> [!NOTE]
> 方案 B 需要安装依赖：`npm install sharp`（推荐，跨平台）或安装 [ImageMagick](https://imagemagick.org/)。Windows 用户推荐 `sharp`。

---

## 八、自定义 TabBar 实现要点

当 Demo 的 TabBar 不是标准样式时（如浮动胶囊、异形底栏），需使用自定义 TabBar：

1. `app.json` 中设置 `"tabBar": { "custom": true, ... }`
2. 在项目根目录创建 `custom-tab-bar/` 组件（固定路径名）
3. 每个 TabBar 页面的 `onShow` 中更新选中态：
```javascript
onShow() {
  if (typeof this.getTabBar === 'function' && this.getTabBar()) {
    this.getTabBar().setData({ selected: 0 }) // 当前页索引
  }
}
```
4. **注意**：即使 `custom: true`，`app.json` 的 `tabBar.list` 仍需完整配置（框架要求）

---

## 九、自定义导航栏实现要点

当页面需要自定义顶部导航栏（渐变背景、大标题等）：

1. 页面 JSON 设置 `"navigationStyle": "custom"`
2. `app.js` 的 `onLaunch` 中获取系统信息：
```javascript
const systemInfo = wx.getWindowInfo()
this.globalData.statusBarHeight = systemInfo.statusBarHeight
const menuButton = wx.getMenuButtonBoundingClientRect()
this.globalData.navBarHeight = (menuButton.top - systemInfo.statusBarHeight) * 2 + menuButton.height
```
3. 页面顶部避让状态栏时，使用数据绑定到 `style`（不要把 `{{}}` 写进 `.wxss`）：
```html
<view class="nav-wrap" style="padding-top: {{statusBarHeight}}px;">
```
```javascript
const app = getApp()
Page({
  data: { statusBarHeight: 0 },
  onLoad() {
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 0 })
  }
})
```

---

## 十、富文本边界

当输入只是文章正文、协议、CMS 内容或评论详情时，可以采用"HTML → JSON 节点树 → WXML 模板/组件渲染"的方案：

- 节点结构保留 `tag`、`type`、`attr.class`、`attr.style`、`nodes`、文本内容和图片 `idx`。
- 为标题、段落、列表、表格、引用、代码块、图片、音频、视频提供默认 WXSS。
- 为图片计算可视宽高，或使用 `widthFix`；可收集图片 URL 以支持预览。
- 对相对资源路径补全域名，对 `script`、危险事件属性和不可信 HTML 做清洗。

如果输入是高保真页面原型，**不要把整页塞进富文本组件**。应拆成原生页面和组件，只在局部正文区域使用富文本渲染。

---

## 十一、常见陷阱

1. **文本必须包裹在 `<text>` 中**，裸文本在某些场景样式不生效
2. **`wx:for` 的默认变量**是 `item` 和 `index`，可通过 `wx:for-item` / `wx:for-index` 重命名
3. **`image` 组件必须设宽高**，否则默认 320×240
4. **WXSS 不支持标签选择器**，所有样式必须用类选择器
5. **`scroll-view` 必须设固定高度**才能触发滚动
6. **页面文件名与文件夹名必须一致**：`pages/home/home.js`
7. **小程序包体积限制 2MB**（主包），大图片应使用网络地址
8. **`textarea` 是原生组件**，层级最高，样式覆盖需注意
9. **CSS 动画支持有限**，复杂动画推荐使用 `this.animate()` 或 WXS 响应事件
10. **数据绑定是单向的**，表单双向绑定需手动 `bindinput` + `setData`
11. **`setData` 性能**：单次 `setData` 数据量不宜过大，尽量只更新变化的字段
12. **`wx:if` vs `hidden`**：`wx:if` 会销毁/重建节点，`hidden` 仅控制显隐。频繁切换时用 `hidden`
13. **`onLoad` vs `onShow`**：`onLoad` 仅在页面首次加载时执行一次，`onShow` 每次页面显示都执行

---

## 十二、验证 checklist

完成所有页面转换后，结合蓝图文件进行逐项验证：

### 页面完整性
- [ ] 每个页面的 4 个文件（.js / .json / .wxml / .wxss）是否齐全
- [ ] `app.json` 中页面注册是否完整
- [ ] TabBar 配置是否正确

### 路由
- [ ] TabBar 页面间切换正常（`switchTab`）
- [ ] 子页面跳转正常（`navigateTo`）
- [ ] 页面返回正常（`navigateBack`）
- [ ] 参数传递正确

### 样式
- [ ] CSS 变量定义完整（对照色板和设计 Token）
- [ ] 全局工具类齐全
- [ ] 各页面视觉还原度与 Demo 一致

### 图标
- Base64 方案：`utils/icons.js` 已生成；图标使用 `<image>` + base64 data URI；颜色尺寸正确
- PNG 方案：所有图标资源文件存在于 `assets/icons/`；颜色尺寸正确；引用路径正确

### 交互
- [ ] 所有简单交互（跳转、切换、提醒）正常工作
- [ ] 业务逻辑部分已用 Toast 占位
- [ ] Mock 数据正确显示

### 数据
- [ ] `utils/mock.js` 包含所有页面的数据
- [ ] 各页面数据引用和渲染正确

---

## 十三、配置

- 在 `app.json` 中注册页面。
- 页面或组件引用自定义组件时，在对应 `.json` 文件中添加 `usingComponents`。
- 在 `.json` 中配置导航栏标题、颜色、下拉刷新和页面专属选项。

## 十四、验证

- 运行项目已有的构建或 lint 命令。
- 在微信开发者工具中打开输出结果，并与原型做视觉对比。
- 如果原型有响应式设计，检查 320、375、414 以及接近平板宽度的设备尺寸。
