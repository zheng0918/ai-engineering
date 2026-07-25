# pages — 页面开发规范

> 本文件规定小程序页面的结构、生命周期与组件化规范。

---

## 1. 页面文件结构

每个页面目录包含：

```
pages/goods/detail/
├── index.vue          # 页面主文件（单向，不使用 template/script/style 分离）
├── components/        # 页面私有组件
│   └── SkuSelector/
│       └── index.vue
└── hooks/             # 页面私有 hooks
    └── useGoodsDetail.ts
```

---

## 2. 页面模板（uniapp Vue 3 Composition API）

```vue
<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <u-navbar title="页面标题" :auto-back="true" />

    <!-- 内容区 -->
    <view class="page-content">
      <view v-if="loading" class="loading-wrap">
        <u-loading-page />
      </view>

      <view v-else-if="error" class="error-wrap">
        <u-empty :text="error" mode="data" />
        <u-button type="primary" @click="fetchData">重新加载</u-button>
      </view>

      <view v-else class="data-wrap">
        <!-- 实际内容 -->
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad, onShow, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';

/**
 * 商品详情页。
 */
interface PageParams {
  id: string;
}

const loading = ref(true);
const error = ref('');
const detail = ref<any>(null);

onLoad((options?: PageParams) => {
  if (options?.id) {
    fetchDetail(options.id);
  }
});

const fetchDetail = async (id: string) => {
  loading.value = true;
  error.value = '';
  try {
    // 请求数据
    loading.value = false;
  } catch (e: any) {
    error.value = e.message || '加载失败';
    loading.value = false;
  }
};

onReachBottom(() => {
  // 触底加载更多
});

onPullDownRefresh(async () => {
  await fetchDetail(detail.value?.id);
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: $bg-color;
}

.page-content {
  padding: $padding-md;
}
</style>
```

---

## 3. 页面规范

| 规范 | 要求 |
|---|---|
| 状态覆盖 | 每个页面必须处理 loading / error / empty / normal 四种状态 |
| 数据获取 | 统一在 `onLoad` 或 `onShow` 中发起，不写在模板中 |
| 加载更多 | 列表页必须支持 `onReachBottom` 分页加载 |
| 下拉刷新 | 列表页必须支持 `onPullDownRefresh` |
| 分享 | 核心页面必须实现 `onShareAppMessage` |
| 样式 | 使用 scoped SCSS，颜色使用变量，用 rpx 单位 |
| 日志 | 关键操作打日志（API 调用/页面进入/错误） |

---

## 4. 列表页模板

```vue
<template>
  <view class="list-page">
    <view v-if="list.length === 0 && !loading" class="empty-wrap">
      <u-empty text="暂无数据" mode="list" />
    </view>

    <view v-else class="list-wrap">
      <view v-for="item in list" :key="item.id" @click="goDetail(item.id)">
        <!-- 列表项 -->
      </view>

      <u-loadmore :status="loadStatus" />
    </view>
  </view>
</template>

<script setup lang="ts">
const pageNum = ref(1);
const list = ref<any[]>([]);
const loadStatus = ref<'loadmore' | 'loading' | 'nomore'>('loadmore');

const fetchList = async (isRefresh = false) => {
  if (isRefresh) { pageNum.value = 1; list.value = []; }
  loadStatus.value = 'loading';
  // 请求数据...
  if (noMore) loadStatus.value = 'nomore';
  else loadStatus.value = 'loadmore';
};
</script>
```

---

## 5. 页面四态体系（微信原生 — 每个页面必须覆盖）

> 每个数据驱动页面必须精确处理四种状态，缺一不可。

### 5.1 状态定义与触发条件

| 状态 | 触发条件 | WXML 条件 | 用户感知 |
|------|---------|-----------|---------|
| **loading** | 首次加载 / 切换类别 | `wx:if="{{loading}}"` | 骨架屏或 loading 动画 |
| **error** | 网络超时 / 接口异常 | `wx:elif="{{error}}"` | 错误插画 + 提示文案 + **重试按钮** |
| **empty** | 接口返回空列表 | `wx:elif="{{list.length === 0 && !loading}}"` | 空数据插画 + 引导文案 + CTA按钮 |
| **normal** | 数据加载成功 | `wx:else` | 正常内容渲染 |

### 5.2 WXML 模板

