# api — 接口请求生成技能

> 本技能生成 Axios 封装 + API 模块 + 类型定义。

---

## 生成清单

- `api/request.ts` — Axios 实例 + 请求/响应拦截器
- `api/types/common.ts` — `R<T>` + `PageResult<T>` 类型
- `api/modules/{module}.ts` — 按后端 Controller 一一对应

## API 模块模板

```ts
import http from '../request';

// GET 分页
export const getXxxPage = (query: XxxQuery) =>
  http.get<PageResult<XxxVO>>('/api/v1/xxx', { params: query });

// GET 详情
export const getXxxDetail = (id: string) =>
  http.get<XxxVO>(`/api/v1/xxx/${id}`);

// POST 新增
export const createXxx = (dto: XxxCreateDTO) =>
  http.post<XxxVO>('/api/v1/xxx', dto);

// PUT 更新
export const updateXxx = (id: string, dto: Partial<XxxCreateDTO>) =>
  http.put<XxxVO>(`/api/v1/xxx/${id}`, dto);

// DELETE 删除
export const deleteXxx = (id: string) =>
  http.delete(`/api/v1/xxx/${id}`);
```
