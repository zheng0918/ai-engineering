# security — 安全鉴权生成技能

> 本技能根据 `rule.md` 约束生成 JWT 鉴权体系。

---

## 生成清单

- [ ] `common/util/JwtUtil.java` — JWT 签发与解析
- [ ] `config/JwtProperties.java` — JWT 配置属性
- [ ] `common/filter/JwtAuthFilter.java` — JWT 鉴权过滤器
- [ ] `common/context/UserContext.java` — 用户上下文（ThreadLocal）
- [ ] `common/util/PasswordEncoderUtil.java` — BCrypt 密码工具
- [ ] `common/constants/SecurityConstants.java` — 安全常量
- [ ] `common/constants/HeaderConstants.java` — 请求头常量
- [ ] `config/CorsConfig.java` — 跨域配置
- [ ] `common/annotation/RequireRole.java` — 角色权限注解
- [ ] `common/aspect/RequireRoleAspect.java` — 权限切面

---

## JwtAuthFilter 完整模板

```java
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (isWhitelisted(path)) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = resolveToken(request);
        if (!StringUtils.hasText(token)) {
            log.error("JWT 校验失败：缺少 token path={}", path);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        UserContext.CurrentUser user = jwtUtil.parse(token);
        if (user == null) {
            log.error("JWT 校验失败：token 无效或已过期 path={}", path);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        try {
            UserContext.set(user);
            MDC.put("userId", String.valueOf(user.getUserId()));
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
            MDC.remove("userId");
        }
    }
}
```

---

## 登录 Controller

```java
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "认证")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "登录")
    public R<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return R.success(authService.login(dto));
    }
}
```

---

## 生成时注意事项

1. **JWT secret 必须通过环境变量注入**
2. **JwtAuthFilter order=2，TraceIdFilter 为 HIGHEST_PRECEDENCE**
3. **每次请求结束必须清理 ThreadLocal 和 MDC**
4. **密码 BCrypt 加密，绝不输出到响应体/日志**
