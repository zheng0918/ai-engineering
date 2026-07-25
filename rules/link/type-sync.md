# type-sync — 类型同步规范

> 本文件规定后端 Java 类型到前端/小程序 TypeScript 类型的同步约束，确保三端类型定义零偏差。

---

## 1. 同步原则

1. **字段一一对应**：后端 VO 有多少字段，前端 TS 就有多少字段
2. **命名完全一致**：Java camelCase → TS camelCase（JSON 天然一致）
3. **类型按对照表转换**：Long→string, LocalDateTime→string 等
4. **可选性跟随后端**：后端 `@NotNull`/基本类型 = TS 必填；包装类型无注解 = TS 可选

---

## 2. Java → TypeScript 类型转换表

| Java 类型（在 VO 中） | 序列化后 JSON 类型 | TypeScript 类型 |
|---|---|---|
| `Long` + `@JsonSerialize(ToStringSerializer)` | `string` | `string` |
| `Long` (无注解) | `number` | `number`（不推荐，会丢精度） |
| `String` | `string` | `string` |
| `Integer` / `int` | `number` | `number` |
| `BigDecimal` + `@JsonFormat(shape=STRING)` | `string` | `string` |
| `BigDecimal` (无注解) | `number` | `number`（不推荐） |
| `Boolean` / `boolean` | `boolean` | `boolean` |
| `LocalDateTime` + `@JsonFormat` | `string` | `string` |
| `LocalDate` + `@JsonFormat` | `string` | `string` |
| `LocalTime` + `@JsonFormat` | `string` | `string` |
| `List<T>` | `[...]` | `T[]` |
| `Map<String, T>` | `{...}` | `Record<string, T>` |
| `enum` + `@JsonValue(code)` | `number` | `number` |
| `enum` (默认) | `string` | `string` |

---

## 3. 可选性规则

```java
// 必填字段 → TS 必填
@NotNull
private String username;           // → username: string

private int status;                // → status: number（基本类型，JSON 不会为 null）

// 可选字段 → TS 可选
private String email;              // → email?: string

private Long deptId;               // → deptId?: string
```

**Query 类字段规则：**
- 所有查询条件字段都标记为可选（`?:`）
- `pageNum`、`pageSize` 有默认值，但 TS 中标记为可选方便调用

---

## 4. 同步示例

### 后端 VO

```java
@Data
public class UserVO {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @NotNull
    private String username;

    private String realName;
    private String email;
    private String phone;
    private Integer status;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long deptId;

    private String deptName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;
}
```

### 同步后的前端 TS

```ts
// api/types/user.ts
export interface UserVO {
  id: string;                    // Long + @JsonSerialize → string
  username: string;              // @NotNull → 必填
  realName?: string;             // String 无注解 → 可选
  email?: string;
  phone?: string;
  status?: number;
  deptId?: string;               // Long → string
  deptName?: string;
  createdAt?: string;            // LocalDateTime → string
}
```

---

## 5. DTO 同步

```java
// 后端 CreateDTO
@Data
public class UserCreateDTO {
    @NotBlank
    private String username;

    @NotBlank
    @Size(min = 6, max = 32)
    private String password;

    @NotNull
    private Integer status;

    private String email;
    private String phone;
}
```

```ts
// 前端 TS
export interface UserCreateDTO {
  username: string;              // @NotBlank → 必填
  password: string;              // @NotBlank → 必填
  status: number;                // @NotNull → 必填
  email?: string;                // 无注解 → 可选
  phone?: string;
}
```

---

## 6. Query 同步

```java
// 后端
@Data
@EqualsAndHashCode(callSuper = true)
public class UserQuery extends PageQuery {
    private String keyword;
    private Integer status;
    private String startDate;
    private String endDate;
}
```

```ts
// 前端
export interface UserQuery extends PageQuery {
  keyword?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}

// PageQuery 基类
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}
```

---

## 7. 嵌套类型同步

```java
// 后端
@Data
public class OrderVO {
    private String id;
    private String orderNo;
    private UserVO user;            // 嵌套 VO
    private List<OrderItemVO> items; // 嵌套 List
    private AddressVO address;      // 嵌套 VO
}
```

```ts
// 前端 — 嵌套类型同样需要定义和导入
import type { UserVO } from './user';
import type { AddressVO } from './address';

export interface OrderVO {
  id: string;
  orderNo: string;
  user?: UserVO;
  items?: OrderItemVO[];
  address?: AddressVO;
}
```

---

## 8. 类型同步文件组织

```
# 前端
api/types/
├── common.ts         # R<T>, PageResult<T>, PageQuery
├── user.ts           # UserVO, UserDetailVO, UserCreateDTO, UserUpdateDTO, UserQuery
├── goods.ts          # GoodsVO, GoodsCreateDTO, ...
└── ...

# 小程序
types/
├── common.ts         # 与前端一致
├── user.ts
├── goods.ts
└── ...
```

---

## 9. 禁止事项

- ❌ 后端新增字段不同步 TS 类型
- ❌ 后端删除/重命名字段不更新 TS 类型
- ❌ TS 类型用 `any` 代替具体类型
- ❌ TS 字段名与后端不一致（如后端 `realName` → TS `real_name`）
- ❌ 前端和小程序各自维护不同类型的定义（应抽取公共包或确保一致）
- ❌ 后端无 `@NotNull` 的字段在 TS 中声明为必填
