# style — 样式规范

> 本文件规定小程序 SCSS/CSS 编写约束、设计 Token 体系与图标规范。

---

## 1. 技术选型

| 框架 | 样式方案 | 设计 Token 方案 |
|------|---------|----------------|
| **微信原生** | WXSS（CSS 子集） | CSS 自定义属性（`--token`）|
| **uniapp** | SCSS | SCSS 变量（`$token`）|
| **taro** | SCSS | SCSS 变量（`$token`）|

- 使用 **rpx** 作为尺寸单位（750rpx = 屏幕宽度）
- 微信原生不支持 SCSS，必须使用 WXSS + CSS 自定义属性
- uniapp / taro 使用 SCSS 变量

---

## 2. SCSS 变量规范

```scss
// styles/variables.scss
// 所有颜色、字号、间距必须在这里定义，禁止在组件/页面中硬编码

// ===== 主题色 =====
$primary-color: #1989fa;
$primary-light: #e8f4ff;
$primary-dark: #1676d2;
$success-color: #07c160;
$warning-color: #ff976a;
$danger-color: #ee0a24;

// ===== 文字色 =====
$text-color: #323233;
$text-color-secondary: #646566;
$text-color-light: #969799;
$text-color-placeholder: #c8c9cc;

// ===== 背景色 =====
$bg-color: #f7f8fa;
$bg-white: #ffffff;
$bg-mask: rgba(0, 0, 0, 0.5);

// ===== 边框色 =====
$border-color: #ebedf0;
$border-color-dark: #dcdee0;

// ===== 字号 =====
$font-10: 20rpx;
$font-12: 24rpx;
$font-13: 26rpx;
$font-14: 28rpx;
$font-15: 30rpx;
$font-16: 32rpx;
$font-18: 36rpx;
$font-20: 40rpx;

// ===== 间距 =====
$spacing-1: 4rpx;
$spacing-2: 8rpx;
$spacing-3: 12rpx;
$spacing-4: 16rpx;
$spacing-5: 20rpx;
$spacing-6: 24rpx;
$spacing-8: 32rpx;
$spacing-10: 40rpx;

// ===== 圆角 =====
$radius-sm: 8rpx;
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-round: 9999rpx;
```

---

## 3. SCSS Mixin 规范

```scss
// styles/mixins.scss

// 文本省略（单行/多行）
@mixin text-ellipsis($line: 1) {
  overflow: hidden;
  text-overflow: ellipsis;
  @if $line == 1 {
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $line;
    -webkit-box-orient: vertical;
  }
}

// flex 居中
@mixin flex-center($direction: row) {
  display: flex;
  flex-direction: $direction;
  justify-content: center;
  align-items: center;
}

// 1px 边框（适配高清屏）
@mixin hairline($color: $border-color, $direction: bottom) {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    #{$direction}: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: $color;
    transform: scaleY(0.5);
  }
}

// 安全区域底部
@mixin safe-bottom($min-height: 0) {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  @if $min-height > 0 {
    min-height: $min-height;
  }
}
```

---

## 4. CSS 命名规范（BEM）

```
.block {}
.block__element {}
.block--modifier {}
```

示例：
```scss
.goods-card {                          // 块
  &__image { ... }                     // 元素
  &__title { ... }                     // 元素
  &--featured {                        // 修饰符
    border: 2rpx solid $primary-color;
  }
}
```

---

## 5. CSS 自定义属性 / 设计 Token（微信原生专用）

> 微信原生小程序不支持 SCSS，必须使用 CSS 自定义属性（Custom Properties）作为设计 Token 体系。

### 5.1 Token 定义（app.wxss）

```css
/* app.wxss — 全局 CSS 自定义属性 */
page {
  /* 背景 */
  --bg: #F7F4EE;
  --surface: #FFFFFF;

  /* 文字 */
  --ink: #211C16;
  --muted: #7E7567;
  --faint: #ACA292;

  /* 品牌 */
  --brand: #A8814A;
  --brand-soft: #D2B074;
  --brand-deep: #8A6638;

  /* 线条 */
  --line: #E7E1D6;
  --line-soft: #F1ECE2;

  /* 阴影 */
  --shadow: 0 12px 34px rgba(33,28,22,.12);
  --shadow-soft: 0 4px 18px rgba(33,28,22,.07);

  /* 圆角 */
  --r: 16px;

  /* 底色 */
  background-color: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  color: var(--ink);
  font-size: 28rpx;
  box-sizing: border-box;
}
```

### 5.2 Token 分层原则

| 层级 | 命名 | 用途 | 示例变量 |
|------|------|------|----------|
| 背景 | `--bg` / `--surface` | 页面底色、卡片底色 | `--bg: #F7F4EE`、`--surface: #FFFFFF` |
| 文字 | `--ink` / `--muted` / `--faint` | 主文字、次要文字、辅助文字 | `--ink: #211C16`、`--muted: #7E7567` |
| 品牌 | `--brand` / `--brand-soft` / `--brand-deep` | 品牌主色、浅色、深色 | `--brand: #A8814A` |
| 线条 | `--line` / `--line-soft` | 分割线、边框 | `--line: #E7E1D6` |
| 阴影 | `--shadow` / `--shadow-soft` | 卡片投影 | `--shadow: 0 12px 34px rgba(...)` |
| 间距 | `--spacing-xs` ~ `--spacing-xl` | 内边距、外边距 | 同 SCSS 变量体系 |
| 字号 | `--font-10` ~ `--font-20` | 字体大小 | 同 SCSS 变量体系 |

