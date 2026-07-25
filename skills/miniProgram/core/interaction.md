# interaction — 交互组件生成技能

> 本技能生成 Loading/Toast/Modal/Empty 交互模板代码。

---

## 交互工具函数

```ts
// utils/feedback.ts

/** 加载中 */
export const showLoading = (title = '加载中') => uni.showLoading({ title, mask: true });
export const hideLoading = () => uni.hideLoading();

/** 轻提示 */
export const showToast = (title: string, icon: 'success' | 'none' = 'success') =>
  uni.showToast({ title, icon, duration: 1500 });

/** 确认弹窗 */
export const showConfirm = (content: string, title = '提示'): Promise<boolean> =>
  new Promise((resolve) => {
    uni.showModal({
      title, content,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });

/** 操作菜单 */
export const showActionSheet = (itemList: string[]): Promise<number> =>
  new Promise((resolve) => {
    uni.showActionSheet({
      itemList,
      success: (res) => resolve(res.tapIndex),
      fail: () => resolve(-1),
    });
  });
```

---

## 页面状态组件

```vue
<!-- components/base/PageState/index.vue -->
<template>
  <view>
    <u-loading-page v-if="loading" />
    <u-empty v-else-if="error" :text="error" mode="network">
      <u-button @click="$emit('retry')">重新加载</u-button>
    </u-empty>
    <u-empty v-else-if="empty" text="暂无数据" mode="list" />
    <slot v-else />
  </view>
</template>

<script setup lang="ts">
defineProps<{ loading: boolean; error?: string; empty?: boolean }>();
defineEmits<{ retry: [] }>();
</script>
```
