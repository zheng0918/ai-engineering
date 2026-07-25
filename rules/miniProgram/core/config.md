# config — 配置规范

> 本文件规定小程序环境变量、manifest.json 与应用级配置的约束。

---

## 1. 环境变量

```ts
// config/env.ts
const ENV = {
  dev: {
    API_BASE: 'http://localhost:8200',
    WS_URL: 'ws://localhost:8200/ws',
  },
  test: {
    API_BASE: 'https://test-api.example.com',
    WS_URL: 'wss://test-api.example.com/ws',
  },
  prod: {
    API_BASE: 'https://api.example.com',
    WS_URL: 'wss://api.example.com/ws',
  },
};

const currentEnv = import.meta.env.VITE_ENV || 'dev';

export const env = ENV[currentEnv as keyof typeof ENV];
```

---

## 2. manifest.json 规范（uniapp）

```json
{
  "name": "应用名称",
  "appid": "__UNI__XXXXXX",
  "description": "应用描述",
  "versionName": "1.0.0",
  "versionCode": "100",
  "mp-weixin": {
    "appid": "wx1234567890",
    "setting": { "urlCheck": false, "es6": true, "postcss": true, "minified": true },
    "usingComponents": true
  }
}
```

---

## 3. 应用常量

```ts
// config/index.ts
export const APP_CONFIG = {
  name: '应用名称',
  version: '1.0.0',
  defaultPageSize: 10,
  maxPageSize: 100,
  uploadMaxSize: 10 * 1024 * 1024, // 10MB
  imageAccept: ['jpg', 'jpeg', 'png', 'gif'],
  feedbackTel: '400-xxx-xxxx',
};
```
