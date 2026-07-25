# api-contract — API 契约规范

> 本文件规定后端 API 与前端/小程序之间的接口契约约束，确保三端对接零歧义。

---

## 1. URL 设计规范

### 1.1 路径结构

```
/api/v1/{resource}          — 资源集合
/api/v1/{resource}/{id}     — 单个资源
/api/v1/{resource}/batch    — 批量操作
```

### 1.2 RESTful 方法约定

| 操作 | HTTP 方法 | 路径 | 后端返回 |
|---|---|---|---|
| 分页列表 | `GET` | `/api/v1/{resources}` | `R<PageResult<XxxVO>>` |
| 详情 | `GET` | `/api/v1/{resources}/{id}` | `R<XxxDetailVO>` |
| 新增 | `POST` | `/api/v1/{resources}` | `R<XxxVO>` |
| 更新 | `PUT` | `/api/v1/{resources}/{id}` | `R<XxxVO>` |
| 删除 | `DELETE` | `/api/v1/{resources}/{id}` | `R<Void>` |
| 批量删除 | `POST` | `/api/v1/{resources}/batch-delete` | `R<Void>` |
| 导出 | `GET` | `/api/v1/{resources}/export` | `Blob`（不包装 R） |
| 上传 | `POST` | `/api/v1/{resources}/upload` | `R<UploadResultVO>` |

### 1.3 路径命名

- 资源名用复数 kebab-case：`/api/v1/knowledge-bases`
- 动作用动词：`/batch-delete`、`/export`、`/import`
- 查询不体现在路径上，用 Query 参数

---

## 2. 请求规范

### 2.1 Query 参数（GET 请求）

```java
// 后端
@GetMapping
public R<PageResult<UserVO>> page(@Valid UserQuery query) { ... }
```

```ts
// 前端
export const getUserPage = (query: UserQuery) =>
  http.get<PageResult<UserVO>>('/api/v1/users', { params: query });
```

```ts
// 小程序
export const getUserList = (query: UserQuery) =>
  request<PageResult<UserVO>>({ url: '/api/v1/users', data: query });
```

### 2.2 Body 参数（POST/PUT 请求）

```java
// 后端
@PostMapping
public R<UserVO> create(@Valid @RequestBody UserCreateDTO dto) { ... }
```

```ts
// 前端
export const createUser = (dto: UserCreateDTO) =>
  http.post<UserVO>('/api/v1/users', dto);
```

### 2.3 Path 参数

```java
// 后端
@GetMapping("/{id}")
public R<UserDetailVO> get(@PathVariable Long id) { ... }
```

```ts
// 前端 — id 为 string（Long 序列化后）
export const getUserDetail = (id: string) =>
  http.get<UserDetailVO>(`/api/v1/users/${id}`);
```

---

## 3. 响应体规范

### 3.1 统一结构

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... },
  "traceId": "a1b2c3d4e5f6"
}
```

**规则：**
- `code === 0` 表示成功，非 0 为业务错误
- HTTP 状态码统一 200（除非文件下载/401 未授权）
- `data` 成功时有值，失败时为 `null`

### 3.2 分页响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "total": 100,
    "list": [...]
  },
  "traceId": "..."
}
```

### 3.3 错误响应

```json
{
  "code": 1002,
  "message": "知识库名称已存在",
  "data": null,
  "traceId": "..."
}
```

---

## 4. 三端契约对照表模板

| API | 后端 Controller | 前端 API Module | 小程序 API Module |
|---|---|---|---|
| `GET /users` | `UserController.page` | `getUserPage` | `getUserList` |
| `GET /users/:id` | `UserController.get` | `getUserDetail` | `getUserDetail` |
| `POST /users` | `UserController.create` | `createUser` | `createUser` |
| `PUT /users/:id` | `UserController.update` | `updateUser` | `updateUser` |
| `DELETE /users/:id` | `UserController.delete` | `deleteUser` | `deleteUser` |

---

## 5. 契约校验清单

- [ ] URL 路径三端一致（包括前缀 `/api/v1`）
- [ ] HTTP 方法一致（GET/POST/PUT/DELETE）
- [ ] Query 参数名称一致（pageNum 而非 page）
- [ ] Body 字段名一致（camelCase）
- [ ] Path 参数位置一致（`:id` 在末尾）
- [ ] 响应体包装一致（R<T> 解包逻辑）
- [ ] 分页响应字段一致（pageNum/pageSize/total/list）

---

## 6. 禁止事项

- ❌ 同一接口三端 URL 不一致
- ❌ 后端用 POST 做查询（必须 GET）
- ❌ GET 请求带 Body
- ❌ 响应结构不用 R<T> 包装
- ❌ Query 参数命名与后端 PageQuery 字段不一致
- ❌ 硬编码 API URL 在前端/小程序业务代码中
