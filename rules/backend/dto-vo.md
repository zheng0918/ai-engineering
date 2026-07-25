# dto-vo — 数据传输对象规范

> 本文件规定 DTO（请求参数对象）、Query（查询入参）与 VO（响应对象）的设计约束。

---

## 1. DTO 规范（请求入参）

### 1.1 命名规范

| 用途 | 命名 | 包位置 | 示例 |
|---|---|---|---|
| 新增 | `XxxCreateDTO` | `model/dto/` | `UserCreateDTO` |
| 更新 | `XxxUpdateDTO` | `model/dto/` | `UserUpdateDTO` |
| 批量操作 | `XxxBatchDTO` | `model/dto/` | `UserBatchDeleteDTO` |
| 动作 | `XxxActionDTO` | `model/dto/` | `ChangePasswordDTO` |
| 查询 | `XxxQuery` | `model/query/` | `UserQuery` |

> **注意**：查询入参命名为 `XxxQuery`（不加 DTO 后缀），放在 `model/query/` 包下，且**必须继承 `PageQuery`**。

---

## 2. Query 规范（查询入参）

### 2.1 PageQuery 基类（`model/base/PageQuery`）

```java
package com.example.model.base;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 分页查询入参基类。
 * 所有分页查询 Query 继承此类，自动获得 pageNum/pageSize 字段与校验。
 */
@Data
public class PageQuery {

    /** 页码，从 1 开始，默认 1。 */
    @Min(value = 1, message = "页码从 1 开始")
    private Long pageNum = 1L;

    /** 每页条数，1-100，默认 10。 */
    @Min(value = 1, message = "每页至少 1 条")
    @Max(value = 100, message = "每页最多 100 条")
    private Long pageSize = 10L;
}
```

### 2.2 查询入参示例（必须继承 PageQuery）

```java
package com.example.model.query;

import com.example.model.base.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户分页查询入参。
 * 对应接口：{@code GET /api/v1/users}
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class UserQuery extends PageQuery {

    /** 用户名或姓名模糊关键字，可空。 */
    private String keyword;

    /** 状态筛选：ACTIVE/DISABLED，可空。 */
    private String status;
}
```

---

## 3. DTO 示例（非查询入参，含 @Schema）

```java
package com.example.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 用户创建入参。
 * 对应接口：{@code POST /api/v1/users}
 */
@Data
public class UserCreateDTO {

    /** 登录用户名，全局唯一，3-64 字符。 */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 64, message = "用户名 3-64 字符")
    @Schema(description = "登录用户名，全局唯一，3-64字符")
    private String username;

    /** 登录密码，6-128 字符。绝不能输出到日志或响应体。 */
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 128, message = "密码 6-128 字符")
    @Schema(description = "登录密码，6-128字符")
    private String password;

    /** 真实姓名，可空。 */
    @Size(max = 64, message = "姓名最多 64 字符")
    @Schema(description = "真实姓名")
    private String realName;

    /** 角色：admin/editor/viewer。默认 editor。 */
    @Schema(description = "系统角色：admin/editor/viewer，默认editor")
    private String role = "editor";
}
```

---

## 4. VO 规范（响应出参）

### 4.1 命名规范

| 用途 | 命名 | 包位置 | 示例 |
|---|---|---|---|
| 列表项 | `XxxVO` | `model/vo/` | `UserVO` |
| 详情 | `XxxDetailVO` | `model/vo/` | `UserDetailVO` |
| 简单响应 | `XxxResultVO` | `model/vo/` | `LoginVO` |

### 4.2 @Schema 注解（强制）

**每个 VO 属性必须添加 `@Schema(description = "字段含义")`**，用于生成 OpenAPI / Swagger 文档。

```java
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "用户ID")
@JsonSerialize(using = ToStringSerializer.class)
private String id;

@Schema(description = "用户名")
private String username;

@Schema(description = "创建时间")
@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
private LocalDateTime createdAt;
```

### 4.3 完整示例（含 Long 转 String + 时间注解 + @Schema）

```java
package com.example.model.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户列表/详情响应。
 * 对应接口：{@code GET /api/v1/users}、{@code GET /api/v1/users/{id}}
 */
@Data
public class UserVO {

    /** 用户 ID（转 String 避免 JS 精度丢失）。 */
    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "用户ID")
    private Long id;

    /** 用户名。 */
    @Schema(description = "用户名")
    private String username;

    /** 真实姓名。 */
    @Schema(description = "真实姓名")
    private String realName;

    /** 角色。 */
    @Schema(description = "系统角色：admin/editor/viewer")
    private String role;

    /** 状态。 */
    @Schema(description = "账号状态：ACTIVE/DISABLED")
    private String status;

    /** 创建时间。 */
    @Schema(description = "创建时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;

    /** 更新时间。 */
    @Schema(description = "更新时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime updatedAt;
}
```

---

## 5. 敏感字段屏蔽

**VO 中禁止包含以下字段：**
- `password` / `passwordHash`
- `token` / `accessToken` / `refreshToken`
- `secret` / `apiSecret` / `clientSecret`
- `salt`
- `deletedAt`（逻辑删除标记）
- `createdBy` / `updatedBy`（内部审计字段，按需暴露）

**禁止通过重命名绕过校验**（如 `password` → `pwd`），必须实际剔除。

---

## 6. 序列化规范（强制）

| 规范 | 要求 |
|---|---|
| Long → String | VO 所有 Long 类型 ID 必须加 `@JsonSerialize(using = ToStringSerializer.class)` |
| LocalDateTime | 所有时间字段必须加 `@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")` |
| null 值 | `application.yml` 全局配置 `default-property-inclusion: non_null` |

---

## 7. MapStruct Converter 规范

```java
package com.example.converter;

import com.example.model.entity.User;
import com.example.model.vo.UserDetailVO;
import com.example.model.vo.UserVO;
import org.mapstruct.Mapper;

import java.util.List;

/**
 * 用户 Entity ↔ VO 转换器。
 */
@Mapper(componentModel = "spring")
public interface UserConverter {

    UserVO toVO(User entity);

    UserDetailVO toDetailVO(User entity);

    List<UserVO> toVOList(List<User> entities);
}
```

---

## 8. 禁止事项

- ❌ 查询入参命名为 `XxxQueryDTO`（应为 `XxxQuery`）
- ❌ 查询入参不继承 `PageQuery`
- ❌ DTO 承载 Entity 字段以外的内部状态
- ❌ VO 携带敏感字段
- ❌ 直接复用 Entity 作为请求体或响应体
- ❌ 用 `Map<String, Object>` 当入参
- ❌ DTO/VO 无字段注释
- ❌ VO 中 Long 类型不加 `@JsonSerialize(using = ToStringSerializer.class)`
- ❌ VO 中时间字段不加 `@JsonFormat`
- ❌ 通过重命名绕过敏感字段校验
- ❌ VO/DTO 属性缺少 `@Schema(description = "...")` 注解
