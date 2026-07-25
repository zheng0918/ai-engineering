# components — 组件开发规范

> 本文件规定小程序公共组件与业务组件的设计约束。

---

## 1. 组件分类

| 类型 | 位置 | 说明 |
|---|---|---|
| 基础组件 | `components/base/` | Button/NavBar/SearchBar 等原子组件 |
| 业务组件 | `components/biz/` | GoodsCard/OrderItem 等业务组件 |
| 页面私有组件 | `pages/{module}/components/` | 仅在当前页面使用 |

---

## 2. 组件模板

```vue
<template>
  <view class="goods-card" @click="handleClick">
    <image class="goods-card__image" :src="data.image" mode="aspectFill" />
    <view class="goods-card__info">
      <text class="goods-card__title">{{ data.title }}</text>
      <text class="goods-card__price">{{ data.price }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 商品卡片组件。
 *
 * @props data - 商品数据
 * @events click - 点击事件，回传商品 ID
 */
interface Props {
  data: {
    id: string;
    image: string;
    title: string;
    price: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [id: string];
}>();

const handleClick = () => {
  emit('click', props.data.id);
};
</script>

<style lang="scss" scoped>
.goods-card {
  display: flex;
  padding: $padding-md;
  background: $bg-color-white;
  border-radius: $border-radius-md;

  &__image {
    width: 180rpx;
    height: 180rpx;
    border-radius: $border-radius-sm;
  }

  &__info {
    flex: 1;
    margin-left: $padding-md;
  }

  &__title {
    font-size: $font-size-md;
    color: $text-color;
    @include text-ellipsis(2);
  }

  &__price {
    font-size: $font-size-lg;
    color: $danger-color;
    font-weight: bold;
    margin-top: $padding-xs;
  }
}
</style>
```

---

## 3. Props 与 Events 规范

```ts
// Props 使用 TypeScript interface
interface Props {
  data: XxxData;
  loading?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
});

// Events 使用类型声明
const emit = defineEmits<{
  click: [id: string];
  change: [value: any];
  close: [];
}>();
```

---

## 4. 组件命名规范

| 类型 | 目录名 | 入口文件 | 注册名 |
|---|---|---|---|
| 基础组件 | `BaseButton` | `index.vue` | `base-button` |
| 业务组件 | `GoodsCard` | `index.vue` | `goods-card` |
| 页面私有 | `SkuSelector` | `index.vue` | —（直接 import） |

---

## 6. 底部弹出面板（Bottom Sheet — 微信原生全局模式）

> 底部弹出面板是移动端最高频的非标准组件。微信原生无内置 Sheet，必须用 `mask + sheet` 模式实现。

### 6.1 结构规范

```
┌──────────────────┐
│  半透明遮罩 .mask  │  ← position: fixed; inset: 0; z-index: 1000
│  ┌──────────────┐│
│  │    拖拽手柄    ││  ← .grab（76rpx × 8rpx 圆角条）
│  │  .grab        ││
│  │              ││
│  │  标题 / 内容   ││  ← .sheet-title + 自定义内容
│  │              ││
│  │  操作按钮      ││  ← .ok-btn
│  └──────────────┘│
└──────────────────┘
```

### 6.2 全局 WXSS（app.wxss 中定义，所有页面复用）

```css
.mask {
  position: fixed;
  inset: 0;
  background: rgba(20,18,15,.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
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
```

### 6.3 使用场景与变体

| 场景 | Sheet 内容 | 关闭方式 |
|------|-----------|---------|
| 登录引导 | 品牌图标 + 手机号登录按钮 + 协议勾选 | 点击遮罩 / 登录成功 |
| 二维码展示 | 二维码图片 + 保存按钮 | 点击遮罩 / 按钮关闭 |
| 账号信息 | 账号文本 + 复制按钮 | 点击遮罩 / 按钮关闭 |
| 选项选择 | 选项列表 | 点击遮罩 / 选中后关闭 |

### 6.4 JS 交互规范

```js
// Sheet 必须阻止点击穿透
onSheetContentTap() {},  // catchtap 绑定此方法

// 点击遮罩关闭
onSheetClose() {
  this.setData({ sheetVisible: false });
}
```

---

## 7. 轮播横幅（Swiper Banner）

### 7.1 标准模板

```xml
<swiper class="banner" indicator-dots="{{true}}" autoplay="{{true}}"
        interval="{{4000}}" duration="{{500}}" circular="{{true}}">
  <swiper-item wx:for="{{banners}}" wx:key="id">
    <view class="banner-slide" style="background: {{item.stoneColor}}">
      <text class="banner-h">{{item.h}}</text>
      <text class="banner-sub">{{item.sub}}</text>
      <text class="banner-tags">{{item.tags}}</text>
    </view>
  </swiper-item>
</swiper>
```

### 7.2 指示器样式

```css
/* 自定义指示器 */
.banner .wx-swiper-dots.wx-swiper-dots-horizontal {
  bottom: 16rpx;
}
.banner .wx-swiper-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255,255,255,.4);
}
.banner .wx-swiper-dot.wx-swiper-dot-active {
  background: rgba(255,255,255,.9);
}
```

### 7.3 禁止事项

- ❌ `interval` 小于 3000ms（太快用户看不清）
- ❌ 数据源硬编码在 WXML 中（必须从 JS data 绑定）
- ❌ 不设 `circular`（最后一页到第一页的循环体验断裂）

---

## 8. 禁止事项
