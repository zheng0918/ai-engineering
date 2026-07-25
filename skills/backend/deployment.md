# deployment — 部署生成技能

> 本技能根据 `rule.md` 约束生成 Dockerfile、docker-compose.yml 与部署文档。

---

## 触发条件

当用户要求"生成 Dockerfile"、"写 docker-compose"、"容器化部署"、"生成部署文档"时触发。

---

## 生成模板

### Dockerfile

```dockerfile
# =====================================================================
# 多阶段构建：Maven 编译 + JRE 运行
# =====================================================================

# ---- Stage 1: Maven 构建 ----
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn -q dependency:go-offline -DskipTests
COPY src ./src
RUN mvn -q -DskipTests package -Dfile.encoding=UTF-8

# ---- Stage 2: 运行镜像 ----
FROM eclipse-temurin:17-jre
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app
USER appuser

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
EXPOSE 8200
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  # ---- 数据库 ----
  postgres:
    image: postgres:16-alpine
    container_name: app-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-myapp}
      POSTGRES_USER: ${DB_USER:-app}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./deploy/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
    ports:
      - "${DB_PORT:-5432}:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-app}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ---- Redis ----
  redis:
    image: redis:7-alpine
    container_name: app-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-changeme}
    volumes:
      - redisdata:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ---- 应用 ----
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: app-server
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-myapp}
      DB_USER: ${DB_USER:-app}
      DB_PASSWORD: ${DB_PASSWORD:-changeme}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-changeme}
      JWT_SECRET: ${JWT_SECRET}
      LOG_PATH: /app/logs
    ports:
      - "${APP_PORT:-8200}:8200"
    volumes:
      - applogs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  applogs:
```

### .env 文件

```bash
# 数据库
DB_NAME=myapp
DB_USER=app
DB_PASSWORD=dev_password_change_me

# Redis
REDIS_PASSWORD=dev_redis_change_me

# JWT（生产环境必须使用随机 256 位密钥）
JWT_SECRET=dev-jwt-secret-change-in-production

# 端口
APP_PORT=8200
DB_PORT=5432
REDIS_PORT=6379
```

---

## 环境变量清单

生成 docker-compose.yml 时，确保以下变量可配置：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | prod | 激活的 profile |
| `DB_HOST` | postgres | 数据库主机 |
| `DB_PORT` | 5432 | 数据库端口 |
| `DB_NAME` | myapp | 数据库名 |
| `DB_USER` | app | 数据库用户 |
| `DB_PASSWORD` | — | 数据库密码（必须覆盖） |
| `REDIS_HOST` | redis | Redis 主机 |
| `REDIS_PORT` | 6379 | Redis 端口 |
| `REDIS_PASSWORD` | — | Redis 密码 |
| `JWT_SECRET` | — | JWT 签名密钥（必须覆盖） |
| `APP_PORT` | 8200 | 应用端口 |
| `LOG_PATH` | /app/logs | 日志目录 |

---

## 生成时注意事项

1. **必须以非 root 用户运行容器**
2. **密钥通过环境变量注入，绝不硬编码在 Dockerfile/yml**
3. **Dockerfile 使用多阶段构建，减小镜像体积**
4. **PostgreSQL/Redis 必须有 healthcheck**
5. **挂载日志目录，便于排障**
6. **依赖服务的 `depends_on` 必须加 `condition: service_healthy`**
7. **`.env` 文件不提交 Git（加入 `.gitignore`）**
