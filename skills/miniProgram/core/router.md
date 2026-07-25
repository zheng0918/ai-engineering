# router — 路由生成技能

> 本技能生成 pages.json/app.config.ts 路由配置 + 路径常量 + 导航封装。

---

## pages.json 生成模板

```json
{
  "easycom": {
    "autoscan": true,
    "custom": { "^u-(.*)": "uview-plus/components/u-$1/u-$1.vue" }
  },
  "pages": [
    { "path": "pages/tab/home/index", "style": { "navigationStyle": "custom" } },
    { "path": "pages/tab/category/index" },
    { "path": "pages/tab/cart/index" },
    { "path": "pages/tab/mine/index" }
  ],
  "subPackages": [
    { "root": "pages/goods", "pages": [{ "path": "detail/index" }] },
    { "root": "pages/order", "pages": [{ "path": "list/index" }, { "path": "detail/index" }] },
    { "root": "pages/user", "pages": [{ "path": "login/index" }] }
  ],
  "preloadRule": {
    "pages/tab/home/index": { "network": "all", "packages": ["pages/goods"] }
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#1989fa",
    "list": [
      { "pagePath": "pages/tab/home/index", "text": "首页", "iconPath": "static/tab/home.png", "selectedIconPath": "static/tab/home-active.png" },
      { "pagePath": "pages/tab/category/index", "text": "分类", "iconPath": "static/tab/category.png", "selectedIconPath": "static/tab/category-active.png" },
      { "pagePath": "pages/tab/cart/index", "text": "购物车", "iconPath": "static/tab/cart.png", "selectedIconPath": "static/tab/cart-active.png" },
      { "pagePath": "pages/tab/mine/index", "text": "我的", "iconPath": "static/tab/mine.png", "selectedIconPath": "static/tab/mine-active.png" }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "",
    "backgroundColor": "#F8F8F8"
  }
}
```

---

## 路径常量生成规则

`config/routes.ts` 中每一条路径对应一个 key。key 命名：`{MODULE}_{PAGE}` 大写蛇形。
