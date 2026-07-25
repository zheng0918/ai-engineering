# interaction — 交互规范

> 本文件规定前端 UI 反馈（Loading/Message/Dialog）的使用约束。

---

## 1. Loading 规范

| 场景 | 实现 |
|---|---|
| 页面加载 | `<el-skeleton>` / `v-loading` |
| 表格加载 | `v-loading="loading"` |
| 按钮提交 | `<el-button :loading="submitting">` |
| 全局请求 | 非强制（局部 loading 优先） |

---

## 2. Message 规范

```ts
// 成功
ElMessage.success('操作成功');

// 失败（message 来自后端）
ElMessage.error(e.message || '操作失败');

// 警告
ElMessage.warning('请先选择数据');
```

| 时机 | 类型 |
|---|---|
| 增删改成功 | `success` |
| API 错误 | `error`（后端 message） |
| 校验失败 | `warning`（前端 message） |
| 网络错误 | `error`（固定文案） |

---

## 3. MessageBox 确认

```ts
await ElMessageBox.confirm('确认删除该记录？删除后不可恢复。', '警告', {
  confirmButtonText: '确定删除',
  cancelButtonText: '取消',
  type: 'warning',
  confirmButtonClass: 'el-button--danger',
});
```

---

## 4. Notification

```ts
ElNotification({
  title: '提示',
  message: '有新的审批待处理',
  type: 'info',
  duration: 5000,
});
```

---

## 5. 禁止事项

- ❌ 请求无 loading
- ❌ 操作无 toast
- ❌ 删除无二次确认
- ❌ 错误信息直接展示后端原始 message 不做分类
