# pages — 页面生成技能

> 本技能根据 `rule.md` 约束生成微信原生小程序页面（WXML + WXSS + JS + JSON）。

---

## 页面类型与模板

### 一、列表页（微信原生完整模板）

#### WXML

```xml
<view class="page">
  <!-- Loading 骨架屏 -->
  <view wx:if="{{loading}}" class="loading-wrap">
    <view wx:for="{{[1,2,3,4]}}" wx:key="*this" class="skeleton-item">
      <view class="skeleton-img"></view>
      <view class="skeleton-text">
        <view class="skeleton-line short"></view>
        <view class="skeleton-line long"></view>
      </view>
    </view>
  </view>

  <!-- Error -->
  <view wx:elif="{{error}}" class="empty-wrap">
    <view class="empty">
      <view class="ic">!</view>
      <view class="t">{{error}}</view>
      <button class="retry-btn" bindtap="onRetry">重新加载</button>
    </view>
  </view>

  <!-- Empty -->
  <view wx:elif="{{list.length === 0 && !loading}}" class="empty-wrap">
    <view class="empty">
      <view class="ic">!</view>
      <view class="t">暂无数据</view>
      <button class="retry-btn" bindtap="onGoHome">去逛逛</button>
    </view>
  </view>

  <!-- Normal 列表 -->
  <view wx:else class="list-wrap">
    <view wx:for="{{list}}" wx:key="id" class="item"
          bindtap="onItemTap" data-idx="{{index}}">
      <image src="{{item.coverUrl}}" mode="aspectFill" class="item-img" />
      <view class="item-info">
        <text class="item-title">{{item.name || item.model}}</text>
        <text class="item-desc">{{item.desc}}</text>
      </view>
    </view>

    <view class="loadmore">
      <text wx:if="{{loadStatus === 'loading'}}">加载中...</text>
      <text wx:elif="{{loadStatus === 'nomore'}}">— 已显示全部 —</text>
      <text wx:else>上拉加载更多</text>
    </view>
  </view>
</view>
```

#### JS

```js
var api = require('../../utils/api.js');

Page({
  data: {
    list: [],
    pageNum: 1,
    hasMore: true,
    loadStatus: 'loadmore',
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
    var self = this;
    self.setData({ loading: true, error: '', loadStatus: 'loading' });

    api.getData({
      pageNum: self.data.pageNum,
      pageSize: 20
    }).then(function(res) {
      var list = res.list || [];
      var newList = isRefresh ? list : self.data.list.concat(list);
      var noMore = list.length < 20;
      self.setData({
        list: newList,
        pageNum: self.data.pageNum + 1,
        hasMore: !noMore,
        loadStatus: noMore ? 'nomore' : 'loadmore',
        loading: false
      });
    }).catch(function(err) {
      self.setData({
        error: err.message || '加载失败',
        loading: false,
        loadStatus: 'loadmore'
      });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(function() {
      wx.stopPullDownRefresh();
    });
  },

  onRetry() {
    this.setData({ error: '', pageNum: 1, hasMore: true });
    this.fetchList(true);
  },

  onItemTap(e) {
    var idx = e.currentTarget.dataset.idx;
    var item = this.data.list[idx];
    if (!item) return;
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + item.id
    });
  }
});
```

#### WXSS（骨架屏）

```css
.page { min-height: 100vh; background: var(--bg); }

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

.loadmore { padding: 32rpx 0; text-align: center; color: var(--faint); font-size: 24rpx; }
```

---

### 二、详情页（微信原生）

```js
Page({
  data: {
    detail: null,
    loading: true,
    error: ''
  },

  onLoad(options) {
    var id = options.id || '';
    if (!id) {
      this.setData({ loading: false, error: '缺少参数' });
      return;
    }
    this.fetchDetail(id);
  },

  fetchDetail(id) {
    var self = this;
    self.setData({ loading: true, error: '' });
    api.getDetail(id).then(function(res) {
      self.setData({ detail: res, loading: false });
    }).catch(function(err) {
      self.setData({ loading: false, error: err.message || '加载失败' });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  onRetry() {
    var id = this.data.detail ? this.data.detail.id : '';
    if (id) this.fetchDetail(id);
  }
});
```

---

### 三、JSON 配置

每个页面需要对应的 `.json` 文件：

```json
{
  "navigationBarTitleText": "页面标题",
  "enablePullDownRefresh": true,
  "backgroundColor": "#F7F4EE",
  "backgroundTextStyle": "dark"
}
```

> 列表页必须设置 `"enablePullDownRefresh": true`。
