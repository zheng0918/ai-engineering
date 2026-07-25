# style — 样式生成技能

> 本技能生成设计 Token、全局样式、工具类与图标。

---

## 生成清单

| 框架 | 产物 |
|------|------|
| 微信原生 | `app.wxss`（CSS 自定义属性 + 全局工具类 + 组件样式） |
| uniapp | `styles/variables.scss` + `styles/mixins.scss` + `styles/global.scss` + `uni.scss` |
| taro | `styles/variables.scss` + `styles/global.scss` + `app.scss` |

---

## 一、微信原生 WXSS 完整模板

### app.wxss

```css
/* ===== CSS 自定义属性 / 设计 Token ===== */
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

  background-color: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  color: var(--ink);
  font-size: 28rpx;
  box-sizing: border-box;
}

/* ===== Flex 工具类 ===== */
.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }

/* ===== 文本 ===== */
.text-center { text-align: center; }
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Section 标题 ===== */
.sectit {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin: 26rpx 18rpx 14rpx;
}
.sectit .cn {
  font-size: 34rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}
.sectit .en {
  font-style: italic;
  color: var(--brand);
  font-size: 30rpx;
}

/* ===== 分割线 ===== */
.rule {
  height: 1px;
  background: var(--line);
  margin: 0 18rpx;
}

/* ===== 搜索栏 ===== */
.search {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin: 18rpx 18rpx 0;
  height: 46px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14rpx;
  padding: 0 8rpx 0 16rpx;
  box-shadow: var(--shadow-soft);
}
.search input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 28rpx;
  color: var(--ink);
}
.search .search-placeholder {
  color: var(--faint);
  font-size: 28rpx;
}
.search .go {
  padding: 0 14rpx;
  height: 34rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: var(--ink);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
}
.search .go::after { border: none; }

/* ===== 空状态 ===== */
.empty {
  padding: 160rpx 60rpx;
  text-align: center;
  color: var(--faint);
}
.empty .ic {
  margin: 0 auto 28rpx;
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  border: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--faint);
}
.empty .t {
  font-size: 26rpx;
  letter-spacing: 1rpx;
}

/* ===== 遮罩层 ===== */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(20,18,15,.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

/* ===== 底部弹出面板 ===== */
.sheet {
  width: 100%;
  background: var(--bg);
  border-radius: 48rpx 48rpx 0 0;
  padding: 16rpx 44rpx 60rpx;
}
.sheet .grab {
  width: 76rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: var(--line);
  margin: 16rpx auto 36rpx;
}
.sheet .sheet-title {
  margin: 0 0 8rpx;
  font-size: 34rpx;
  text-align: center;
  letter-spacing: 2rpx;
  font-weight: 600;
}
.sheet .sub {
  text-align: center;
  color: var(--muted);
  font-size: 24rpx;
  margin-bottom: 40rpx;
}
.sheet .ok-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 26rpx;
  background: var(--ink);
  color: #fff;
  font-size: 30rpx;
  letter-spacing: 2rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.sheet .ok-btn::after { border: none; }

/* ===== 品牌图标 ===== */
.brand-icon {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #1A1611;
  margin: 0 auto 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-soft);
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

/* ===== 微信登录按钮 ===== */
.wx-login-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 26rpx;
  background: #1A1611;
  color: #E8DCC6;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.wx-login-btn::after { border: none; }

/* ===== 协议勾选行 ===== */
.agree-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 20rpx;
  padding: 8rpx 0;
}
.agree-check {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #ACA292;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  box-sizing: border-box;
}
.agree-check.checked {
  background: var(--brand-soft);
  border-color: var(--brand-soft);
}
.agree-text {
  font-size: 20rpx;
  color: var(--faint);
  letter-spacing: 1rpx;
}
.agree-link {
  color: var(--brand);
}
```

---

## 二、SCSS 变量与 Mixin 模板（uniapp/taro）

### variables.scss

