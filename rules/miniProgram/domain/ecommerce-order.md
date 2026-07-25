# order — 订单系统

> 适用 `features.ecommerce.enabled = true`。

## 订单状态机

```
待支付 → 已支付 → 待发货 → 待收货 → 已完成
待支付 → 已取消（超时/用户取消）
已支付/待发货 → 退款中 → 已退款
```

## 订单列表页（TabBar切换+状态筛选）

```xml
<view class="order-tabs">
  <view wx:for="{{statusTabs}}" wx:key="key"
        class="order-tab {{activeTab === item.key ? 'active' : ''}}"
        bindtap="onSwitchTab" data-key="{{item.key}}">{{item.label}}</view>
</view>
```

状态Tab: 全部 / 待付款 / 待发货 / 待收货 / 已完成

## 订单详情页 — 底部操作栏按状态动态渲染

```xml
<view class="order-actions">
  <block wx:if="{{order.status === 'pending'}}">
    <button bindtap="onCancelOrder">取消订单</button>
    <button class="primary" bindtap="onPay">立即支付</button>
  </block>
  <block wx:elif="{{order.status === 'paid'}}">
    <button bindtap="onApplyRefund">申请退款</button>
  </block>
  <block wx:elif="{{order.status === 'shipped'}}">
    <button bindtap="onConfirmReceive">确认收货</button>
  </block>
  <block wx:elif="{{order.status === 'completed'}}">
    <button bindtap="onReview">去评价</button>
  </block>
</view>
```

## 禁止事项

- ❌ 订单金额前端计算（必须后端重算）
- ❌ 订单无快照机制（商品信息变更影响历史订单）
- ❌ 支付回调不做幂等处理
