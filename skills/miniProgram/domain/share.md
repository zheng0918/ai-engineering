# share — 分享转发生成技能

> 本技能生成微信小程序分享（转发给好友、分享到朋友圈）的完整代码。

---

## 一、核心页面分享模板（微信原生 — 列表页/详情页/内容页）

```js
// pages/detail/detail.js
Page({
  data: {
    detail: null,
    // ...
  },

  /**
   * 分享给好友 — 右上角菜单 + open-type="share" 按钮
   * 基础库 2.12.0+ 支持 Promise 返回，可异步获取分享数据
   */
  onShareAppMessage: function(options) {
    var detail = this.data.detail;
    return {
      title: detail
        ? (detail.name || detail.model || '') + ' - 精选灯饰'
        : '星饰界 - 专业灯具制造',
      path: '/pages/detail/detail?id='
        + (detail ? detail.id : '')
        + '&from=' + (options.from || 'menu'),
      imageUrl: detail
        ? detail.coverUrl || detail.posterUrl
        : '/assets/icons/share-default.png'
    };
  },

  /**
   * 分享到朋友圈 — 右上角菜单
   * 需要在 page.json 中声明 "timelineShare": true
   */
  onShareTimeline: function() {
    var detail = this.data.detail;
    return {
      title: detail
        ? (detail.name || detail.model || '')
        : '星饰界 - 专业灯具制造',
      query: 'id=' + (detail ? detail.id : '') + '&from=timeline',
      imageUrl: detail
        ? detail.coverUrl || detail.posterUrl
        : '/assets/icons/share-default.png'
    };
  }
});
```

## 二、分享按钮（WXML）

```xml
<!-- 页内分享按钮 — 引导用户主动分享 -->
<button class="share-btn" open-type="share">
  <image src="/assets/icons/icon-share.png" class="share-ic" mode="aspectFit" />
  <text>分享给好友</text>
</button>
```

## 三、禁止分享页面

```js
// 支付页/隐私页 — 在 onLoad 中禁用分享
Page({
  onLoad: function() {
    wx.hideShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
});
```

## 四、页面 JSON 配置

```json
{
  "navigationBarTitleText": "详情",
  "enablePullDownRefresh": false,
  "timelineShare": true
}
```

> 朋友圈分享必须在 page.json 中声明 `"timelineShare": true`，否则用户在右上角菜单看不到"分享到朋友圈"入口。

## 五、分享默认图生成

默认分享图应为 5:4 比例 PNG，内容为品牌 Logo + Slogan，存储在 `assets/icons/share-default.png`。
