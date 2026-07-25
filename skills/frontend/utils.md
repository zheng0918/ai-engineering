# utils — 工具函数生成技能

> 本技能生成格式化/校验/防抖节流等工具函数。

---

## 树形数据处理

```ts
// utils/tree.ts
export const listToTree = <T extends { id: string; parentId: string }>(
  list: T[], parentId = '0'
): (T & { children?: T[] })[] => {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({ ...item, children: listToTree(list, item.id) }));
};
```

## 文件下载

```ts
// utils/download.ts
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  URL.revokeObjectURL(url);
};
```

## 防抖 / 节流

```ts
// utils/index.ts
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay = 300) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(fn: T, interval = 300) => {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= interval) { last = now; fn(...args); }
  };
};
```
