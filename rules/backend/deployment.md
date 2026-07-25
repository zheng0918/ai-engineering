# deployment — 部署规范

> 本文件规定 Docker 容器化部署、docker-compose.yml 与 Dockerfile 的编写规范。

---

## 1. Dockerfile 模板

```dockerfile
# =====================================================================
# 阶段 1：Maven 构建
# =====================================================================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build
COPY pom.xml .
# 预下载依赖（利用 Docker 缓存层）
RUN mvn -q dependency:go-offline -DskipTests

COPY src ./src
# 编译打包，跳过测试（测试应在 CI 前置执行）
RUN mvn -q -DskipTests package -Dfile.encoding=UTF-8

# =====================================================================
# 阶段 2：运行镜像
# =====================================================================
FROM eclipse-temurin:17-jre

# 非 root 运行
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar

# 日志挂载点
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

USER appuser

# JVM 参数（容器感知内存、强制 UTF-8、GC 日志）
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"

EXPOSE 8200

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

## 2. docker-compose.yml 模板

```yaml
version: "3.8"

services:
  # ---- 数据库 ----
  postgres:
    image: postgres:16-alpine
    container_name: app-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-omnimind_biz}
      POSTGRES_USER: ${DB_USER:-app_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./deploy/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
    ports:
      - "${DB_PORT:-5432}:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-app_user}"]
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

  # ---- Java 业务后端 ----
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: app-server
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-omnimind_biz}
      DB_USER: ${DB_USER:-app_user}
      DB_PASSWORD: ${DB_PASSWORD:-changeme}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-changeme}
      LOG_PATH: /app/logs
      # JWT secret 必须通过环境变量注入（绝不能硬编码在 yml）
      JWT_SECRET: ${JWT_SECRET}
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

  # ---- Nginx 反向代理（可选） ----
  nginx:
    image: nginx:alpine
    container_name: app-nginx
    volumes:
      - ./deploy/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - app
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  applogs:
```

---

## 3. .env 模板（本地开发用，不提交 Git）

```bash
# 数据库
DB_NAME=omnimind_biz
DB_USER=app_user
DB_PASSWORD=dev_password_123

# Redis
REDIS_PASSWORD=dev_redis_123

# JWT 签名密钥（生产环境至少 256 位随机字符串）
JWT_SECRET=dev-jwt-secret-change-in-production

# 应用端口
APP_PORT=8200
DB_PORT=5432
REDIS_PORT=6379
```

---

## 4. nginx.conf 模板

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/json;

    # 上游服务
    upstream app_backend {
        server app:8200;
    }

    server {
        listen 80;

        # 前端静态资源
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # API 代理
        location /api/ {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Trace-Id $request_id;

            # SSE 长连接放行
            proxy_read_timeout 300s;
            proxy_buffering off;
        }
    }
}
```

---

## 5. 环境变量规范

| 变量 | 说明 | 必须覆盖 |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | 激活的 profile（dev/prod） | 是 |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | 数据库连接 | 是 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 | 是 |
| `JWT_SECRET` | JWT 签名密钥 | 是（生产） |
| `LOG_PATH` | 日志输出目录 | 否（默认 ./logs） |
| `JAVA_OPTS` | JVM 额外参数 | 否 |

---

## 6. 禁止事项

- ❌ 密钥硬编码在 Dockerfile / yml
- ❌ 以 root 用户运行容器
- ❌ Dockerfile 中把所有文件 COPY 到一个层（破坏缓存）
- ❌ docker-compose.yml 无 healthcheck
- ❌ 无 .env 文件导致本地无法一键启动
- ❌ 生产环境用 `latest` tag
