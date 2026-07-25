# utils — 工具函数规范

> 本文件规定前端工具函数的组织与编写约束。

---

## 1. 工具函数分类

| 文件 | 职责 |
|---|---|
| `utils/storage.ts` | localStorage 封装（过期缓存） |
| `utils/auth.ts` | token 存取 |
| `utils/validator.ts` | 表单校验（手机号/邮箱/身份证） |
| `utils/format.ts` | 格式化（日期/金额/文件大小） |
| `utils/tree.ts` | 树形数据处理 |
| `utils/download.ts` | 文件下载 |
| `utils/index.ts` | 通用工具（防抖/节流/深拷贝） |

---

## 2. 格式化工具

```ts
// utils/format.ts
export const formatDate = (date: string | Date, fmt = 'yyyy-MM-dd HH:mm:ss') => {
  const d = new Date(date);
  return fmt
    .replace('yyyy', String(d.getFullYear()))
    .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
    .replace('dd', String(d.getDate()).padStart(2, '0'))
    .replace('HH', String(d.getHours()).padStart(2, '0'))
    .replace('mm', String(d.getMinutes()).padStart(2, '0'))
    .replace('ss', String(d.getSeconds()).padStart(2, '0'));
};

export const formatMoney = (value: number | string) =>
  `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
};
```

---

## 3. 禁止事项

- ❌ 工具函数依赖组件/页面上下文
- ❌ 未做空值处理
- ❌ 函数名不以动词开头
