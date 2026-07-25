# state-mapping — 状态映射生成技能

> 本技能生成三端页面 UI 状态处理代码，确保 loading/error/empty/normal + 操作反馈完整覆盖。

---

## 触发条件

当需要"添加页面状态"、"创建列表页"、"完善错误处理"时触发。

---

## 生成清单

- 前端：`PageState` 组件 + 操作反馈工具函数
- 小程序：`PageState` 组件 + 操作反馈工具函数
- 每个页面的四态模板

---

## 前端 PageState 组件完整模板

```vue
<!-- components/base/PageState/index.vue -->
<template>
  <div v-if="loading" class="page-state page-state--loading">
    <slot name="loading">
      <el-skeleton :rows="skeletonRows" animated />
    </slot>
  </div>

  <div v-else-if="error" class="page-state page-state--error">
    <slot name="error">
      <el-result
        status="error"
        :title="errorTitle"
        :sub-title="errorSubTitle"
      >
        <template #extra>
          <el-button type="primary" @click="$emit('retry')">
            {{ retryText }}
          </el-button>
        </template>
      </el-result>
    </slot>
  </div>

  <div v-else-if="isEmpty" class="page-state page-state--empty">
    <slot name="empty">
      <el-empty :description="emptyDescription">
        <template v-if="showCreateButton" #extra>
          <el-button type="primary" @click="$emit('create')">
            {{ createText }}
          </el-button>
        </template>
      </el-empty>
    </slot>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean;
  error: boolean;
  isEmpty: boolean;
  skeletonRows?: number;
  errorTitle?: string;
  errorSubTitle?: string;
  retryText?: string;
  emptyDescription?: string;
  showCreateButton?: boolean;
  createText?: string;
}>(), {
  skeletonRows: 5,
  errorTitle: '加载失败',
  errorSubTitle: '请检查网络后重试',
  retryText: '重新加载',
  emptyDescription: '暂无数据',
  showCreateButton: false,
  createText: '新建',
});

defineEmits<{
  retry: [];
  create: [];
}>();
</script>
```

---

## 小程序 PageState 组件完整模板

```vue
<!-- components/PageState/index.vue -->
<template>
  <view v-if="loading" class="page-state page-state--loading">
    <slot name="loading">
      <uni-load-more status="loading" />
    </slot>
  </view>

  <view v-else-if="error" class="page-state page-state--error">
    <slot name="error">
      <view class="error-content">
        <text class="error-icon">!</text>
        <text class="error-text">{{ errorText || '加载失败' }}</text>
        <button class="retry-btn" @click="$emit('retry')">重试</button>
      </view>
    </slot>
  </view>

  <view v-else-if="isEmpty" class="page-state page-state--empty">
    <slot name="empty">
      <view class="empty-content">
        <text class="empty-text">{{ emptyText || '暂无数据' }}</text>
      </view>
    </slot>
  </view>

  <slot v-else />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean;
  error: boolean;
  isEmpty: boolean;
  errorText?: string;
  emptyText?: string;
}>(), {
  errorText: '加载失败',
  emptyText: '暂无数据',
});

defineEmits<{
  retry: [];
}>();
</script>
```

---

## 操作反馈工具模板

```ts
// 前端 utils/feedback.ts
import { ElMessage, ElMessageBox } from 'element-plus';

export const showSuccess = (msg = '操作成功') => ElMessage.success(msg);
export const showError = (msg = '操作失败') => ElMessage.error(msg);

export const confirmDelete = (msg = '确认删除该记录？此操作不可恢复。'): Promise<void> => {
  return ElMessageBox.confirm(msg, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {});
};
```

```ts
// 小程序 utils/feedback.ts
export const showSuccess = (title = '操作成功') => {
  uni.showToast({ title, icon: 'success' });
};

export const showError = (title = '操作失败') => {
  uni.showToast({ title, icon: 'none' });
};

export const confirmDelete = (content = '确认删除该记录？'): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '删除确认',
      content,
      confirmText: '确认删除',
      cancelText: '取消',
      confirmColor: '#D14343',
      success: (res) => { if (res.confirm) resolve(); else reject(); },
      fail: reject,
    });
  });
};
```

---

## 生成时注意事项

1. **四态缺一不可**：loading / error / empty / normal 必须全部覆盖
2. **ERROR 必须有重试按钮**：调用 fetchData(true) 重新加载
3. **EMPTY 建议有创建按钮**：引导用户前往创建页
4. **loading 初始值必须为 true**：否则会先闪一下 empty
5. **数据刷新时 already-loading 不重置骨架**：体验更好
6. **操作反馈统一调用封装函数**：不直接 ElMessage / uni.showToast
7. **删除必须二次确认**：文案应说明不可恢复
8. **表单提交按钮加 loading + disabled**：防止重复提交
