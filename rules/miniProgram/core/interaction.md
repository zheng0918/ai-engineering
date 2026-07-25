# interaction — 交互规范

> 本文件规定小程序 UI 交互（Loading/Toast/Modal/弹窗）的约束。

---

## 1. 交互类型

| 组件 | 用途 | 使用方式 |
|---|---|---|
| Loading | 数据加载中 | `uni.showLoading()` / `u-loading-page` |
| Toast | 操作结果提示 | `uni.showToast()` |
| Modal | 重要操作确认 | `uni.showModal()` |
| ActionSheet | 选项菜单 | `uni.showActionSheet()` |
| Empty | 空数据占位 | `<u-empty>` |
| Skeleton | 骨架屏加载 | `<u-skeleton>` |

---

## 2. Loading 规范

```ts
// 请求自动 Loading（在 request.ts 拦截器中已配置）
// 手动 Loading
const loading = ref(true);
// 加载完成
loading.value = false;
```

```vue
<!-- 全屏 Loading -->
<u-loading-page :loading="loading" />

<!-- 局部 Loading -->
<u-loading-icon v-if="loading" />
```

---

## 3. Toast 规范

```ts
// 成功
uni.showToast({ title: '操作成功' });

// 失败
uni.showToast({ title: error.message, icon: 'none' });

// 加载中（手动）
uni.showLoading({ title: '提交中', mask: true });
// 完成后
uni.hideLoading();
```

---

## 4. Modal 确认

```ts
const res = await uni.showModal({
  title: '确认删除',
  content: '删除后不可恢复',
  confirmText: '确定删除',
  confirmColor: '#ee0a24',
});
if (res.confirm) {
  await deleteItem();
}
```

---

## 5. 空状态与骨架屏

```vue
<!-- 空状态 -->
<u-empty v-if="list.length === 0 && !loading" text="暂无数据" mode="list">
  <u-button type="primary" @click="goHome">去逛逛</u-button>
</u-empty>

<!-- 骨架屏 -->
<u-skeleton v-if="loading" :loading="loading" :rows="3" />
```

---

## 6. 交互原则

- 任何网络请求必须有 Loading 状态
- 操作结果必须有 Toast 反馈（成功/失败）
- 不可逆操作（删除/支付）必须有 Modal 二次确认
- 列表加载使用分页 + `loadmore` 状态提示
- 表单提交前校验 + 提交中按钮 loading + 提交后结果反馈

---

## 7. 禁止事项

- ❌ 请求无 Loading（用户不知道是否在处理）
- ❌ 操作无反馈（成功/失败静默）
- ❌ 删除无二次确认
- ❌ Loading 永不消失（内存泄漏导致）
- ❌ 空列表无引导（白屏）
