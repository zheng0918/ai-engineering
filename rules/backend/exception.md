# exception — 异常处理规范

> 本文件规定业务异常、错误码与全局异常处理的强约束。

---

## 1. 统一响应体 — R

```java
@Data
public class R<T> implements Serializable {
    private int code;         // 0=成功
    private String message;   // 提示信息
    private T data;           // 业务数据
    private String traceId;   // 从 MDC 读取

    public static <T> R<T> success() { return new R<>(0, "ok", null); }
    public static <T> R<T> success(T data) { return new R<>(0, "ok", data); }
    public static <T> R<T> success(T data, String message) { return new R<>(0, message, data); }
    public static <T> R<T> fail(int code, String message) { return new R<>(code, message, null); }
}
```

---

## 2. 业务异常 — BizException

```java
@Getter
public class BizException extends RuntimeException {
    private final ErrorCode errorCode;

    public BizException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BizException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BizException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}
```

---

## 3. 错误码枚举 — ErrorCode

编码分段约定：

| 段 | 含义 |
|---|---|
| `0` | 成功 |
| `1xxx` | 通用错误（参数、资源不存在、权限不足） |
| `2xxx` | 用户认证 |
| `3xxx` | 文件/知识库 |
| `4xxx` | 问答 |
| `5xxx` | 审查 |
| `6xxx` | 编写 |
| `9xxx` | 系统/外部 |

```java
@Getter
public enum ErrorCode {
    SUCCESS(0, "ok"),
    PARAM_INVALID(1001, "参数错误"),
    RESOURCE_NOT_FOUND(1002, "资源不存在"),
    FORBIDDEN(1003, "权限不足"),
    LOGIN_FAILED(2001, "用户名或密码错误"),
    ACCOUNT_DISABLED(2002, "账号已停用"),
    TOKEN_INVALID(2004, "登录已失效"),
    SYSTEM_ERROR(9999, "服务端内部错误");
    ...
}
```

---

## 4. GlobalExceptionHandler

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public R<Void> handleBiz(BizException e) {
        log.error("业务异常 code={} msg={}", e.getErrorCode().getCode(), e.getMessage(), e);
        return R.fail(e.getErrorCode().getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Void> handleValid(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String msg = fieldError != null
                ? fieldError.getField() + ": " + fieldError.getDefaultMessage()
                : "参数错误";
        log.error("参数校验失败 msg={}", msg, e);
        return R.fail(ErrorCode.PARAM_INVALID.getCode(), msg);
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleOther(Exception e) {
        log.error("系统未知异常", e);
        return R.fail(ErrorCode.SYSTEM_ERROR.getCode(), "服务端内部错误");
    }
}
```

---

## 5. 异常处理原则

| 原则 | 说明 |
|---|---|
| 业务异常 | 用 `BizException` + `ErrorCode`，全局处理器统一捕获 |
| catch 块 | 只能打 ERROR 级别；异常对象作为最后一个参数传入 |
| HTTP 状态码 | 业务异常返回 HTTP 200 + 非 0 code |
| 不暴露堆栈 | 未知异常向前端隐藏细节 |

---

## 6. 禁止事项

- ❌ 直接抛 `RuntimeException`
- ❌ catch 块吞异常（既不打日志也不上抛）
- ❌ 异常丢失堆栈（`log.error("msg", e.getMessage())`）
- ❌ 向前端暴露堆栈信息
