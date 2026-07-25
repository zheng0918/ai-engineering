# config — 配置生成技能

> 本技能根据 `rule.md` 约束，生成 application.yml、pom.xml 与全部配置类。

---

## 触发条件

当用户要求"生成配置文件"、"添加配置"、"初始化 pom.xml"时触发。

---

## 检查清单

- [ ] `pom.xml` — 含所有必须依赖、版本管理、注释
- [ ] `application.yml` — 公共配置（端口、Jackson、MP、日志）
- [ ] `application-{env}.yml` — 环境相关配置（DB、Redis、外部服务）
- [ ] `MybatisPlusConfig.java` — 分页插件
- [ ] `CorsConfig.java` — 跨域配置
- [ ] `AsyncConfig.java` — 异步线程池（按需）
- [ ] `OpenApiConfig.java` — Swagger（按需）
- [ ] Properties 类 — 各配置前缀（JWT/MinIO/AI Service）

---

## 生成模板

### pom.xml（关键依赖）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- {项目名} · Java 业务后端 -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>myapp-server</artifactId>
    <version>0.1.0</version>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <mybatis-plus.version>3.5.7</mybatis-plus.version>
        <mapstruct.version>1.5.5.Final</mapstruct.version>
        <lombok.version>1.18.32</lombok.version>
        <flyway.version>10.11.1</flyway.version>
    </properties>

    <dependencies>
        <!-- Web MVC -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Bean Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- AOP -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- MyBatis-Plus：唯一 ORM（禁用 JPA） -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>

        <!-- PostgreSQL 驱动 -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Flyway：数据库迁移工具 -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <!-- ★ flyway-database-postgresql 不随 core 传递版本，必须显式声明 -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
            <version>${flyway.version}</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- MapStruct -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>

        <!-- BCrypt 密码哈希（仅用工具类，不引入 Security 过滤链） -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>

        <!-- 测试 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
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
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                    <encoding>UTF-8</encoding>
                    <annotationProcessorPaths>
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
        </plugins>
    </build>
</project>
```

### JwtProperties

```java
@Data
@ConfigurationProperties(prefix = "app.jwt")
@Configuration
public class JwtProperties {
    /** JWT 签名密钥（生产环境通过环境变量覆盖，绝不能输出到日志）。 */
    private String secret;
    /** JWT 过期小时数，默认 24。 */
    private long expireHours = 24;
}
```

### 环境配置 application-dev.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:myapp}
    username: ${DB_USER:dev_user}
    password: ${DB_PASSWORD:dev_pass}   # 生产环境通过环境变量覆盖，绝不能输出到日志
    driver-class-name: org.postgresql.Driver
    hikari:
      max-lifetime: 480000          # 8分钟，必须短于防火墙/NAT/DB侧超时
      keepalive-time: 120000        # 2分钟keepalive，防止中间设备断开空闲连接
      idle-timeout: 300000          # 5分钟空闲回收
      connection-timeout: 10000     # 获取连接超时10秒
      validation-timeout: 5000      # 连接验证超时5秒
```

---

## 依赖按需添加

| 场景 | 额外依赖 |
|---|---|
| Redis 缓存 | `spring-boot-starter-data-redis` + `commons-pool2` |
| RabbitMQ | `spring-boot-starter-amqp` |
| MinIO 文件存储 | `minio` |
| JWT | `jjwt-api`、`jjwt-impl`、`jjwt-jackson` |
| Flyway 迁移 | `flyway-core` + `flyway-database-postgresql`（后者必须显式 version） |
| Swagger | `springdoc-openapi-starter-webmvc-ui` |
| XXL-Job | `xxl-job-core` |
| Hutool 工具 | `hutool-all` |
| WebClient（SSE） | `spring-boot-starter-webflux` |
