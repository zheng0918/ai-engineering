# logging — 日志生成技能

> 本技能根据 `rule.md` 约束生成日志配置、TraceId 过滤器与 Controller 日志切面。

---

## 生成模板

### logback-spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property name="LOG_PATH" value="${LOG_PATH:-./logs}"/>
    <property name="LOG_PATTERN"
              value="%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [traceId=%X{traceId:-} userId=%X{userId:-}] %logger{36} - %msg%n"/>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>${LOG_PATTERN}</pattern>
            <charset>UTF-8</charset>
        </encoder>
    </appender>

    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>${LOG_PATH}/app.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                <fileNamePattern>${LOG_PATH}/app.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                <maxFileSize>100MB</maxFileSize>
                <maxHistory>30</maxHistory>
                <totalSizeCap>10GB</totalSizeCap>
            </rollingPolicy>
            <encoder>
                <pattern>${LOG_PATTERN}</pattern>
                <charset>UTF-8</charset>
            </encoder>
        </appender>

        <appender name="ERROR_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <filter class="ch.qos.logback.classic.filter.LevelFilter">
                <level>ERROR</level>
                <onMatch>ACCEPT</onMatch>
                <onMismatch>DENY</onMismatch>
            </filter>
            <file>${LOG_PATH}/error.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                <fileNamePattern>${LOG_PATH}/error.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                <maxFileSize>100MB</maxFileSize>
                <maxHistory>60</maxHistory>
            </rollingPolicy>
            <encoder>
                <pattern>${LOG_PATTERN}</pattern>
                <charset>UTF-8</charset>
            </encoder>
        </appender>

        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
            <appender-ref ref="FILE"/>
            <appender-ref ref="ERROR_FILE"/>
        </root>
    </springProfile>

    <springProfile name="!prod">
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <logger name="org.springframework" level="INFO"/>
</configuration>
```

### ControllerLogAspect（中文日志）

```java
@Slf4j
@Aspect
@Component
public class ControllerLogAspect {

    @Pointcut("@within(org.springframework.web.bind.annotation.RestController)")
    public void restController() {}

    @Around("restController()")
    public Object logAround(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String handler = signature.getDeclaringType().getSimpleName() + "#" + signature.getName();
        log.info("接口请求 api={} handler={} 入参={}", requestLine(), handler, formatArgs(pjp.getArgs()));

        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        long cost = System.currentTimeMillis() - start;
        log.info("接口响应 api={} handler={} code={} 耗时={}ms", requestLine(), handler, extractCode(result), cost);
        return result;
    }
}
```

### ServiceImpl 日志示例（中文）

```java
// 简单写操作
log.info("用户创建成功 userId={} username={}", user.getId(), user.getUsername());

// 复杂业务：记录入参 → 中间状态 → 返回
log.info("开始处理订单 orderId={} action={}", orderId, action);
log.info("订单当前状态 orderId={} currentStatus={}", orderId, status);
// ... 处理逻辑 ...
log.info("订单处理完成 orderId={} newStatus={}", orderId, newStatus);

// 分页查询
log.info("分页查询用户 keyword={} pageNum={} pageSize={} total={}", keyword, pn, ps, total);

// 定时任务
log.info("开始扫描超时任务");
log.info("扫描超时任务完成 处理数={} 成功={} 失败={}", total, success, fail);
```

---

## 生成时注意事项

1. **pattern 必须含 `%X{traceId}` 与 `%X{userId}`**
2. **所有日志使用中文**
3. **复杂业务接口必须记录入参、中间状态、返回数据**
4. **只使用 `log.info` 和 `log.error`，不出现 `log.warn`/`log.debug`/`log.trace`**
5. **异常对象必须作为 `log.error()` 的最后一个参数**
