# notification — 消息订阅生成技能

> 本技能生成订阅消息授权代码。

---

## 订阅工具函数

```ts
// utils/subscribe.ts
const getTemplateIds = () => {
  const env = import.meta.env.VITE_ENV || 'dev';
  return SUBSCRIBE_TEMPLATES[env as keyof typeof SUBSCRIBE_TEMPLATES];
};

export const subscribe = async (types: string[]): Promise<string[]> => {
  const templates = getTemplateIds();
  const tmplIds = types.map((t) => templates[t]).filter(Boolean);
  if (tmplIds.length === 0) return [];

  try {
    const { errMsg, ...result } = await uni.requestSubscribeMessage({ tmplIds });
    if (errMsg === 'requestSubscribeMessage:ok') {
      return Object.entries(result)
        .filter(([, v]) => v === 'accept')
        .map(([k]) => k);
    }
  } catch {}
  return [];
};
```

---

## 使用场景

| 场景 | 触发时机 | 模板类型 |
|---|---|---|
| 订单支付 | 支付完成后 | ORDER_PAID |
| 订单发货 | 提交订单后 | ORDER_SHIPPED |
| 活动通知 | 报名/预约后 | ACTIVITY_NOTIFY |
| 退款结果 | 申请退款后 | REFUND_RESULT |
