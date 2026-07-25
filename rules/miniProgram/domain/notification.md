# notification — 消息订阅规范

> 本文件规定微信小程序订阅消息与站内通知的约束。

---

## 1. 订阅消息流程

```
1. 用户触发操作（如提交订单）
2. 调用 wx.requestSubscribeMessage() 弹出授权
3. 用户同意后记录授权
4. 后端在特定时刻发送订阅消息
```

---

## 2. 订阅实现

```ts
// utils/subscribe.ts
const TEMPLATE_IDS = {
  ORDER_PAID: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',     // 订单支付成功
  ORDER_SHIPPED: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // 订单发货
  ACTIVITY_NOTIFY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // 活动通知
};

/** 请求订阅消息授权 */
export const requestSubscribe = async (types: (keyof typeof TEMPLATE_IDS)[]) => {
  const tmplIds = types.map((t) => TEMPLATE_IDS[t]);

  try {
    const { errMsg, ...result } = await uni.requestSubscribeMessage({ tmplIds });

    // result: { [tmplId]: 'accept' | 'reject' | 'ban' }
    if (errMsg === 'requestSubscribeMessage:ok') {
      const accepted = Object.entries(result)
        .filter(([, v]) => v === 'accept')
        .map(([k]) => k);

      // 上报后端记录已授权的模板
      await reportSubscribedTemplates(accepted);
    }
  } catch (e) {
    // 用户拒绝不强制
  }
};
```

---

## 3. 使用方式

```vue
<script setup lang="ts">
import { requestSubscribe } from '@/utils/subscribe';

const handleSubmitOrder = async () => {
  // 先提交订单
  await submitOrder(formData);

  // 弹出订阅授权
  await requestSubscribe(['ORDER_PAID', 'ORDER_SHIPPED']);
};
</script>
```

---

## 4. 模板 ID 管理

```ts
// config/templates.ts
export const SUBSCRIBE_TEMPLATES = {
  dev: {
    ORDER_PAID: 'dev_template_id_1',
    ORDER_SHIPPED: 'dev_template_id_2',
  },
  prod: {
    ORDER_PAID: 'prod_template_id_1',
    ORDER_SHIPPED: 'prod_template_id_2',
  },
};
```

---

## 5. 禁止事项

- ❌ 页面一进入就弹订阅授权（必须用户主动触发的操作后弹）
- ❌ 订阅模板 ID 硬编码在业务逻辑中
- ❌ 用户拒绝后再弹（短时间内不得重复弹出）
