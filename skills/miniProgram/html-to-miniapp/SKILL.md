---
name: html-to-miniapp
description: 将 HTML/React/Vue 等前端 Demo 页面或高保真原型转换为微信原生小程序、uni-app 或 Taro 项目。重点是转换前端页面 UI 和简单交互（页面跳转、Tab 切换、弹窗提醒等），不涉及业务逻辑，数据集中在 mock.js 中管理。
---

# HTML 转小程序

将任意前端 Demo（HTML/React/Vue 单文件或多文件）或高保真 HTML 原型转换为三类小程序目标之一：**微信原生小程序**、**uni-app** 或 **Taro**。优先保持视觉还原度，再按目标运行时的组件模型、生命周期、路由、资源规则与样式限制改写行为。

> [!IMPORTANT]
> **转换范围**：仅转换前端页面 UI 和简单交互（页面跳转、Tab 切换、Toast 提醒、弹窗等），**不实现业务逻辑**（如网络请求、用户认证、数据持久化等）。所有页面用到的数据统一整合在 `utils/mock.js` 中管理。

> [!IMPORTANT]
> **交互语言**：与用户的所有对话、确认、提问、说明必须使用**中文**。代码中的变量名、文件路径等技术标识符保留英文。

> [!CAUTION]
> **连续执行**：用户确认设计决策（阶段 1）后，阶段 2 ~ 5（生成蓝图、初始化骨架、逐页转换、验证）必须**一口气连续完成**，中间不得暂停等待用户确认。不要在完成几个页面后就停下来汇报进度或请求继续——**所有页面必须连续完成后再进入验证阶段**。只有在遇到**无法自主决策的问题**时才暂停询问用户。

---

## 目标选择

编辑代码前先询问或推断目标平台：

- **微信原生小程序**：输出 `.wxml`、`.wxss`、`.js`、`.json`、`app.*` 以及页面/组件目录。详见 `references/native-mini-program.md`。
- **uni-app**：输出 `.vue` 单文件页面/组件，更新 `pages.json`、`manifest.json`，并使用 `uni.*` API。详见 `references/uni-app.md`。
- **Taro**：输出 React 风格的 `.tsx/.jsx` 页面/组件、Taro 组件、`app.config`、页面配置与 Taro API。详见 `references/taro.md`。

如果用户未指定目标平台，且仓库也无法明确识别已有技术栈，提出一个简短问题确认目标。

---

## 一、转换流程（按顺序执行）

### 阶段 1：分析源文件 → 确认设计决策

1. **通读 Demo 源码**，提取以下信息：
   - **页面数量与路由结构**（识别所有"视图/路由/Tab"）
   - 组件层级关系
   - 样式体系（CSS 变量、设计系统、色板）
   - 图标方案（Lucide 图标名称、颜色、尺寸），列出所有使用的图标
   - 交互逻辑（点击事件、Tab 切换、页面跳转、弹窗提醒等简单交互）
   - 数据模型（用于 Mock 数据的结构）

   > [!CAUTION]
   > **页面提取是最关键的步骤，遗漏页面会导致最终产物缺页。** 必须通过以下方式**交叉验证**，确保不遗漏任何页面：
   >
   > 1. **路由配置**：检查 Router 配置、hash 路由、Tab 定义等，提取所有注册的路由
   > 2. **导航链接**：搜索源码中所有 `href`、`to`、`router.push`、`navigate` 等跳转目标
   > 3. **JS 事件跳转**：搜索 `onClick`、`handleClick` 等事件处理函数中的页面跳转逻辑
   > 4. **条件渲染的视图**：检查 `v-if`、`v-show`、`{condition && <Component>}` 等条件渲染，识别隐藏的子视图/页面
   > 5. **HTML 页面结构**：如果是单 HTML 文件，搜索所有 `section`/`div` 中通过 CSS `display:none` 或 JS 切换显示的独立视图
   >
   > 分析完成后，**必须明确告知用户总页面数**（如"共发现 13 个页面：4 个 TabBar 页面 + 9 个子页面"），让用户确认是否有遗漏。

2. 如果原型不是很简单，运行 `scripts/analyze_html.py <html-file-or-dir>` 快速盘点标签、类名、id、资源、链接、脚本、表单、内联样式、颜色、字号、字体、单位和高风险 CSS。

3. **在生成蓝图之前，必须先与用户确认以下设计决策**：

   > [!CAUTION]
   > 以下决策直接影响蓝图内容和后续实现方式，**必须在蓝图创建前完成确认**，避免蓝图与实际执行脱节。

   - **页面完整性**：告知用户发现的页面总数和清单，确认是否有遗漏（使用固定模板）
   - **目标平台**（如果尚未明确）：微信原生 / uni-app / Taro
   - **TabBar 样式**：系统默认 or 自定义（浮动胶囊等特殊设计需自定义）
   - **导航栏样式**：默认 or 自定义
   - **图标方案**（向用户说明两种方案的优劣，让用户选择）：
     - **方案 A：Lucide Base64 内联图标**（快速原型）— 通过脚本自动生成 base64 Data URI，无需额外资源文件，图标现代简约
     - **方案 B：Lucide SVG 转 PNG 图片** — 视觉效果精准，图标文件独立管理，适合对图标质量有要求的正式项目

   页面完整性确认模板（必须原样输出结构）：

   ```markdown
   已识别页面总数：N（TabBar: X，子页面: Y）
   TabBar 页面：
   - pages/xxx/xxx
   - pages/xxx/xxx
   子页面：
   - pages/xxx/xxx
   - pages/xxx/xxx
   疑似遗漏页面（若无则写"无"）：
   - ...
   ```

### 阶段 2：生成转换蓝图

