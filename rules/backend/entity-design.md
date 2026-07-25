# entity-design — 实体设计规范

> 本文件规定数据库实体（Entity）的设计约束、审计字段基类与序列化规范。

---

## 1. Entity 注解规范

### 1.1 必须使用 MyBatis-Plus 注解

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("users")
public class User extends BaseEntity {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_name")
    private String userName;

    /** 创建时间。返回前端时按字符串序列化，避免时间格式不一致。 */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
```

### 1.2 可用注解清单

| 注解 | 用途 | 示例 |
|---|---|---|
| `@TableName("xxx")` | 类级，绑定表名 | `@TableName("users")` |
| `@TableId(value = "id", type = IdType.AUTO)` | 主键 | — |
| `@TableField("col_name")` | 字段映射（不一致时显式声明） | — |
| `@TableLogic` | 逻辑删除字段 | — |
| `@Version` | 乐观锁字段 | — |
| `@TableField(fill = FieldFill.INSERT)` | 插入时自动填充 | — |
| `@TableField(fill = FieldFill.INSERT_UPDATE)` | 插入/更新时自动填充 | — |

### 1.3 必须的序列化注解

所有 Entity 的 `LocalDateTime` 字段和所有 VO 的 `LocalDateTime` 字段都必须添加：

```java
/** {字段说明}。 */
@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
private LocalDateTime createdAt;
```

所有返回前端的 `Long` 类型 ID 字段在 VO 中必须转为 String：

```java
/** 用户 ID（返回前端时转为 String 避免 JS 精度丢失）。 */
@JsonSerialize(using = ToStringSerializer.class)
private Long id;
```

或者在 application.yml 中全局配置：
```yaml
spring:
  jackson:
    generator:
      write-numbers-as-strings: true   # 全局 Long 转 String（备选方案）
```

**推荐使用 `@JsonSerialize(using = ToStringSerializer.class)` 在 VO 字段上精确控制。**

### 1.4 禁止使用 JPA 注解

**严禁**出现以下注解：`@Entity`、`@Table`、`@Id`、`@Column`、`@GeneratedValue`、`@OneToMany`、`@ManyToOne`、`@ManyToMany`、`@OneToOne`、`@JoinColumn`、`@MappedSuperclass`

---

## 2. BaseEntity（必须继承）

所有业务实体统一继承 `model/base/BaseEntity`：

```java
package com.example.model.base;

@Data
public abstract class BaseEntity {

    @TableField(value = "tenant_id", fill = FieldFill.INSERT)
    private Long tenantId;

    @TableField(value = "created_by", fill = FieldFill.INSERT)
    private Long createdBy;

    @TableField(value = "updated_by", fill = FieldFill.INSERT_UPDATE)
    private Long updatedBy;

    @TableLogic
    @TableField("deleted_at")
    private LocalDateTime deletedAt;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
```

### 2.1 审计自动填充处理器

```java
@Slf4j
@Component
public class MybatisPlusAuditHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        UserContext.CurrentUser user = UserContext.get();
        Long userId = user != null ? user.getUserId() : null;
        Long tenantId = user != null && user.getTenantId() != null ? user.getTenantId() : 0L;

        strictInsertFill(metaObject, "createdAt", LocalDateTime.class, now);
        strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, now);
        strictInsertFill(metaObject, "createdBy", Long.class, userId);
        strictInsertFill(metaObject, "updatedBy", Long.class, userId);
        strictInsertFill(metaObject, "tenantId", Long.class, tenantId);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
        strictUpdateFill(metaObject, "updatedBy", Long.class,
                UserContext.get() != null ? UserContext.get().getUserId() : null);
    }
}
```

---

## 3. 字段注释规范

每个字段必须有 `/** ... */` 注释，覆盖：
- 业务含义（不重复字段名）
- 是否必填、默认值、长度/范围
- 枚举取值范围
- 与其它字段的关系
- 敏感性提示

```java
/** 主键，BIGSERIAL 自增。 */
@TableId(value = "id", type = IdType.AUTO)
private Long id;

/** BCrypt 密码哈希；绝不能输出到响应体或日志。 */
private String passwordHash;

/** 系统角色：admin/editor/viewer（DB 存小写）。 */
private String role;

/** 创建时间。 */
@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
private LocalDateTime createdAt;
```

---

## 4. 逻辑删除

- 使用 `@TableLogic` 标记 `deletedAt` 字段
- NULL = 未删除，删除时填当前时间戳
- VO 中绝不返回 `deletedAt`

---

## 5. Long 类型 ID 序列化规范

所有返回前端的 VO/Entity，其 Long 类型 ID 必须：

```java
/** 用户 ID。 */
@JsonSerialize(using = ToStringSerializer.class)
private Long id;
```

**原因**：JavaScript 的 `Number` 类型最大安全整数为 `2^53-1`（约 9007199254740991），超出会丢失精度。PostgreSQL BIGSERIAL 可达到此范围。

---

## 6. 禁止事项

- ❌ 使用 JPA 注解
- ❌ Entity 缺少字段注释
- ❌ Entity 用作请求体或响应体
- ❌ 未继承 BaseEntity（业务实体）
- ❌ 审计字段无自动填充处理器
- ❌ `deletedAt` 泄露到 VO
- ❌ LocalDateTime 字段不加 `@JsonFormat` 和 `@DateTimeFormat`
- ❌ VO 中 Long 类型不加 `@JsonSerialize(using = ToStringSerializer.class)`
