# shopping-cart — 购物车

> 购物车必须本地+云端双存储，登录前后平滑迁移。

## 存储架构

```
未登录 → 仅本地 Storage（key: 'app_cart'）
已登录 → 本地 Storage + 服务端同步（每次操作后同时更新）
```

## 同步时机

| 触发 | 操作 |
|------|------|
| 页面 onLoad | 本地秒开 → 异步拉服务端合并 |
| 修改商品 | 先更新本地 → 异步同步服务端 |
| 登录成功 | 上传本地 → 拉取服务端 → **合并** |
| 支付成功 | 服务端清除已购 → 同步本地删除 |

## 合并策略

```js
function mergeCart(localCart, serverCart) {
  var merged = {};
  localCart.forEach(function(item) { merged[item.skuId] = item; });
  serverCart.forEach(function(item) {
    if (!merged[item.skuId] || merged[item.skuId].count < item.count) {
      merged[item.skuId] = item;
    }
  });
  return Object.values(merged);
}
```

## 禁止事项

- ❌ 购物车数据只存本地（登录后不同步服务端）
- ❌ 合并策略不做冲突处理
