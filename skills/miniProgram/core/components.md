# components — 组件生成技能

> 本技能根据 `rule.md` 约束生成微信原生小程序组件（WXML + WXSS + JS + JSON）。

---

## 一、底部弹出面板（Bottom Sheet）完整模板

### WXML

```xml
<!-- mask + sheet 结构 -->
<view class="mask" wx:if="{{sheetVisible}}" bindtap="onSheetClose">
  <view class="sheet" catchtap="onSheetContentTap">
    <view class="grab"></view>
    <view class="sheet-title">{{sheetTitle}}</view>
    <view class="sub">{{sheetSub}}</view>

    <!-- 按场景自定义内容区 -->
    <!-- 场景1：二维码 -->
    <image wx:if="{{sheetType === 'qr'}}" class="qr-img"
           src="{{sheetQrUrl}}" mode="aspectFit" />

    <!-- 场景2：账号信息 -->
    <view wx:elif="{{sheetType === 'acct'}}" class="acct">{{sheetVal}}</view>

    <!-- 操作按钮 -->
    <view class="ok-btn" bindtap="onSheetOk">{{sheetBtnText || '确定'}}</view>
  </view>
</view>
```

### JS

```js
Page({
  data: {
    sheetVisible: false,
    sheetTitle: '',
    sheetSub: '',
    sheetType: '',
    sheetVal: '',
    sheetQrUrl: '',
    sheetBtnText: ''
  },

  // Sheet 关闭/打开
  onSheetClose() { this.setData({ sheetVisible: false }); },
  onSheetContentTap() {},  // 阻止穿透

  // 场景驱动打开
  openSheet(item) {
    this.setData({
      sheetVisible: true,
      sheetTitle: item.name,
      sheetSub: item.type === 'qr' ? '长按保存或截图识别' : '复制后在 App 内搜索',
      sheetType: item.type,
      sheetVal: item.val || '',
      sheetQrUrl: item.qrUrl || '',
      sheetBtnText: item.type === 'qr' ? '保存图片' : '复制账号'
    });
  },

  onSheetOk() {
    if (this.data.sheetType === 'acct') {
      wx.setClipboardData({ data: this.data.sheetVal });
      wx.showToast({ title: '已复制', icon: 'none' });
    }
    this.setData({ sheetVisible: false });
  }
});
```

---

## 二、轮播横幅组件

### WXML

```xml
<swiper class="banner" indicator-dots="{{true}}" autoplay="{{true}}"
        interval="{{4000}}" duration="{{500}}" circular="{{true}}">
  <swiper-item wx:for="{{banners}}" wx:key="id">
    <view class="banner-slide" style="background: {{item.stoneColor}}">
      <view class="banner-content">
        <text class="banner-h">{{item.h}}</text>
        <text class="banner-sub">{{item.sub}}</text>
        <text class="banner-tags">{{item.tags}}</text>
      </view>
    </view>
  </swiper-item>
</swiper>
```

### WXSS

```css
.banner { width: 100%; height: 440rpx; }
.banner-slide {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  box-sizing: border-box;
}
.banner-content { text-align: center; color: #fff; text-shadow: 0 4rpx 16rpx rgba(0,0,0,.2); }
.banner-h { display: block; font-size: 48rpx; font-weight: 700; letter-spacing: 6rpx; margin-bottom: 16rpx; }
.banner-sub { display: block; font-size: 26rpx; letter-spacing: 2rpx; opacity: .85; font-style: italic; margin-bottom: 16rpx; }
.banner-tags { display: block; font-size: 22rpx; opacity: .65; white-space: pre-line; }

/* 自定义指示器 */
.banner .wx-swiper-dots.wx-swiper-dots-horizontal { bottom: 16rpx; }
.banner .wx-swiper-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: rgba(255,255,255,.4); }
.banner .wx-swiper-dot.wx-swiper-dot-active { background: rgba(255,255,255,.9); }
```

---

## 三、业务卡片组件（通用模板）

### WXML

```xml
<view class="card" bindtap="onTap" data-id="{{item.id}}">
  <image src="{{item.coverUrl}}" mode="aspectFill" class="card-img" lazy-load="{{true}}" />
  <view class="card-body">
    <text class="card-title">{{item.name || item.model}}</text>
    <text class="card-desc text-truncate">{{item.desc || item.size}}</text>
  </view>
</view>
```

### WXSS

```css
.card {
  margin: 12rpx 18rpx;
  background: var(--surface);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}
.card-img {
  width: 100%;
  height: 320rpx;
  background: var(--line-soft);
}
.card-body { padding: 18rpx 20rpx; }
.card-title { font-size: 30rpx; font-weight: 600; color: var(--ink); display: block; }
.card-desc { font-size: 24rpx; color: var(--muted); margin-top: 8rpx; display: block; }
```

---

## 四、SKU 规格选择器完整模板（微信原生）

### JS — SKU 匹配引擎

