# project-structure — 项目结构初始化技能

> 本技能根据 `rule.md` 约束，生成符合规范的项目骨架。

---

## 触发条件

当用户要求"创建新项目"、"初始化后端项目"、"搭建 Spring Boot 骨架"时触发。

---

## 执行流程

### 1. 确认参数

向用户确认以下参数：
- `basePackage`：基础包名（如 `com.example`）
- `projectName`：项目名（如 `myapp-server`）
- `port`：服务端口（默认 8200）
- `dbType`：数据库类型（默认 PostgreSQL，可选 MySQL）

### 2. 生成 pom.xml

按 [`../config/rule.md`](../config/rule.md) 的依赖规范生成。

### 3. 创建包目录结构

按 `rule.md` §2 的标准包结构创建所有目录。

### 4. 生成基础文件

每个包下生成符合规范的示例文件（见下方模板）。

---

## 完整项目骨架示例

### 目录树

```
src/main/java/com/example/
├── MyappApplication.java
├── controller/
│   └── HealthController.java
├── service/
│   ├── HealthService.java
│   └── impl/
│       └── HealthServiceImpl.java
├── mapper/
├── model/
│   ├── base/
│   │   ├── BaseEntity.java
│   │   └── PageQuery.java
│   ├── entity/
│   ├── vo/
│   ├── dto/
│   └── query/
├── converter/
├── config/
│   ├── MybatisPlusConfig.java
│   ├── CorsConfig.java
│   ├── AsyncConfig.java
│   └── OpenApiConfig.java
├── common/
│   ├── annotation/
│   │   └── RequireRole.java
│   ├── aspect/
│   │   ├── ControllerLogAspect.java
│   │   └── RequireRoleAspect.java
│   ├── constants/
│   │   ├── HeaderConstants.java
│   │   └── SecurityConstants.java
│   ├── context/
│   │   └── UserContext.java
│   ├── enums/
│   ├── exception/
│   │   ├── BizException.java
│   │   ├── ErrorCode.java
│   │   └── GlobalExceptionHandler.java
│   ├── filter/
│   │   ├── TraceIdFilter.java
│   │   └── JwtAuthFilter.java
│   ├── result/
│   │   ├── R.java
│   │   └── PageResult.java
│   └── util/
│       ├── JwtUtil.java
│       ├── PageUtil.java
│       └── PasswordEncoderUtil.java
└── src/main/resources/
    ├── application.yml
    ├── application-dev.yml
    ├── logback-spring.xml
    └── mapper/
```

### BaseEntity（审计字段基类）

```java
package com.example.model.base;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 审计字段基类。
 *
 * <p>所有业务实体统一继承，承载多租户隔离与审计列。
 * 插入/更新时由 MetaObjectHandler 自动填充。
 * deletedAt 作为 @TableLogic 逻辑删除字段（NULL=未删）。
 */
@Data
public abstract class BaseEntity {

    /** 租户 ID，一期恒为 0，预留多租户隔离。 */
    @TableField(value = "tenant_id", fill = FieldFill.INSERT)
    private Long tenantId;

    /** 创建人用户 ID。 */
    @TableField(value = "created_by", fill = FieldFill.INSERT)
    private Long createdBy;

    /** 更新人用户 ID。 */
    @TableField(value = "updated_by", fill = FieldFill.INSERT_UPDATE)
    private Long updatedBy;

    /** 逻辑删除时间戳；NULL 表示未删除。绝不外泄到 VO。 */
    @TableLogic
    @TableField("deleted_at")
    private LocalDateTime deletedAt;

    /** 创建时间。 */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;

    /** 更新时间。 */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime updatedAt;
}
```

### PageQuery（分页查询基类）

```java
package com.example.model.base;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 分页查询入参基类。
 *
 * <p>所有分页查询 Query 继承此类，自动获得 pageNum/pageSize 字段与校验。
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

### 启动类

```java
package com.example;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * {projectName} 启动类。
 *
 * <p>技术栈：JDK 17 + Spring Boot 3.2.x + MyBatis-Plus 3.5.x + PostgreSQL。
 */
@SpringBootApplication
@EnableAsync
@MapperScan("com.example.mapper")
public class MyappApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyappApplication.class, args);
    }
}
```

### application.yml

```yaml
spring:
  application:
    name: myapp-server
  profiles:
    active: dev
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    default-property-inclusion: non_null

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      logic-delete-field: deletedAt
      logic-delete-value: now()
      logic-not-delete-value: 'null'
  mapper-locations: classpath*:/mapper/**/*.xml

server:
  port: 8200
  servlet:
    encoding:
      charset: UTF-8
      force: true

logging:
  level:
    root: INFO
    com.example: INFO
```

---

## 生成后校验

执行 [`../validation/rule.md`](../validation/rule.md) 的校验流程。
