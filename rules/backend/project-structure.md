# project-structure — 项目结构强约束

> 本文件规定 Java 后端项目的目录结构、包命名与技术栈约束。与本文件冲突的产物视为不合规。

---

## 1. 技术栈约束

### 1.1 必须使用

- **Java 17 或更高版本**
- **Spring Boot 3.2.x**（作为主框架）
- **MyBatis-Plus 3.5.x**（作为唯一 ORM 框架，禁用 JPA/Hibernate）
- **Lombok**（消除样板代码：`@Data` / `@Slf4j` / `@RequiredArgsConstructor`）
- **Bean Validation**（`jakarta.validation` + `spring-boot-starter-validation`）
- **PostgreSQL**（默认数据库；若需求指定 MySQL 则切换驱动与方言）
- **MapStruct**（Entity ↔ VO 编译期映射）

### 1.2 禁止使用

- Spring Data JPA / Hibernate ORM
- `JpaRepository` / `CrudRepository` / `EntityManager`
- `jakarta.persistence.*` / `javax.persistence.*`
- `spring-boot-starter-data-jpa` / `hibernate-core`

---

## 2. 标准包结构（强制）

```
src/main/java/{basePackage}/
  controller/              # HTTP 入口，仅处理入参/出参/校验/调用 Service
  service/                 # Service 接口
    impl/                  # Service 实现
  mapper/                  # MyBatis-Plus Mapper 接口
  model/                   # 数据模型（父包）
    base/                  # 基础模型
      BaseEntity.java      # 所有实体继承的审计基类
      PageQuery.java       # 所有分页查询入参继承的基类
    entity/                # 数据库实体
    vo/                    # 响应对象
    dto/                   # 请求参数对象（非查询）
    query/                 # 查询入参对象
  converter/               # MapStruct Entity ↔ VO 转换器
  config/                  # 配置类（MyBatis-Plus/CORS/Async/Properties）
  common/
    annotation/            # 自定义注解（如 @RequireRole）
    aspect/                # AOP 切面
    constants/             # 通用常量
    context/               # ThreadLocal 上下文（如 UserContext）
    enums/                 # 通用枚举
    exception/             # 业务异常、错误码、全局异常处理器
    filter/                # Servlet 过滤器（traceId/JWT）
    result/                # 统一响应结构（R / PageResult）
    util/                  # 工具类
```

**说明：**
- 禁止在 `controller/` 中放业务实现
- 禁止在 `mapper/` 中放 Service 逻辑
- `{basePackage}` 按实际项目定义（如 `com.omnimind`、`com.schedule`）
- 多模块场景可按业务子包细分（如 `controller/user/UserController.java`），但分层结构必须保留

### 2.1 资源目录

```
src/main/resources/
  application.yml          # 公共配置
  application-{env}.yml    # 环境相关配置
  logback-spring.xml       # 日志配置
  mapper/                  # MyBatis XML（所有 SQL 定义在此）
    XxxMapper.xml          # 对应 Mapper 的 XML 映射文件
```

---

## 3. 命名规范

| 类型 | 命名规则 | 示例 |
|---|---|---|
| Controller | `XxxController` | `UserController` |
| Service 接口 | `XxxService extends IService<Xxx>` | `UserService` |
| Service 实现 | `XxxServiceImpl extends ServiceImpl<Mapper, Entity> implements XxxService` | `UserServiceImpl` |
| Mapper | `XxxMapper extends BaseMapper<Xxx>` | `UserMapper` |
| Entity | `Xxx extends BaseEntity` | `User` |
| 请求 DTO | `XxxCreateDTO` / `XxxUpdateDTO` | `UserCreateDTO` |
| 查询入参 | `XxxQuery extends PageQuery` | `UserQuery` |
| 响应 VO | `XxxVO` / `XxxDetailVO` | `UserVO` |
| Converter | `XxxConverter` | `UserConverter` |
| 表名 | 蛇形命名（如 `users`、`knowledge_bases`） | — |

---

## 4. 跨模块职责边界

| 层 | 唯一职责 | 禁止 |
|---|---|---|
| **Controller** | HTTP 入参/出参、参数校验、调用 Service | 含业务逻辑；直接注入 Mapper；直接访问数据库 |
| **Service**（接口） | 声明业务能力 | 含实现 |
| **ServiceImpl** | 业务实现、事务边界、调用 Mapper、调用其他 Service | 处理 HTTP 细节 |
| **Mapper** | 数据库访问（仅声明接口方法，SQL 定义在 XML） | 含业务判断；使用 `@Select`/`@Update` 等注解写 SQL |
| **DTO** | 入参对象（请求体） | 承载 Entity 字段以外的内部状态 |
| **Query** | 查询入参（继承 PageQuery 获取分页字段） | 承载业务字段以外的内容 |
| **VO** | 出参对象（响应体） | 携带敏感字段；直接复用 Entity |
| **Entity** | 数据库表结构映射（继承 BaseEntity） | 用作请求体或响应体 |
| **Converter** | Entity ↔ VO 映射（MapStruct） | 含业务逻辑 |

---

## 5. 禁止事项总览

- ❌ Controller 直接注入 Mapper
- ❌ Controller 含业务逻辑
- ❌ Mapper 含业务判断
- ❌ Mapper 接口使用 `@Select` / `@Update` / `@Insert` / `@Delete` 注解写 SQL
- ❌ 无边界全表查询
- ❌ 列表接口无分页
- ❌ 用 Entity 作为复杂请求体
- ❌ VO/响应返回敏感字段（password/token/secret/salt/deleted）
- ❌ 使用 JPA/Hibernate 任意 API
- ❌ Service 中使用 `HttpServletRequest` / `ResponseEntity`
- ❌ 写操作无 `@Transactional`
- ❌ Long 类型直接返回前端（必须转 String 避免 JS 精度丢失）
- ❌ LocalDateTime 不加序列化注解返回前端
