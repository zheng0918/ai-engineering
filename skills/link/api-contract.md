# api-contract — API 契约生成技能

> 本技能根据需求文档生成三端 API 契约定义与对照表。

---

## 触发条件

当需要"定义 API 契约"、"生成接口文档"、"对齐前后端接口"时触发。

---

## 生成清单

- API 契约定义文档（每个 API 完整的 Request/Response 结构）
- 三端接口对照表

---

## API 契约定义模板

```markdown
## {资源名} API

### 1. 分页列表
- **URL:** `GET /api/v1/{resources}`
- **Query:** `{resource}Query { pageNum, pageSize, keyword?, status?, startDate?, endDate? }`
- **Response:** `R<PageResult<{resource}VO>>`

### 2. 详情
- **URL:** `GET /api/v1/{resources}/{id}`
- **Response:** `R<{resource}DetailVO>`

### 3. 新增
- **URL:** `POST /api/v1/{resources}`
- **Body:** `{resource}CreateDTO`
- **Response:** `R<{resource}VO>`

### 4. 更新
- **URL:** `PUT /api/v1/{resources}/{id}`
- **Body:** `{resource}UpdateDTO`
- **Response:** `R<{resource}VO>`

### 5. 删除
- **URL:** `DELETE /api/v1/{resources}/{id}`
- **Response:** `R<Void>`
```

---

## 三端对照表模板

```markdown
| 接口 | Method + URL | 后端 Controller | 前端 API 函数 | 小程序 API 函数 |
|---|---|---|---|---|
| 分页 | `GET /api/v1/users` | `UserController#page` | `getUserPage` | `getUserList` |
| 详情 | `GET /api/v1/users/:id` | `UserController#get` | `getUserDetail` | `getUserDetail` |
| 新增 | `POST /api/v1/users` | `UserController#create` | `createUser` | `createUser` |
| 更新 | `PUT /api/v1/users/:id` | `UserController#update` | `updateUser` | `updateUser` |
| 删除 | `DELETE /api/v1/users/:id` | `UserController#delete` | `deleteUser` | `deleteUser` |
```

---

## 契约校验脚本模板

```ts
// scripts/check-api-contract.ts — 检查前后端 API 一致性
interface ContractCheck {
  url: string;
  method: string;
  backendExists: boolean;
  frontendExists: boolean;
  miniProgramExists: boolean;
  issues: string[];
}
```

---

## 生成时注意事项

1. **URL 必须使用完整路径**（含 `/api/v1` 前缀）
2. **Query 参数命名必须与后端 PageQuery 字段完全一致**
3. **Response 类型必须明确**（List 用 PageResult，详情用 DetailVO）
4. **三端函数命名建议一致**（camelCase，仅语言习惯差异）
5. **导出接口不包装 R<T>**（直接返回 Blob）
