# share — 分享转发规范

> 本文件规定微信小程序分享（转发给好友、分享到朋友圈）的约束。分享是微信一级开放能力，是小程序核心分发渠道。

---

## 1. 分享类型

| 类型 | API | 触发方式 | 适用场景 |
|------|-----|---------|---------|
| 分享给好友 | `onShareAppMessage` | 右上角菜单 → 转发 | 所有页面（默认开启） |
| 分享到朋友圈 | `onShareTimeline` | 右上角菜单 → 分享到朋友圈 | 内容型页面（需页面单独声明） |
| 主动分享按钮 | `button open-type="share"` | 页面内按钮点击 | 引导用户分享 |

---

## 2. 页面级分享配置（微信原生 — 每个核心页面必须实现）

```js
Page({
  /**
   * 分享给好友。
   * 必须在 Page() 中定义，微信右上角菜单会自动调用。
   */
  onShareAppMessage: function(options) {
    // options.from === 'button'  → 页面内分享按钮触发
    // options.from === 'menu'    → 右上角菜单触发
    // options.webViewUrl         → web-view 页面专用

    return {
      title: this.data.detail
        ? this.data.detail.name + ' - ' + this.data.detail.desc
        : '星饰界 - 专业灯具制造',      // 分享标题（最多 30 字符）
      path: '/pages/detail/detail?id='  // 分享路径（带参数，用于归因统计）
            + (this.data.detail ? this.data.detail.id : '')
            + '&from=share',
      imageUrl: this.data.detail        // 分享图片（5:4 比例最佳）
        ? this.data.detail.coverUrl
        : '/assets/icons/share-default.png'
    };
  },

  /**
   * 分享到朋友圈（需在 page.json 中单独声明）。
   * 用户点击右上角菜单 → 分享到朋友圈 时触发。
   */
  onShareTimeline: function() {
    return {
      title: this.data.detail
        ? this.data.detail.name
        : '星饰界 - 专业灯具制造',
      query: 'id=' + (this.data.detail ? this.data.detail.id : '') + '&from=timeline',
      imageUrl: this.data.detail ? this.data.detail.coverUrl : ''
    };
  }
});
```

### 2.1 页面 JSON 声明（朋友圈分享必须）

```json
{
  "navigationBarTitleText": "详情",
  "enablePullDownRefresh": true,
  "timelineShare": true
}
```

---

## 3. 分享按钮（主动引导分享）

```xml
<!-- 页面内主动分享按钮 -->
<button class="share-btn" open-type="share">
  <image src="/assets/icons/icon-share.png" class="share-icon" mode="aspectFit" />
  <text>分享给好友</text>
</button>
```

```css
.share-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: var(--ink);
}
.share-btn::after { border: none; }
.share-icon { width: 32rpx; height: 32rpx; }
```

---

## 4. 分享参数设计规范

### 4.1 分享路径归因

```js
path: '/pages/detail/detail?id=123&from=share'     // 好友分享
path: '/pages/detail/detail?id=123&from=timeline'   // 朋友圈
path: '/pages/detail/detail?id=123&from=button'     // 按钮分享
```

> 在 `onLoad` 中解析 `from` 参数，用于数据统计和分享归因。

### 4.2 分享图片规范

| 规格 | 要求 |
|------|------|
| 比例 | 5:4（微信官方推荐） |
| 尺寸 | 不小于 400×320 |
| 格式 | PNG / JPG |
| 默认图 | 品牌 Logo + Slogan，存储在 `assets/icons/share-default.png` |

---

## 5. 禁止分享的场景

以下场景必须调用 `wx.hideShareMenu()` 禁用分享：

- 支付页面（防止支付参数泄露）
- 个人隐私信息页（设置/实名信息）
- 密码输入页

```js
// 在 onLoad 中调用
onLoad: function() {
  wx.hideShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  });
}
```

---

## 6. 禁止事项

- ❌ 核心页面（首页/详情页/列表页）不实现 `onShareAppMessage`（微信默认生成平庸标题）
- ❌ 分享标题写死（应从当前页面数据动态生成）
- ❌ 分享路径不带 `from` 参数（无法做分享归因）
- ❌ 分享图片不设（微信会用截图，视觉效果不可控）
- ❌ 朋友圈分享不声明 `timelineShare`（用户看不到入口）
- ❌ 支付/隐私页面不 `hideShareMenu`
- ❌ `onShareAppMessage` 中 `return` 异步数据用 callback 而非 Promise（基础库 2.12+ 支持 Promise 返回）
