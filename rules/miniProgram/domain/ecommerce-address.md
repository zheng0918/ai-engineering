# address — 收货地址管理

> 适用 `features.ecommerce.enabled = true`。

## 数据模型

```js
address: {
  id: '', name: '', phone: '',
  region: ['省', '市', '区'], detail: '', isDefault: false
}
```

## 核心交互

- 列表页：地址卡片 + 默认标记 + 编辑/删除 + 新增入口
- 编辑页：微信原生 `mode="region"` picker + 详细地址 input + 默认 switch
- 下单时：从地址列表选择，或跳转新增

## 与后端同步

- 地址增删改后实时同步后端
- 下单时快照地址信息到订单（后续地址变更不影响历史订单）

## 禁止事项

- ❌ 下单时地址不从后端拉取（可能使用过期数据）
- ❌ 不提供默认地址功能