根据阶段 1 的分析结果和用户确认的设计决策，**创建转换蓝图文件** `conversion-blueprint.md`，置于项目根目录。

> [!IMPORTANT]
> 蓝图是整个转换过程的**单一事实来源**。蓝图内容必须与用户确认的设计决策一致。

蓝图包含以下内容：

```markdown
# [项目名] 转换蓝图

## 一、页面清单

| 序号 | 页面名称 | 路径 | 类型 |
|------|---------|------|------|
| 1 | 首页 | pages/home/home | TabBar |
| 2 | 详情页 | pages/detail/detail | 子页面 |
| ... | ... | ... | ... |

## 二、路由结构

- TabBar 页面：[列表]
- 子页面：[列表]
- 页面间跳转关系：[描述]

## 三、组件层级

- 全局组件：[列表]
- 页面私有组件：[列表]

## 四、样式体系

- CSS 变量/设计 Token：[列出关键变量]
- 色板：[主色、辅色、背景色等]
- 字体：[字号体系]

## 五、图标方案：[Lucide Base64 / Lucide PNG]

## 六、交互逻辑

| 交互类型 | 描述 | 所在页面 |
|---------|------|--------|
| Tab 切换 | 底部 TabBar 导航 | 全局 |
| 页面跳转 | 点击卡片进入详情 | 首页 |
| ... | ... | ... |

## 七、Mock 数据结构

- [列出每个页面需要的 Mock 数据字段和结构]
```

### 阶段 3：初始化项目骨架

按目标平台的约定创建项目骨架。详细文件结构见各平台参考文档。

通用原则：
- 小程序项目生成在**单独的目录**中（如 `miniprogram/`），与源 Demo 文件分离
- 先创建全局配置（`app.*`），再创建工具文件（`utils/mock.js`），最后逐页创建
- `project.config.json`（微信原生）或 `manifest.json`（uni-app）需正确配置源码目录

### 阶段 4：逐页转换（先 TabBar 页面，再子页面）

- 严格按照蓝图中的页面清单顺序逐页转换
- 所有页面数据从 `utils/mock.js` 引入
- 交互逻辑仅实现简单交互（跳转用 `wx.navigateTo` / `uni.navigateTo` / `Taro.navigateTo`，提醒用 `showToast` / `showModal`）
- 业务逻辑部分用 Toast 占位：`wx.showToast({ title: '功能开发中', icon: 'none' })`

**单个页面的转换步骤：**

1. **配置**（`.json` / `pages.json` / `index.config`）：设置页面标题、导航栏样式、引用的自定义组件
2. **结构**（`.wxml` / `.vue` `<template>` / `.tsx`）：对照 Demo 源码逐元素转换，按标签映射表替换标签
3. **样式**（`.wxss` / `<style scoped>` / `.scss`）：迁移对应 CSS，按样式转换规则处理单位、选择器和布局
4. **逻辑**（`.js` / `<script>` / hooks）：从 `mock.js` 引入数据，在生命周期中 `setData`，绑定简单交互事件

### 阶段 5：逐项验证

按照蓝图文件进行逐步验证，详见各平台参考文档中的验证 checklist。

---

## 二、核心转换规则（跨平台通用）

### 标签映射原则

| HTML / React | 通用小程序映射 | 说明 |
|---|---|---|
| `<div>` `<section>` `<main>` `<article>` `<header>` `<footer>` `<nav>` | `view` | 通用容器 |
| `<span>` `<p>` `<strong>` `<em>` `<label>` 纯文本 | `text` | 文本必须包在 text 中 |
| `<img>` | `image` | 必须设宽高；常用 mode：`aspectFill`、`widthFix`、`aspectFit` |
| `<a href>` | `navigator` / 事件 | 动作型链接改为点击处理 |
| `<ul>` `<li>` | `view` + 列表渲染 | `wx:for` / `v-for` / `.map()` |
| `<svg>` | 不支持 | 用 image 或图标替代方案 |
| `<input>` `<textarea>` `<select>` | 对应表单组件 | 事件名不同 |
| `<button>` | `button` / `view` | 视需求选择 |
| 轮播图（JS 库） | `swiper` + `swiper-item` | 内置轮播组件 |
| `<video>` | `video` | 原生组件 |

### 样式转换原则

1. **单位转换**：`px` → `rpx`（1px = 2rpx，基于 375px 设计稿），border 保留 `1px`
2. **选择器**：避免标签选择器和属性选择器，优先用类选择器
3. **布局**：优先使用 Flex 布局；Grid 需确认目标平台支持情况
4. **组件**：推荐 WeUI 或 Vant Weapp 补充原生组件不足；组件库优先，手写次之
5. **品味**：骨架屏代替 spinner 加载、空状态用插画+文案+按钮、圆角卡片、适当留白间距
6. **不支持的能力**：DOM API、复杂选择器、CSS 变量（部分平台）、Web 字体、滤镜（部分平台）

详细的标签映射、事件映射、样式规则、路由导航、数据绑定等内容，请查阅对应平台的参考文档。

---

## 三、资源

- `scripts/analyze_html.py`：检查 HTML/CSS 文件或目录，输出 JSON 盘点结果，用于规划转换。
- `references/native-mini-program.md`：微信原生小程序完整转换参考，包含标签映射、事件映射、样式规则、图标方案、自定义 TabBar/导航栏、Mock 数据管理、常见陷阱和验证 checklist。
- `references/uni-app.md`：uni-app 转换参考，包含 Vue 模板映射、uni.* API、样式规则和 pages.json 配置。
- `references/taro.md`：Taro 转换参考，包含 React/JSX 映射、Taro API、样式方案和 app.config 配置。
