# entity-design — 实体生成技能

> 本技能根据 `rule.md` 约束与数据库表结构，生成 Entity 类。

---

## 触发条件

当用户要求"创建实体"、"生成 Entity"、"从表生成实体"时触发。

---

## 完整 Entity 示例

```java
package com.example.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.example.model.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

/**
 * 用户实体（对应表 {@code users}）。
 *
 * <p>承载账号密码登录与 RBAC 角色；username 全局唯一。逻辑删除以 deletedAt 判定。
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("users")
public class User extends BaseEntity {

    /** 主键，BIGSERIAL 自增。 */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 登录用户名，全局唯一。 */
    private String username;

    /** BCrypt 密码哈希；绝不能输出到响应体或日志。 */
    private String passwordHash;

    /** 真实姓名。 */
    private String realName;

    /** 系统角色：admin/editor/viewer（DB 存小写）。 */
    private String role;

    /** 账号状态：ACTIVE 正常 / DISABLED 停用。 */
    private String status;
}
```

> **注意**：`createdAt`、`updatedAt`、`deletedAt`、`tenantId`、`createdBy`、`updatedBy` 已由 `BaseEntity` 提供，且 `BaseEntity` 中已加 `@JsonFormat` 和 `@DateTimeFormat` 注解，子类无需重复。

---

## 带自定义时间的 Entity 示例

若 Entity 有额外的时间字段，必须加序列化注解：

```java
/** 任务完成时间。 */
@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
private LocalDateTime completedAt;
```

---

## 枚举字段 Entity 示例

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("documents")
public class Document extends BaseEntity {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 文档名称。 */
    private String name;

    /** 解析状态：PENDING 待解析 / PARSING 解析中 / PARSED 完成 / FAILED 失败。 */
    private String parseStatus;

    /** 文档大小（字节）。 */
    private Long sizeBytes;

    /** MinIO 对象 key；仅 Service 内部使用，绝不外泄到 VO。 */
    private String minioObjectKey;
}
```

---

## 字段类型映射

| DB 类型 | Java 类型 | 备注 |
|---|---|---|
| `BIGSERIAL` / `BIGINT` | `Long` | 主键和 ID 字段 |
| `INT` / `INTEGER` | `Integer` | 小范围整数 |
| `VARCHAR(n)` | `String` | 字符串 |
| `TEXT` | `String` | 长文本 |
| `TIMESTAMP` | `LocalDateTime` | 时间戳，必须加 `@JsonFormat` + `@DateTimeFormat` |
| `DATE` | `LocalDate` | 日期，必须加 `@JsonFormat` |
| `BOOLEAN` | `Boolean` | 布尔 |
| `JSONB` | `String`（+ 类型处理器）| JSON |
| `NUMERIC` / `DECIMAL` | `BigDecimal` | 精确小数 |

---

## 生成时注意事项

1. **每个字段必须写 `/** ... */` 注释**
2. **枚举字段注释必须写取值范围**
3. **敏感字段注释必须写"绝不能在响应体或日志输出"**
4. **继承 `BaseEntity` 自动获得审计字段 + 时间序列化注解**
5. **避免 Lombok `@Data` 的 `@EqualsAndHashCode` 问题：继承时加 `callSuper = true`**
6. **额外时间字段必须加 `@JsonFormat` + `@DateTimeFormat`**
