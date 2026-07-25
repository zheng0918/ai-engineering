# logging — 日志规范

> 本文件规定日志配置、级别、脱敏与分层日志职责的强约束。

---

## 1. 日志级别规范（强制二选一）

**全项目只允许 `INFO` 与 `ERROR` 两个级别**。禁止 `WARN` / `DEBUG` / `TRACE`。

| 级别 | 允许场景 |
|---|---|
| **ERROR** | **仅** `catch` 块、校验失败、业务异常、外部不可达等**异常分支** |
| **INFO** | **所有其它场景**：关键业务节点、接口入参/响应、写操作结果、状态变更 |

---

## 2. 日志语言

**统一使用中文**。少量纯英文术语（JWT、SSE、traceId、userId）保留原文。

```java
// 正确
log.info("用户登录成功 userId={} username={}", user.getId(), user.getUsername());
log.error("调用 AI 服务失败 userId={} status={}", userId, e.getStatusCode(), e);

// 错误
log.info("User login success");  // ❌ 英文
log.info("用户登录成功 " + userId);  // ❌ 字符串拼接
```

---

## 3. 分层日志职责

| 层 | INFO（正常业务） | ERROR（异常分支） |
|---|---|---|
| **Filter** | 不打印 | 鉴权失败（不带 token 明文） |
| **Controller** | 入参 + 响应（AOP 切面统一） | 不打印（异常透传） |
| **ServiceImpl** | 写操作成功、查询成功含入参与结果摘要 | 外部调用失败 |
| **Mapper** | 不手写（SQL 日志由框架处理） | 不手写 |
| **外部 Client** | 不打印（成功不占日志） | 调用失败/errcode 非 0/降级 |

### ServiceImpl INFO 日志示例

业务稍微复杂一点的接口，都需要记录入参、中间状态、返回数据：

```java
public void processOrder(Long orderId, OrderActionDTO dto) {
    log.info("开始处理订单 orderId={} action={} operatorId={}", orderId, dto.getAction(), currentUserId);

    Order order = getById(orderId);
    log.info("订单当前状态 orderId={} currentStatus={} targetStatus={}", orderId, order.getStatus(), dto.getAction());

    // 状态校验
    if (!order.getStatus().canTransitionTo(dto.getAction())) {
        throw new BizException(ErrorCode.ORDER_STATUS_INVALID,
                "当前状态 " + order.getStatus() + " 不允许执行 " + dto.getAction());
    }

    order.setStatus(dto.getAction());
    updateById(order);

    log.info("订单处理完成 orderId={} newStatus={}", orderId, order.getStatus());
}
```

---

## 4. 日志基础设施

### 4.1 logback-spring.xml（必须）

- pattern 含 `%X{traceId}` 与 `%X{userId}`
- prod profile 含文件滚动 + ERROR 单独文件
- 日志目录环境变量化 `LOG_PATH`

### 4.2 TraceIdFilter

- `@Order(Ordered.HIGHEST_PRECEDENCE)`
- 优先复用上游 `X-Trace-Id`
- `finally` 中清理 MDC

### 4.3 ControllerLogAspect

- 所有 `@RestController` 统一日志
- 进入打 INFO 入参（脱敏），返回打 INFO 业务码与耗时
- 不捕获异常（透传给 GlobalExceptionHandler）

---

## 5. 日志脱敏

**禁止明文写入日志：** `password`/`passwordHash`、`token`/JWT、`secret`/`apiKey`、`salt`、`openid`/`unionid`、手机号、身份证

---

## 6. 日志写法规范

```java
// ✅ 正确：占位符 + 中文 + 异常对象作为最后一个参数
log.info("用户创建成功 userId={} username={}", user.getId(), user.getUsername());
log.error("调用 AI 服务失败 userId={} status={}", userId, e.getStatusCode(), e);

// ❌ 错误
log.info("User login success");                    // 英文
log.info("用户登录成功 " + userId);                  // 字符串拼接
log.error("失败：" + e.getMessage());               // 丢失堆栈
log.warn("降级了");                                 // WARN 级别禁止
```

---

## 7. 禁止事项

- ❌ `log.warn` / `log.debug` / `log.trace`（全项目仅 INFO / ERROR）
- ❌ `System.out.println` / `printStackTrace()`
- ❌ `log.error("msg", e.getMessage())` 丢失堆栈
- ❌ 字符串 `+` 拼接日志参数
- ❌ 敏感字段明文落日志
- ❌ 循环内无节制打日志
- ❌ catch 块用非 ERROR 级别
- ❌ catch 后既不打日志也不上抛
- ❌ 日志用英文（必须中文）
- ❌ MDC 用完不清理