```xml
<view class="page">
  <!-- Loading 态 -->
  <view wx:if="{{loading}}" class="loading-wrap">
    <!-- 骨架屏：与真实列表项结构对应 -->
    <view wx:for="{{[1,2,3,4]}}" wx:key="*this" class="skeleton-item">
      <view class="skeleton-img"></view>
      <view class="skeleton-text">
        <view class="skeleton-line short"></view>
        <view class="skeleton-line long"></view>
      </view>
    </view>
  </view>

  <!-- Error 态 -->
  <view wx:elif="{{error}}" class="error-wrap">
    <view class="empty">
      <view class="ic">!</view>
      <view class="t">{{error}}</view>
      <button class="retry-btn" bindtap="onRetry">重新加载</button>
    </view>
  </view>

  <!-- Empty 态 -->
  <view wx:elif="{{list.length === 0 && !loading}}" class="empty-wrap">
    <view class="empty">
      <view class="ic">!</view>
      <view class="t">暂无数据</view>
      <button class="retry-btn" bindtap="onGoHome">去逛逛</button>
    </view>
  </view>

  <!-- Normal 态 -->
  <view wx:else class="list-wrap">
    <view wx:for="{{list}}" wx:key="id" class="list-item" bindtap="onItemTap" data-idx="{{index}}">
      <!-- 列表项内容 -->
    </view>
    <!-- 列表底部加载状态 -->
    <view class="loadmore">
      <text wx:if="{{loadStatus === 'loading'}}">加载中...</text>
      <text wx:elif="{{loadStatus === 'nomore'}}">— 已显示全部 —</text>
      <text wx:else>上拉加载更多</text>
    </view>
  </view>
</view>
```

### 5.3 每个状态的 UX 要求

| 状态 | 必须包含 | 禁止 |
|------|---------|------|
| **loading** | 骨架屏（结构与真实内容对应）或转圈指示器 | 空白页面 / 只剩导航栏 |
| **error** | 错误描述 + **重试按钮** | 只显示 toast 不显示页面级错误 |
| **empty** | 友好的空数据图标 + 引导文案 + **CTA按钮**（如"去逛逛"） | 白屏 / "暂无数据"几个字就没了 |
| **normal** | 列表内容 + 底部 loadmore 状态 | 数据加载了一半但没有最后一页提示 |

---

## 6. 列表分页模式（微信原生 — 每个列表页必须实现）

### 6.1 三态机

```
loadmore（可继续加载）
  ↓ 触底
loading（加载中，忽略重复触底）
  ↓ 返回数据
loadmore（还有更多） / nomore（已全部加载）
```

### 6.2 完整 JS 模板

```js
Page({
  data: {
    list: [],
    pageNum: 1,
    hasMore: true,
    loadStatus: 'loadmore',  // loadmore | loading | nomore
    loading: true,
    error: ''
  },

  onLoad() {
    this.fetchList(true);
  },

  onPullDownRefresh() {
    this.setData({ pageNum: 1, hasMore: true });
    this.fetchList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && this.data.loadStatus !== 'loading') {
      this.fetchList(false);
    }
  },

  fetchList(isRefresh) {
    if (isRefresh) {
      this.setData({ pageNum: 1, list: [], hasMore: true });
    }
    this.setData({ loading: true, error: '', loadStatus: 'loading' });

    api.getList({
      pageNum: this.data.pageNum,
      pageSize: 20
    }).then(function(res) {
      var newList = isRefresh ? res.list : this.data.list.concat(res.list);
      var noMore = res.list.length < 20;
      this.setData({
        list: newList,
        pageNum: this.data.pageNum + 1,
        hasMore: !noMore,
        loadStatus: noMore ? 'nomore' : 'loadmore',
        loading: false
      });
    }.bind(this)).catch(function(err) {
      this.setData({
        error: err.message || '加载失败',
        loading: false,
        loadStatus: 'loadmore'
      });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }.bind(this)).finally(function() {
      wx.stopPullDownRefresh();
    });
  },

  onRetry() {
    this.setData({ error: '', pageNum: 1, hasMore: true });
    this.fetchList(true);
  }
});
```

### 6.3 骨架屏 WXSS

```css
/* 骨架屏动画 */
.skeleton-item {
  display: flex;
  padding: 24rpx 18rpx;
  gap: 20rpx;
}
.skeleton-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: var(--line-soft);
  animation: shimmer 1.5s ease-in-out infinite;
}
.skeleton-text { flex: 1; display: flex; flex-direction: column; gap: 12rpx; justify-content: center; }
.skeleton-line {
  height: 28rpx;
  border-radius: 6rpx;
  background: var(--line-soft);
  animation: shimmer 1.5s ease-in-out infinite;
}
.skeleton-line.short { width: 60%; }
.skeleton-line.long  { width: 90%; }

@keyframes shimmer {
  0%   { opacity: 0.4; }
  50%  { opacity: 0.8; }
  100% { opacity: 0.4; }
}
```

---

## 7. 禁止事项
