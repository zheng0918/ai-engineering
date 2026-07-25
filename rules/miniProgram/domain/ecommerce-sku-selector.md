# sku-selector — 商品 SKU 规格选择器

> 本文件规定电商小程序商品多规格选择组件的约束。适用于 `features.ecommerce.enabled = true`。

---

## 1. 数据结构

```js
// 后端返回的 SKU 列表
skuList: [
  { skuId: 'sku001', specs: { color: '白色', size: 'XL' }, price: 29900, stock: 5 },
  { skuId: 'sku002', specs: { color: '白色', size: 'L' },  price: 29900, stock: 0 },
]
// 规格维度列表
specGroups: [
  { name: '颜色', values: ['白色', '黑色'] },
  { name: '尺寸', values: ['S', 'M', 'L', 'XL'] },
]
// 用户选中状态
selectedSpecs: { color: '', size: '' }
```

## 2. SKU 匹配算法

```js
function findSku(skuList, selectedSpecs) {
  var keys = Object.keys(selectedSpecs).filter(function(k) { return selectedSpecs[k] !== ''; });
  if (keys.length === 0) return null;
  return skuList.find(function(sku) {
    return keys.every(function(k) { return sku.specs[k] === selectedSpecs[k]; });
  });
}
```

## 3. 禁用态判断

```js
function isSpecDisabled(skuList, specName, specValue, selectedSpecs) {
  return !skuList.some(function(sku) {
    if (sku.specs[specName] !== specValue || sku.stock <= 0) return false;
    return Object.keys(selectedSpecs).every(function(k) {
      if (k === specName || !selectedSpecs[k]) return true;
      return sku.specs[k] === selectedSpecs[k];
    });
  });
}
```

## 4. 交互规则

- 选择规格 → 匹配 SKU → 更新价格/库存显示
- 匹配失败 → 显示"该组合暂无库存"
- 库存为 0 → 该规格值置灰不可点击
- 只有一个规格维度时 → 默认选中第一个有库存的

## 5. 禁止事项

- ❌ 前端计算价格（必须从匹配的 SKU 取价格）
- ❌ 库存不足时不置灰
- ❌ 多维度不全部展示
