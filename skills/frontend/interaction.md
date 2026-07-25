# interaction — 交互生成技能

> 本技能生成交互工具函数与全局反馈配置。

---

## 统一反馈工具

```ts
// utils/feedback.ts
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';

export const showSuccess = (msg = '操作成功') => ElMessage.success(msg);
export const showError = (msg = '操作失败') => ElMessage.error(msg);
export const showWarning = (msg: string) => ElMessage.warning(msg);

export const showConfirm = (msg: string, title = '提示'): Promise<boolean> =>
  ElMessageBox.confirm(msg, title, { type: 'warning' }).then(() => true).catch(() => false);

export const showDeleteConfirm = (name = '该记录') =>
  showConfirm(`确认删除 ${name}？删除后不可恢复。`, '删除确认');
```

## 全局 Loading 管理

```ts
// utils/loading.ts
let loadingCount = 0;
let loadingInstance: any = null;

export const showFullLoading = (text = '加载中') => {
  if (loadingCount === 0) {
    loadingInstance = ElLoading.service({ fullscreen: true, text });
  }
  loadingCount++;
};

export const hideFullLoading = () => {
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    loadingInstance?.close();
  }
};
```