### 5.3 暗黑模式适配（按需）

```css
@media (prefers-color-scheme: dark) {
  page {
    --bg: #1A1611;
    --surface: #2C2822;
    --ink: #E7E1D6;
    --muted: #ACA292;
    --faint: #7E7567;
    --line: #3A3630;
    --shadow: 0 12px 34px rgba(0,0,0,.3);
  }
}
```

---

## 6. 图标规范

> 图标是设计系统的一等公民，直接决定小程序的视觉品质。同一项目只能选择一种主方案，禁止混用。

### 6.1 图标来源（三选一，禁止混用）

| 方案 | 适用场景 | 来源 | 格式 |
|------|---------|------|------|
| **A: Lucide PNG**（推荐正式项目） | 追求设计质量，图标数量确定 | [Lucide](https://lucide.dev/) 开源图标库，Node.js 脚本批量下载 SVG → 转 PNG | PNG 文件，`assets/icons/` |
| **B: Lucide Base64**（推荐快速原型） | 快速验证，图标数量少 | Lucide 开源图标库，脚本生成 base64 Data URI | JS 模块，`utils/icons.js` |
| **C: CSS 图形**（仅补充） | 极简单图形（关闭×、箭头→） | 纯 CSS border / transform | WXSS 类 |

> 为什么选 Lucide：shadcn/ui 默认图标库，1000+ 极简线条风格，ISC 开源协议，社区最活跃的现代图标库。

### 6.2 图标尺寸标准

| 场景 | 尺寸 | 说明 |
|------|------|------|
| TabBar 图标 | 48rpx × 48rpx | `app.json` 中 `iconPath` 自动缩放 |
| 导航栏图标 | 40rpx × 40rpx | 顶栏操作按钮 |
| 列表行图标 | 36rpx × 36rpx | 菜单行 / 功能入口前导图标 |
| 行内图标 | 28rpx × 28rpx | 与文字同行混排 |
| 空状态大图标 | 108rpx × 108rpx | 空数据插画占位 |
| 视频播放按钮 | 64rpx × 64rpx | 视频封面叠加 |

### 6.3 图标颜色规范

- 图标颜色**必须使用 CSS 变量**，禁止硬编码色值（`fill="red"` / `style="color:#333"`）
- 默认态：`var(--faint)` 或 `var(--muted)`
- 激活态：`var(--brand)` 或品牌主色
- 禁用态：`#C8C9CC`（统一灰色，不可变）
- 方案 A（PNG）在生成时已固化颜色 → 激活态需单独生成 `-active` 变体
- 方案 B（Base64）在 JS 生成时配置颜色 → 支持同一图标多色 key

### 6.4 图标命名规范

| 方案 | 文件/变量命名 | 示例 |
|------|-------------|------|
| PNG | `icon-{name}.png` / `icon-{name}-active.png` | `icon-heart.png`、`icon-heart-active.png`、`icon-play-lg.png` |
| Base64 key | camelCase | `homeIcon`、`heartIcon`、`heartActiveIcon` |
| CSS 类 | `.ic-{name}` | `.ic-close`、`.ic-arrow-right` |

### 6.5 WXML 引用方式

```xml
<!-- 方案 A: PNG -->
<image src="/assets/icons/icon-heart.png" class="ic" mode="aspectFit" />

<!-- 方案 B: Base64（JS 中引入 icons.js，data 绑定） -->
<image src="{{icons.heart}}" class="ic" mode="aspectFit" />

<!-- 方案 C: CSS -->
<view class="ic-close"></view>
```

### 6.6 CSS 图形补充（仅限以下场景）

```css
/* 关闭按钮 ×（方案 C 唯一适用的场景之一） */
.ic-close {
  position: relative;
  width: 32rpx;
  height: 32rpx;
}
.ic-close::before, .ic-close::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2rpx;
  height: 100%;
  background: var(--muted);
}
.ic-close::before { transform: translate(-50%, -50%) rotate(45deg); }
.ic-close::after  { transform: translate(-50%, -50%) rotate(-45deg); }

/* 右箭头 → */
.ic-arrow-right {
  width: 0;
  height: 0;
  border-top: 8rpx solid transparent;
  border-bottom: 8rpx solid transparent;
  border-left: 8rpx solid var(--muted);
}
```

---

## 7. 禁止事项

- ❌ 内联样式（`style="color: red"`）—— 必须用 class
- ❌ 硬编码颜色值 —— 必须用 SCSS 变量 或 CSS 自定义属性
- ❌ px 单位 —— 必须用 rpx
- ❌ 嵌套超过 3 层
- ❌ 不使用 scoped（uniapp/taro）或 BEM 命名（微信原生）
- ❌ CSS 类名不用 BEM
- ❌ 同一项目混用多种图标方案（A/B/C 只能选一种主方案）
- ❌ 图标颜色硬编码（必须用 CSS 变量，激活态用 `-active` 变体文件）
- ❌ 图标尺寸不统一（同一场景不同尺寸）
- ❌ 用 emoji 替代图标（各平台渲染不一致）
- ❌ 多个图标库混用（Lucide + FontAwesome + Iconfont 混搭）
