# utils — 工具函数规范

> 本文件规定小程序工具函数的组织与编写约束。

---

## 1. 工具函数分类

| 文件 | 职责 | 框架 |
|---|---|---|
| `utils/storage.ts` | 本地存储封装（加密/序列化） | uniapp/taro |
| `utils/storage.js` | 本地存储封装 | 微信原生 |
| `utils/validator.ts` | 表单校验（手机号/身份证/邮箱） | 通用 |
| `utils/date.ts` | 日期格式化/计算 | 通用 |
| `utils/image.ts` | 图片处理（压缩/预览/保存） | 通用 |
| `utils/mock.js` | Mock 数据集中管理（开发阶段） | 微信原生 |
| `utils/mock.ts` | Mock 数据集中管理（开发阶段） | uniapp/taro |
| `utils/config.js` | 环境配置（API基地址等） | 微信原生 |
| `utils/api.js` | API 请求封装 | 微信原生 |
| `utils/encrypt.ts` | 敏感数据加密（按需） | 通用 |
| `utils/index.ts` | 其它通用工具 | 通用 |

---

## 2. Storage 封装（必须）

```ts
// utils/storage.ts
const PREFIX = 'APP_';

export const storage = {
  set<T>(key: string, value: T): void {
    uni.setStorageSync(PREFIX + key, JSON.stringify(value));
  },

  get<T>(key: string): T | null {
    const raw = uni.getStorageSync(PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    uni.removeStorageSync(PREFIX + key);
  },

  clear(): void {
    uni.clearStorageSync();
  },
};
```

---

## 3. 校验工具

```ts
// utils/validator.ts
export const validators = {
  isMobile: (value: string) => /^1[3-9]\d{9}$/.test(value),

  isIdCard: (value: string) => /^\d{17}[\dXx]$/.test(value),

  isEmail: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),

  isEmpty: (value: any) => value === '' || value === null || value === undefined,

  isUrl: (value: string) => /^https?:\/\/.+/.test(value),
};
```

---

## 4. 日期工具

```ts
// utils/date.ts
export const formatDate = (date: Date | string | number, fmt = 'yyyy-MM-dd HH:mm:ss') => {
  const d = new Date(date);
  const o: Record<string, number> = {
    'M+': d.getMonth() + 1,
    'd+': d.getDate(),
    'H+': d.getHours(),
    'm+': d.getMinutes(),
    's+': d.getSeconds(),
  };
  let result = fmt.replace(/(y+)/, (_, $1) => String(d.getFullYear()).slice(4 - $1.length));
  for (const [k, v] of Object.entries(o)) {
    result = result.replace(new RegExp(`(${k})`), (_, $1) =>
      $1.length === 1 ? String(v) : String(v).padStart(2, '0'));
  }
  return result;
};
```

---

## 5. Mock 数据管理（微信原生）

> 开发阶段所有页面数据统一从 `utils/mock.js` 引入，不直接调后端 API。切换生产环境时只需改引入路径。

### 5.1 文件结构

```js
// utils/mock.js
// 所有 Mock 数据集中管理，按页面/功能分块导出

// ===== 1. 常量与色板（独立定义，供数据和模板共用） =====
const PAL = { white: ['#f4f2ee', '#c7baa6'], grey: ['#dad6d0', '#7c7163'], ... };
const STONE_COLORS = { white: '#f4f2ee', grey: '#dad6d0', ... };

// ===== 2. 按页面分块 =====
const homeData = { banners: [...], series: [...] };
const productData = { products: [...], stoneColors: {...} };
const companyData = { brandName: '', contact: {...}, ... };

// ===== 3. 工厂函数（批量生成测试数据） =====
function makeProducts(prefix, start, n, stoneList) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ model: prefix + (start - i), stone: stoneList[i % stoneList.length], ... });
  }
  return out;
}

// ===== 4. 导出 =====
module.exports = { PAL, STONE_COLORS, homeData, productData, companyData, makeProducts };
```

### 5.2 设计原则

- 按页面分块：`homeData`、`productData`、`companyData`... 一一对应页面
- 常量分离：色板/配置与数据分开定义，方便页面模板直接引用
- 工厂函数：需要大量数据时用工厂函数批量生成，不要手写 50 条
- 数据结构与真实 API 返回结构一致，方便后续切换

### 5.3 环境切换策略

```js
// 开发阶段
var data = require('../../utils/mock.js');

// 切换到真实 API：
// var api = require('../../utils/api.js');
// 改引入 + 改 data 绑定即可，页面 WXML 无需改动
```

### 5.4 禁止事项

- ❌ Mock 数据分散在各页面 JS 中（必须集中在 `utils/mock.js`）
- ❌ Mock 数据结构与后端接口不一致（后续对接成本高）
- ❌ 硬编码 50+ 条数据（必须用工厂函数）
- ❌ 色板常量嵌在数据对象中（必须独立定义）
- ❌ Mock 数据无 `module.exports` 导出

---

## 6. 工具函数禁止事项

- ❌ 工具函数无类型定义（TS 项目）
- ❌ Storage key 不加前缀
- ❌ 敏感数据明文存 Storage
