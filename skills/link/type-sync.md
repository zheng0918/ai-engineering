# type-sync — 类型同步生成技能

> 本技能根据后端 Java VO/DTO，自动生成前端/小程序的 TypeScript 类型定义。

---

## 触发条件

当需要"同步 TS 类型"、"根据 Java VO 生成 TS 接口"、"对齐前后端类型"时触发。

---

## 生成清单

- 前端：`api/types/{module}.ts` — 每个模块的完整 TS 类型定义
- 小程序：`types/{module}.ts` — 与前段共享或独立生成
- `api/types/common.ts` — 公共泛型类型

---

## 公共类型模板

```ts
// api/types/common.ts

/** 后端统一响应体 */
export interface R<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

/** 分页响应 */
export interface PageResult<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  list: T[];
}

/** 分页查询基类 */
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}
```

---

## Java → TS 自动转换规则脚本

```ts
// scripts/java-to-ts.ts — 概念性转换逻辑，实际由 Agent 执行

type JavaType = 'Long' | 'String' | 'Integer' | 'int' | 'BigDecimal'
  | 'Boolean' | 'boolean' | 'LocalDateTime' | 'LocalDate' | 'List' | 'Map';

interface JavaField {
  name: string;
  type: JavaType;
  genericType?: string;
  hasJsonSerialize: boolean;    // @JsonSerialize(ToStringSerializer)
  hasJsonFormatString: boolean;  // @JsonFormat(shape=STRING)
  hasJsonFormatDate: boolean;    // @JsonFormat(pattern=...)
  hasNotNull: boolean;           // @NotNull/@NotBlank
  isPrimitive: boolean;          // int/boolean 等基本类型
}

const toTsType = (field: JavaField): string => {
  if (field.type === 'Long' && field.hasJsonSerialize) return 'string';
  if (field.type === 'Long' && !field.hasJsonSerialize) return 'number'; // 警告
  if (field.type === 'String') return 'string';
  if (field.type === 'Integer' || field.type === 'int') return 'number';
  if (field.type === 'BigDecimal' && field.hasJsonFormatString) return 'string';
  if (field.type === 'BigDecimal' && !field.hasJsonFormatString) return 'number'; // 警告
  if (field.type === 'Boolean' || field.type === 'boolean') return 'boolean';
  if (field.type === 'LocalDateTime' || field.type === 'LocalDate') return 'string';
  if (field.type === 'List') return `${field.genericType}[]`;
  if (field.type === 'Map') return `Record<string, ${field.genericType}>`;
  return 'unknown';
};

const toTsField = (field: JavaField): string => {
  const optional = !field.hasNotNull && !field.isPrimitive ? '?' : '';
  return `  ${field.name}${optional}: ${toTsType(field)};`;
};
```

---

## 业务类型生成模板

```ts
// api/types/user.ts
import type { PageQuery } from './common';

// ==================== VO ====================

/** 用户列表 VO — 对应 UserVO.java */
export interface UserVO {
  id: string;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  deptId?: string;
  deptName?: string;
  roleNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** 用户详情 VO — 对应 UserDetailVO.java */
export interface UserDetailVO extends UserVO {
  roleIds: string[];
  lastLoginTime?: string;
  remark?: string;
}

// ==================== DTO ====================

/** 新增用户 — 对应 UserCreateDTO.java */
export interface UserCreateDTO {
  username: string;
  password: string;
  realName?: string;
  email?: string;
  phone?: string;
  status: number;
  deptId?: string;
  roleIds?: string[];
}

/** 更新用户 — 对应 UserUpdateDTO.java */
export interface UserUpdateDTO {
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  deptId?: string;
  roleIds?: string[];
}

// ==================== Query ====================

/** 用户查询 — 对应 UserQuery.java */
export interface UserQuery extends PageQuery {
  keyword?: string;
  status?: number;
  deptId?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== 登录 ====================

/** 登录请求 — 对应 LoginDTO.java */
export interface LoginDTO {
  username: string;
  password: string;
}

/** 登录响应 — 对应 LoginVO.java */
export interface LoginVO {
  token: string;
  userInfo: UserVO;
}
```

---

## 小程序类型模板

```ts
// types/user.ts — 与前端一致的字段，可考虑抽取公共包
export interface UserVO {
  id: string;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  createdAt?: string;
}

export interface UserQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
}
```

---

## 生成时注意事项

1. **字段名与后端保持 camelCase**：不转 snake_case（后端已配置 Jackson camelCase）
2. **Long ID 在 TS 定义为 string**：识别 `@JsonSerialize(ToStringSerializer)` 注解
3. **可选性从 `@NotNull`/`@NotBlank`/`@NotEmpty` 反向推断**：有校验注解 → 必填
4. **枚举类型**：后端 enum + `@JsonValue` 输出 code → TS number；无注解 → TS string
5. **日期统一为 string**：不创建 Date 对象（前后端传输格式为字符串）
6. **Query 类型继承 PageQuery**：与后端 Query 继承关系一致
7. **嵌套类型独立定义并 import**：不写 `any` 或 inline 类型
8. **DTO 的必填字段与后端校验注解一致**：前端可用这些信息做表单校验
