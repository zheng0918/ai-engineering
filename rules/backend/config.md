# config — 配置规范

> 本文件规定 Java 后端项目的配置类、application.yml 与 pom.xml 的强约束。

---

## 1. application.yml 配置规范

### 1.1 必须项

```yaml
spring:
  application:
    name: {project-name}           # 应用名
  profiles:
    active: {env}                  # 默认激活的环境
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:myapp}?currentSchema=public
    username: ${DB_USER:dev_user}
    password: ${DB_PASSWORD:dev_pass}   # 生产环境通过环境变量覆盖，绝不能输出到日志
    driver-class-name: org.postgresql.Driver
    hikari:
      max-lifetime: 480000          # 8分钟，必须短于防火墙/NAT/数据库侧连接超时，到期主动回收
      keepalive-time: 120000        # 2分钟keepalive，防止中间设备（防火墙/负载均衡）静默断开空闲连接
      idle-timeout: 300000          # 5分钟空闲后回收，减少无效连接堆积
      connection-timeout: 10000     # 获取连接超时10秒
      validation-timeout: 5000      # 连接存活检测超时5秒
  servlet:
    multipart:
      max-file-size: 50MB          # 单文件上限
      max-request-size: 50MB       # 单请求上限
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    default-property-inclusion: non_null  # null 字段不序列化

# MyBatis-Plus 全局配置
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true   # DB snake_case ↔ Java camelCase
  global-config:
    db-config:
      logic-delete-field: deletedAt
      logic-delete-value: now()
      logic-not-delete-value: 'null'

server:
  port: {port}
  servlet:
    encoding:
      charset: UTF-8
      force: true

# 日志级别（仅作为入口覆盖，appender 由 logback 主导）
logging:
  level:
    root: INFO
    com.{basePackage}: INFO
```

### 1.2 HikariCP 连接池配置（强制）

**远程数据库必须配置 `hikari` 参数**，否则连接会被中间网络设备（防火墙/NAT/负载均衡）静默断开，导致 `Failed to validate connection (This connection has been closed.)` 错误。

| 参数 | 推荐值 | 说明 | 为什么 |
|------|--------|------|--------|
| `max-lifetime` | 480000 (8min) | 连接最大存活时间 | **必须短于**数据库侧 `idle_in_transaction_session_timeout` 和防火墙/NAT 超时（通常 15-30min） |
| `keepalive-time` | 120000 (2min) | keepalive 探测间隔 | 防止中间设备因无数据包而静默断开空闲连接 |
| `idle-timeout` | 300000 (5min) | 空闲回收阈值 | 必须小于 `max-lifetime`，及时回收无用的空闲连接 |
| `connection-timeout` | 10000 (10s) | 获取连接等待上限 | 默认 30s 对用户体验偏长，10s 更合理 |
| `validation-timeout` | 5000 (5s) | 连接验证超时 | 快速判定死连接，避免请求长时间阻塞 |

> **核心原则**：`idle-timeout < max-lifetime < 最小(DB侧超时, 防火墙超时, NAT超时)`

### 1.3 注释要求

- 按业务/技术分段，用 `# =====` 大段分隔
- 每个配置组顶部加 1-3 行块注释说明用途
- 每个 key 加行注释说明单位、默认行为、覆盖优先级
- **凭证类**（DB 密码、appid/secret、apiKey、JWT secret）必须标注"绝不能输出到日志/响应体"以及"生产环境通过环境变量覆盖"
- cron 表达式必须解释字段含义

---

## 2. 配置类规范

### 2.1 MyBatis-Plus 配置（必须）

```java
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));
        return interceptor;
    }
}
```

### 2.2 CORS 配置（必须）

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("X-Trace-Id")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 2.3 异步线程池配置

```java
@Configuration
public class AsyncConfig {

    @Bean("asyncExecutor")
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

### 2.4 Properties 配置类

```java
@Data
@ConfigurationProperties(prefix = "app.jwt")
@Configuration
public class JwtProperties {
    /** JWT 签名密钥（HMAC-SHA 256 位密钥，生产环境通过环境变量覆盖，绝不能输出到日志）。 */
    private String secret;
    /** JWT 过期小时数，默认 24。 */
    private long expireHours = 24;
}
```

### 2.5 OpenAPI / Swagger 配置（推荐）

```java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info().title("{项目名} API").version("1.0"));
    }
}
```

---

## 3. pom.xml 规范

### 3.1 必须依赖

```xml
<!-- MyBatis-Plus：项目唯一 ORM（禁用 JPA/Hibernate），Spring Boot 3 专用 starter -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
    <version>3.5.7</version>
</dependency>

<!-- Bean Validation：DTO 入参 @Valid 校验 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- AOP：支撑自定义权限注解的切面 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- MapStruct：Entity ↔ VO 编译期映射 -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
```

### 3.2 Flyway 依赖

```xml
<!-- Flyway：数据库迁移工具 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<!-- ★ 注意：flyway-database-postgresql 不随 flyway-core 传递版本，
     必须显式声明版本号，否则 Maven 解析失败 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
    <version>${flyway.version}</version>
</dependency>
```

**版本配置**：在 `<properties>` 中统一声明 `<flyway.version>10.11.1</flyway.version>`，两个 Flyway 依赖共用该属性。

### 3.3 禁止依赖

```xml
<!-- 严禁 -->
<dependency><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
<dependency><artifactId>hibernate-core</artifactId></dependency>
```

### 3.4 注释要求

- 顶部加 XML 注释说明项目栈（Boot 版本 / Java 版本 / ORM / 关键三方）
- 每个 `<dependency>` 上方加 `<!-- 用途 + 作用域选择理由 -->`
- `<properties>` 集中维护版本号，注释说明版本来源

### 3.5 Maven 编译插件配置（Lombok + MapStruct 注解处理器）

**必须显式配置 `maven-compiler-plugin` 的 `annotationProcessorPaths`**，确保 Lombok 在 MapStruct 之前执行，否则 MapStruct 无法识别 Lombok 生成的 getter/setter：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>17</source>
                <target>17</target>
                <encoding>UTF-8</encoding>
                <annotationProcessorPaths>
                    <!-- Lombok 必须在 MapStruct 之前 -->
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>${lombok.version}</version>
                    </path>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>${mapstruct.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```

> **注意**：不加此配置会导致编译错误 `Unknown property "xxx" in result type XxxVO. Did you mean "null"?`。

---

## 4. 启动类规范

```java
@SpringBootApplication
@EnableAsync              // 若需要异步
@MapperScan("com.{basePackage}.mapper")
public class XxxApplication {
    public static void main(String[] args) {
        SpringApplication.run(XxxApplication.class, args);
    }
}
```

`@MapperScan` 放在启动类或 `MybatisPlusConfig` 上，二选一，禁止两处同时存在。