```js
// 从后端获取 SKU 数据后初始化
initSku: function(skuList, specGroups) {
  // 默认选中第一个有库存的 SKU
  var defaultSku = skuList.find(function(s) { return s.stock > 0; });
  this.setData({
    skuList: skuList,
    specGroups: specGroups,
    selectedSpecs: defaultSku ? defaultSku.specs : {},
    currentSku: defaultSku || null
  });
  this.updateSkuInfo();
},

/** 规格点击 */
onSpecTap: function(e) {
  var group = e.currentTarget.dataset.group;
  var value = e.currentTarget.dataset.value;
  var selectedSpecs = Object.assign({}, this.data.selectedSpecs);
  selectedSpecs[group] = value;
  this.setData({ selectedSpecs: selectedSpecs });
  this.updateSkuInfo();
},

/** 更新 SKU 信息（价格/库存 + 禁用态计算） */
updateSkuInfo: function() {
  var sku = this.findSku(this.data.selectedSpecs);
  if (sku && sku.stock > 0) {
    this.setData({ currentSku: sku, canBuy: true, skuPrice: sku.price, skuStock: sku.stock });
  } else {
    this.setData({ currentSku: null, canBuy: false, skuPrice: 0, skuStock: 0 });
  }
},

/** SKU 匹配 */
findSku: function(selectedSpecs) {
  var keys = Object.keys(selectedSpecs).filter(function(k) { return selectedSpecs[k]; });
  if (keys.length === 0) return null;
  var self = this;
  return this.data.skuList.find(function(sku) {
    return keys.every(function(k) { return sku.specs[k] === selectedSpecs[k]; });
  });
},

/** 禁用态判断 */
isSpecDisabled: function(groupName, value) {
  var selectedSpecs = this.data.selectedSpecs;
  return !this.data.skuList.some(function(sku) {
    if (sku.specs[groupName] !== value || sku.stock <= 0) return false;
    return Object.keys(selectedSpecs).every(function(k) {
      if (k === groupName || !selectedSpecs[k]) return true;
      return sku.specs[k] === selectedSpecs[k];
    });
  });
}
```

### WXML

```xml
<view class="sku-panel">
  <view wx:for="{{specGroups}}" wx:key="name" class="sku-group">
    <text class="sku-group-title">{{item.name}}</text>
    <view class="sku-values">
      <view wx:for="{{item.values}}" wx:key="*this" wx:for-item="val"
            class="sku-val {{selectedSpecs[item.name] === val ? 'active' : ''}} {{isSpecDisabled(item.name, val) ? 'disabled' : ''}}"
            bindtap="onSpecTap" data-group="{{item.name}}" data-value="{{val}}">
        {{val}}
      </view>
    </view>
  </view>
</view>
```

---

## 五、购物车全功能模板（微信原生）

### JS

```js
Page({
  data: { cartItems: [], isAllChecked: false, totalPrice: 0, totalCount: 0 },

  onLoad: function() { this.loadCart(); },

  loadCart: function() {
    // 1. 先从本地缓存读取（秒开）
    var local = wx.getStorageSync('cart') || [];
    this.setData({ cartItems: local });
    this.calcTotal();
    // 2. 异步从服务端同步（登录后）
    this.syncCartFromServer();
  },

  syncCartFromServer: function() {
    if (!getApp().globalData.isLoggedIn) return;
    api.getCart().then(function(serverCart) {
      var merged = this.mergeCart(this.data.cartItems, serverCart);
      this.setData({ cartItems: merged });
      wx.setStorageSync('cart', merged);
      this.calcTotal();
    }.bind(this));
  },

  mergeCart: function(local, server) {
    // 简单合并策略：取数量较大值
    var map = {};
    local.forEach(function(item) { map[item.skuId] = item; });
    server.forEach(function(item) {
      if (map[item.skuId] && map[item.skuId].count > item.count) return;
      map[item.skuId] = item;
    });
    return Object.values(map);
  },

  onToggleCheck: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.map(function(item) {
      if (item.cartId === id) item.isChecked = !item.isChecked;
      return item;
    });
    this.setData({ cartItems: items });
    this.calcTotal();
  },

  onToggleAll: function() {
    var isAll = !this.data.isAllChecked;
    this.setData({
      cartItems: this.data.cartItems.map(function(i) { i.isChecked = isAll; return i; })
    });
    this.calcTotal();
  },

  onChangeCount: function(e) {
    var id = e.currentTarget.dataset.id;
    var action = e.currentTarget.dataset.action;
    this.setData({
      cartItems: this.data.cartItems.map(function(item) {
        if (item.cartId !== id) return item;
        if (action === 'plus' && item.count < item.stock) item.count++;
        if (action === 'minus' && item.count > 1) item.count--;
        return item;
      })
    });
    this.calcTotal();
    wx.setStorageSync('cart', this.data.cartItems);
  },

  calcTotal: function() {
    var checked = this.data.cartItems.filter(function(i) { return i.isChecked; });
    var totalPrice = checked.reduce(function(s, i) { return s + i.price * i.count; }, 0);
    var totalCount = checked.reduce(function(s, i) { return s + i.count; }, 0);
    var isAllChecked = this.data.cartItems.length > 0 &&
      this.data.cartItems.every(function(i) { return i.isChecked; });
    this.setData({ totalPrice: totalPrice, totalCount: totalCount, isAllChecked: isAllChecked });
  },

  onCheckout: function() {
    var checked = this.data.cartItems.filter(function(i) { return i.isChecked; });
    if (checked.length === 0) { wx.showToast({ title: '请选择商品', icon: 'none' }); return; }
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});
```

