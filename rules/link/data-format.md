# data-format — 数据格式对齐规范

> 本文件规定后端 Java 类型到 JSON 再到前/小程序 TS 类型的格式转换约束，杜绝 JS 精度丢失与格式偏差。

---

## 1. Long → String（必须）

### 1.1 问题
JavaScript `Number` 只能安全表示 ±2^53 以内的整数，后端雪花算法生成的 Long ID 超出此范围会精度丢失。

### 1.2 后端强制规则

**所有 VO 中的 Long 类型 ID 字段必须加：**
```java
@JsonSerialize(using = ToStringSerializer.class)
private Long id;
```

**全局配置（可选，但推荐）：**
```yaml
spring:
  jackson:
    generator:
      write-numbers-as-strings: true
```

### 1.3 前端/小程序 TypeScript 类型

```ts
// 所有 ID 字段必须声明为 string
export interface UserVO {
  id: string;              // ✅ string — 对应后端 Long + @JsonSerialize
  name: string;
  deptId: string;          // ✅ string — 关联 ID
  roleIds: string[];       // ✅ string[] — ID 数组
}

// ❌ 错误
export interface UserVO {
  id: number;              // ❌ number — JS 精度丢失
}
```

---

## 2. 日期时间格式

### 2.1 后端强制规则

```java
// VO 中的 LocalDateTime 字段
@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
private LocalDateTime createdAt;

// VO 中的 LocalDate 字段
@JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Shanghai")
private LocalDate birthday;

// Entity 中同理（通过 Jackson 序列化时生效）
```

**全局配置（推荐）：**
```yaml
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    serialization:
      write-dates-as-timestamps: false
```

### 2.2 前端/小程序 TypeScript 类型

```ts
export interface UserVO {
  createdAt: string;   // "yyyy-MM-dd HH:mm:ss" 格式
  birthday: string;    // "yyyy-MM-dd" 格式
}
```

### 2.3 前端日期展示

```ts
// 使用 dayjs 格式化展示
import dayjs from 'dayjs';

const formatDateTime = (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss');
const formatDate = (val: string) => dayjs(val).format('YYYY-MM-DD');
```

---

## 3. BigDecimal → String

### 3.1 后端规则

```java
// 金额/价格字段
@JsonFormat(shape = JsonFormat.Shape.STRING)
private BigDecimal price;
```

### 3.2 前端/小程序 TypeScript

```ts
export interface GoodsVO {
  price: string;    // ✅ string — 避免浮点精度丢失
}
```

---

## 4. 枚举值映射

### 4.1 后端枚举定义

```java
@Getter
@AllArgsConstructor
public enum StatusEnum {
    ACTIVE(1, "启用"),
    DISABLED(0, "停用");

    @JsonValue
    private final int code;
    private final String desc;
}
```

### 4.2 前端枚举映射

```ts
// constants/enums.ts
export const StatusMap: Record<number, string> = {
  1: '启用',
  0: '停用',
};

export const StatusOptions = [
  { value: 1, label: '启用' },
  { value: 0, label: '停用' },
];

// 使用
<el-tag :type="row.status === 1 ? 'success' : 'danger'">
  {{ StatusMap[row.status] }}
</el-tag>
```

---

## 5. 布尔值

| 后端 | JSON | 前端/小程序 TS |
|---|---|---|
| `Boolean` / `boolean` | `true` / `false` | `boolean` |
| `Integer` (0/1) | `0` / `1` | `number`（不推荐，建议后端用 Boolean） |

**规则：** 状态标记优先使用 Boolean 类型，不要用 0/1 Integer。

---

## 6. 空值处理

| 后端 | JSON | 说明 |
|---|---|---|
| `null` | `null` | 字段存在但值为 null |
| 空 List | `[]` | 返回空数组，不返回 null |
| 空 String | `""` | 返回空字符串，不返回 null |

```java
// Controller 返回时
return R.success(PageResult.from(page, converter::toVO));
// PageResult.list 为空时 page.getRecords() 返回 []，自然符合规范
```

---

## 7. 数据格式对照速查表

| 后端 Java 类型 | 序列化注解 | JSON 格式 | 前端/小程序 TS |
|---|---|---|---|
| `Long id` | `@JsonSerialize(ToStringSerializer)` | `"1609123456789"` | `string` |
| `LocalDateTime` | `@JsonFormat("yyyy-MM-dd HH:mm:ss")` | `"2025-01-15 14:30:00"` | `string` |
| `LocalDate` | `@JsonFormat("yyyy-MM-dd")` | `"2025-01-15"` | `string` |
| `LocalTime` | `@JsonFormat("HH:mm:ss")` | `"14:30:00"` | `string` |
| `BigDecimal` | `@JsonFormat(shape=STRING)` | `"99.99"` | `string` |
| `String` | — | `"text"` | `string` |
| `Integer` | — | `123` | `number` |
| `Boolean` | — | `true`/`false` | `boolean` |
| `List<T>` | — | `[...]` | `T[]` |
| `enum` (with `@JsonValue`) | `@JsonValue` | `1` | `number` |
| `enum` (without) | — | `"ACTIVE"` | `string` |

---

## 8. 禁止事项

- ❌ VO 中 Long ID 不加 `@JsonSerialize(ToStringSerializer)`
- ❌ LocalDateTime 不加 `@JsonFormat`
- ❌ BigDecimal 不做 `@JsonFormat(shape=STRING)` 导致浮点精度问题
- ❌ 前端 TS 中用 `number` 声明 ID 类型
- ❌ 枚举不定义 `@JsonValue` 导致序列化不一致
- ❌ API 返回 `null` 的 List（必须返回 `[]`）
- ❌ 前端/小程序硬编码枚举映射文案（必须集中管理）
