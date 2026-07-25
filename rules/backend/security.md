# security — 安全与鉴权规范

> 本文件规定 JWT 鉴权、密码安全、CORS 配置与权限控制规范。

---

## 1. JWT 鉴权体系（POC 轻量，不引 Spring Security）

```
请求 → TraceIdFilter（最高优先级）
     → JwtAuthFilter（白名单放行 / JWT 解析 / 写入 UserContext）
     → Controller
```

### JwtUtil

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil {
    private final JwtProperties jwtProperties;

    public String issue(Long userId, String username, String role, Long tenantId) {
        long now = System.currentTimeMillis();
        long expireMillis = jwtProperties.getExpireHours() * 3600_000L;
        return Jwts.builder()
                .subject(username)
                .claim("uid", userId)
                .claim("role", role)
                .claim("tenantId", tenantId)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expireMillis))
                .signWith(signingKey())
                .compact();
    }

    public UserContext.CurrentUser parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(signingKey()).build()
                    .parseSignedClaims(token).getPayload();
            return new UserContext.CurrentUser(
                    claims.get("uid", Number.class).longValue(),
                    claims.getSubject(),
                    claims.get("role", String.class),
                    claims.get("tenantId", Number.class) != null
                            ? claims.get("tenantId", Number.class).longValue() : 0L);
        } catch (Exception e) {
            log.error("JWT 解析失败", e);
            return null;
        }
    }
}
```

### JwtAuthFilter

- `@Order(2)`（TraceIdFilter 之后）
- 白名单放行（health / login / swagger / internal）
- 解析 token → 写入 UserContext → `finally` 清理 ThreadLocal + MDC
- 鉴权失败返回 HTTP 401

### UserContext（ThreadLocal）

```java
public final class UserContext {
    private static final ThreadLocal<CurrentUser> HOLDER = new ThreadLocal<>();

    public static void set(CurrentUser user) { HOLDER.set(user); }
    public static CurrentUser get() { return HOLDER.get(); }
    public static Long requireUserId() {
        CurrentUser u = HOLDER.get();
        if (u == null || u.getUserId() == null) throw new BizException(ErrorCode.TOKEN_INVALID);
        return u.getUserId();
    }
    public static void clear() { HOLDER.remove(); }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentUser {
        private Long userId;
        private String username;
        private String role;
        private Long tenantId;
    }
}
```

---

## 2. 密码安全

- 使用 BCrypt 加密，存储在 `password_hash` 字段
- `PasswordEncoderUtil.encode(raw)` / `matches(raw, encoded)`
- `password_hash` 绝不能出现在响应体或日志

---

## 3. 角色权限控制

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String[] value();
}

// 使用
@DeleteMapping("/{id}")
@RequireRole({"admin", "editor"})
public R<Void> delete(@PathVariable Long id) { ... }
```

---

## 4. 禁止事项

- ❌ 引入 Spring Security（POC 轻量方案）
- ❌ 密码明文存储
- ❌ 日志/响应体输出密码/token/secret
- ❌ ThreadLocal 不清理
