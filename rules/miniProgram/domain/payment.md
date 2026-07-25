# payment — 微信支付规范

> 本文件规定微信小程序支付的接入规范。

---

## 1. 支付流程

```
1. 前端调用后端下单接口 → 获取 prepay_id 等参数
2. 前端调用 uni.requestPayment() 发起支付
3. 微信返回支付结果
4. 后端通过回调确认支付状态（最终判定以回调为准）
```

---

## 2. 支付实现

```ts
// api/order.ts
/** 创建订单并获取支付参数 */
export const createOrder = (dto: OrderCreateDTO) =>
  http<PayParams>({ url: '/api/v1/orders', method: 'POST', data: dto });
```

```ts
// utils/pay.ts
import { createOrder } from '@/api/order';

export const doPay = async (dto: OrderCreateDTO): Promise<boolean> => {
  try {
    // 1. 后端下单，返回支付参数
    const payParams = await createOrder(dto);

    // 2. 调起微信支付
    const { errMsg } = await uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType || 'RSA',
      paySign: payParams.paySign,
    });

    if (errMsg === 'requestPayment:ok') {
      uni.showToast({ title: '支付成功' });
      return true;
    }
    return false;
  } catch (e: any) {
    if (e.errMsg?.includes('cancel')) {
      uni.showToast({ title: '已取消支付', icon: 'none' });
    } else {
      uni.showToast({ title: '支付失败', icon: 'none' });
    }
    return false;
  }
};
```

---

## 3. 后端接口约定

```json
// POST /api/v1/orders 响应
{
  "code": 0,
  "data": {
    "orderId": "12345",
    "timeStamp": "1620000000",
    "nonceStr": "abc123",
    "package": "prepay_id=wx123456",
    "signType": "RSA",
    "paySign": "signature_string"
  }
}
```

---

## 4. 支付结果双重确认（必须）

> **支付成功不能只看前端回调。** 前端 `wx.requestPayment` 的 success 仅用于 UI 反馈，不更新订单状态。

### 4.1 双重确认机制

```
前端 success 回调
  → Toast "支付成功"
  → 跳转订单详情
  → 主动轮询后端查询订单状态（每5秒，最多6次）
     └── 后端以异步回调为准更新状态
```

### 4.2 主动轮询实现（微信原生）

```js
function pollOrderStatus(orderId, maxRetries) {
  maxRetries = maxRetries || 6;
  var retries = 0;

  function poll() {
    api.getOrderStatus(orderId).then(function(status) {
      if (status === 'paid' || status === 'completed') {
        // 确认支付成功 → 跳转
        wx.redirectTo({ url: '/pages/order/detail?id=' + orderId });
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(poll, 5000);  // 5秒后重试
      } else {
        // 超时 → 提示用户手动查看
        wx.showToast({ title: '支付确认中，请查看订单', icon: 'none' });
      }
    });
  }
  poll();
}
```

---

## 5. 支付超时与库存释放

### 5.1 超时取消流程

```
下单成功 → 库存锁定（15-30分钟）
  ↓
用户未支付（超时）
  ↓
后端定时任务 → 取消订单 → 释放库存
  ↓
前端轮询检测到订单状态变为 'cancelled' → 提示用户
```

### 5.2 前端倒计时组件

```xml
<!-- 订单待支付页 -->
<view class="pay-countdown">
  <text>剩余支付时间：</text>
  <text class="countdown-time">{{countdownText}}</text>
</view>
```

```js
// 服务端返回 expireTime（时间戳），前端计算倒计时
function startCountdown(expireTime) {
  var self = this;
  this.timer = setInterval(function() {
    var now = Date.now();
    var remain = expireTime - now;
    if (remain <= 0) {
      clearInterval(self.timer);
      self.setData({ countdownText: '已超时', orderExpired: true });
      return;
    }
    var m = Math.floor(remain / 60000);
    var s = Math.floor((remain % 60000) / 1000);
    self.setData({ countdownText: m + '分' + s + '秒' });
  }, 1000);
}
```

---

## 6. 退款流程

> 退款必须由后端发起，前端仅展示退款状态和填写退款原因。

### 6.1 退款状态机

```
已支付/待发货 → 用户申请退款 → 商家审核 → 同意 → 退款中 → 已退款
                                      ↘ 拒绝 → 已拒绝（可申诉）
已发货       → 用户申请退货退款 → 填写物流 → 商家收货 → 退款中 → 已退款
```

### 6.2 前端退款申请

```js
// 从订单详情页发起退款
onApplyRefund: function() {
  var self = this;
  wx.showActionSheet({
    itemList: ['仅退款', '退货退款'],
    success: function(res) {
      var type = res.tapIndex === 0 ? 'refund' : 'return';
      wx.navigateTo({
        url: '/pages/refund/apply?orderId=' + self.data.orderId + '&type=' + type
      });
    }
  });
}
```

---

## 7. 安全规则（必须遵守）

| 规则 | 说明 |
|------|------|
| **价格后端计算** | 前端只传 `orderId`，所有金额由后端重新计算，不信任前端传递的价格 |
| **签名后端生成** | `paySign` 必须由后端生成，前端不做任何签名计算 |
| **回调验签** | 后端收到微信支付回调后必须验签，验签失败不更新订单 |
| **幂等处理** | 支付回调可能重复，后端必须对同一 `transaction_id` 做幂等 |
| **HTTPS 全链路** | 支付接口必须使用 HTTPS |

---

## 8. 禁止事项

- ❌ 在前端计算支付签名（必须后端签名）
- ❌ 以前端返回为准判断支付成功（必须以后端回调为准）
- ❌ 支付金额在前端计算（必须后端重算）
- ❌ 回调地址硬编码
- ❌ 支付回调不做幂等处理（同一 transaction_id 可能多次回调）
- ❌ 超时订单不自动取消（必须定时任务释放库存）
- ❌ 支付页面不 hideShareMenu（支付参数不可分享）

---