```scss
// 主题色
$primary-color: #1989fa;
$primary-light: #e8f4ff;
$primary-dark: #1676d2;
$success-color: #07c160;
$warning-color: #ff976a;
$danger-color: #ee0a24;

// 文字色
$text-color: #323233;
$text-color-secondary: #646566;
$text-color-light: #969799;
$text-color-placeholder: #c8c9cc;

// 背景色
$bg-color: #f7f8fa;
$bg-white: #ffffff;
$bg-mask: rgba(0, 0, 0, 0.5);

// 边框色
$border-color: #ebedf0;
$border-color-dark: #dcdee0;

// 字号
$font-10: 20rpx; $font-12: 24rpx; $font-13: 26rpx;
$font-14: 28rpx; $font-15: 30rpx; $font-16: 32rpx;
$font-18: 36rpx; $font-20: 40rpx;

// 间距
$spacing-1: 4rpx; $spacing-2: 8rpx; $spacing-3: 12rpx;
$spacing-4: 16rpx; $spacing-5: 20rpx; $spacing-6: 24rpx;
$spacing-8: 32rpx; $spacing-10: 40rpx;

// 圆角
$radius-sm: 8rpx; $radius-md: 12rpx;
$radius-lg: 16rpx; $radius-round: 9999rpx;
```

### mixins.scss

```scss
@mixin text-ellipsis($line: 1) {
  overflow: hidden;
  text-overflow: ellipsis;
  @if $line == 1 { white-space: nowrap; }
  @else {
    display: -webkit-box;
    -webkit-line-clamp: $line;
    -webkit-box-orient: vertical;
  }
}

@mixin flex-center($direction: row) {
  display: flex;
  flex-direction: $direction;
  justify-content: center;
  align-items: center;
}

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

@mixin safe-bottom($min-height: 0) {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  @if $min-height > 0 { min-height: $min-height; }
}
```

---

## 三、图标生成流程

### 方案 A：Lucide → PNG（正式项目）

**步骤：**

1. 确定项目所需的全部图标清单（按页面功能列出）
2. 在 `scripts/generate_icons_png.js` 的 `ICONS` 数组中配置图标名、输出文件名和颜色
3. 运行 `node scripts/generate_icons_png.js`
4. 输出到 `miniprogram/assets/icons/`

**WXML 引用：**

```xml
<image src="/assets/icons/icon-heart.png" class="ic-heart" mode="aspectFit" />
<image src="/assets/icons/icon-heart-active.png" class="ic-heart" mode="aspectFit" />
```

**WXSS 尺寸：**

```css
.ic-heart { width: 36rpx; height: 36rpx; }
```

### 方案 B：Lucide → Base64（快速原型）

**步骤：**

1. 运行 `node scripts/generate_icons_base64.js`（配置 ICONS 数组的颜色和 key）
2. 输出到 `miniprogram/utils/icons.js`
3. 在页面 JS 中引入并绑定到 data

**JS 引用：**

```js
const icons = require('../../utils/icons')
Page({
  data: { icons }
})
```

**WXML 引用：**

```xml
<image src="{{icons.heart}}" class="ic" mode="aspectFit" />
<image src="{{icons.heartActive}}" class="ic" mode="aspectFit" />
```

### 方案 C：CSS 图形（补充）

仅用于极简单图形（关闭按钮 ×、箭头 →），其他一律用 A 或 B。

```css
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
```

---

## 四、常用 Lucide 图标映射参考

| 用途 | Lucide 图标名 | 推荐色 |
|------|-------------|--------|
| 首页 | `house` | `#94a3b8` / 激活 `#3b82f6` |
| 搜索 | `search` | `#94a3b8` |
| 用户 | `user` | `#94a3b8` |
| 收藏 | `heart` | `#94a3b8` / 激活 `#ef4444` |
| 设置 | `settings` | `#94a3b8` |
| 分享 | `share-2` | `#94a3b8` |
| 箭头左 | `chevron-left` | `#333333` |
| 箭头右 | `chevron-right` | `#333333` |
| 箭头下 | `chevron-down` | `#94a3b8` |
| 关闭 | `x` | `#333333` |
| 播放 | `play` | `#ffffff` |
| 图片 | `image` | `#94a3b8` |
| 位置 | `map-pin` | `#94a3b8` |
| 电话 | `phone` | `#94a3b8` |
| 更多 | `more-horizontal` | `#333333` |
| 勾选 | `check` | `#07c160` |

> 完整列表：https://lucide.dev/icons/
