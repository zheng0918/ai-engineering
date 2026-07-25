# data-format — 数据格式对齐生成技能

> 本技能生成后端 VO 的序列化注解 + 前端/小程序对应的 TypeScript 类型定义。

---

## 触发条件

当需要"对齐数据格式"、"生成 VO 序列化配置"、"生成 TS 类型定义"时触发。

---

## 生成清单

- 后端：VO 中 Long→String 注解、LocalDateTime→格式注解、BigDecimal→精度处理
- 前端：`api/types/{module}.ts` TypeScript 接口定义
- 小程序：`types/{module}.ts` TypeScript 接口定义
- 枚举映射常量文件

---

## 后端 VO 注解模板

```java
@Data
public class UserVO implements Serializable {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String username;
    private String realName;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long deptId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime updatedAt;
}
```

---

## 后端带金额的 VO 模板

```java
@Data
public class GoodsVO implements Serializable {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String title;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal price;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal originalPrice;
}
```

---

## 前端 TypeScript 类型生成模板

```ts
// api/types/user.ts — 与后端 UserVO 字段一一对应
export interface UserVO {
  id: string;                    // Long → string
  username: string;
  realName: string;
  deptId: string;               // Long → string
  createdAt: string;            // LocalDateTime → "yyyy-MM-dd HH:mm:ss"
  updatedAt: string;
}

export interface UserDetailVO extends UserVO {
  email: string;
  phone: string;
  roleIds: string[];            // List<Long> → string[]
}
```

---

## 小程序 TypeScript 类型模板

```ts
// types/user.ts — 与前端共享类型定义（可抽取公共 types 包）
export interface UserVO {
  id: string;
  username: string;
  realName: string;
  deptId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 枚举映射模板

```ts
// 后端枚举
// StatusEnum: ACTIVE(1, "启用"), DISABLED(0, "停用")
// GenderEnum: MALE("M", "男"), FEMALE("F", "女")

// constants/enums.ts
export const StatusMap: Record<number, string> = {
  1: '启用',
  0: '停用',
} as const;

export const StatusOptions = [
  { value: 1, label: '启用' },
  { value: 0, label: '停用' },
];

export const GenderMap: Record<string, string> = {
  M: '男',
  F: '女',
} as const;

// 带样式的状态映射（用于 el-tag）
export const StatusTagMap: Record<number, { type: 'success' | 'danger' | 'warning' | 'info'; text: string }> = {
  1: { type: 'success', text: '启用' },
  0: { type: 'danger', text: '停用' },
};
```

---

## 字段类型对照生成规则

| 后端字段特征 | TS 类型 |
|---|---|
| `Long id` (有 @JsonSerialize) | `string` |
| `Long xxxId` (关联 ID) | `string` |
| `List<Long>` | `string[]` |
| `String` | `string` |
| `Integer` / `int` | `number` |
| `BigDecimal` (有 @JsonFormat STRING) | `string` |
| `BigDecimal` (无注解) | `number`（不推荐） |
| `Boolean` / `boolean` | `boolean` |
| `LocalDateTime` / `LocalDate` / `LocalTime` | `string` |
| `Enum` (有 @JsonValue code) | `number` |
| `Enum` (无 @JsonValue) | `string` |
| `List<T>` | `T[]` |
| `Map<K,V>` | `Record<K, V>` |

---

## 生成时注意事项

1. **所有 Long ID 必须有 `@JsonSerialize`**，否则前端 `number` 会精度丢失
2. **所有 LocalDateTime 必须有 `@JsonFormat`**，否则默认序列化为数组 `[2025,1,15,14,30,0]`
3. **BigDecimal 强转为 String**，否则 `0.1 + 0.2 = 0.30000000000000004`
4. **TS 类型与后端 VO 字段一一对应**，不多不少
5. **枚举值集中管理**，不在各页面散落映射逻辑
6. **关联 ID 与主键 ID 同样处理**：Long → string
