# exception — 异常处理生成技能

> 本技能根据 `rule.md` 约束生成异常处理体系。

---

## 生成清单

- [ ] `common/result/R.java` — 统一响应体（`success()` / `fail()`）
- [ ] `common/exception/BizException.java` — 业务异常
- [ ] `common/exception/ErrorCode.java` — 错误码枚举（按段分配）
- [ ] `common/exception/GlobalExceptionHandler.java` — 全局异常处理器

---

## R.java 完整模板

```java
package com.example.common.result;

import com.example.common.constants.HeaderConstants;
import lombok.Data;
import org.slf4j.MDC;

import java.io.Serializable;

/**
 * 统一响应体 {@code {code, message, data, traceId}}。
 */
@Data
public class R<T> implements Serializable {

    private int code;
    private String message;
    private T data;
    private String traceId;

    private R(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.traceId = MDC.get(HeaderConstants.MDC_TRACE_ID);
    }

    public static <T> R<T> success() {
        return new R<>(0, "ok", null);
    }

    public static <T> R<T> success(T data) {
        return new R<>(0, "ok", data);
    }

    public static <T> R<T> success(T data, String message) {
        return new R<>(0, message, data);
    }

    public static <T> R<T> fail(int code, String message) {
        return new R<>(code, message, null);
    }
}
```

## BizException 完整模板

```java
package com.example.common.exception;

import lombok.Getter;

/**
 * 业务异常。
 * 所有可预期的业务错误统一抛出本异常，由 GlobalExceptionHandler 捕获。
 */
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

## GlobalExceptionHandler 完整模板

```java
package com.example.common.exception;

import com.example.common.result.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 全局异常处理器。
 * 所有异常 → 统一响应 R，HTTP 200 + 非 0 code。
 * catch 块只能打 ERROR 级别，异常对象作为最后一个参数。
 */
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

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public R<Void> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String msg = "参数 " + e.getName() + " 格式错误";
        log.error("参数类型不匹配 name={} value={}", e.getName(), e.getValue(), e);
        return R.fail(ErrorCode.PARAM_INVALID.getCode(), msg);
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleOther(Exception e) {
        log.error("系统未知异常", e);
        return R.fail(ErrorCode.SYSTEM_ERROR.getCode(), "服务端内部错误");
    }
}
```

## 业务模块错误码添加指南

```java
// ---- 7xxx 订单 ----
ORDER_NOT_FOUND(7001, "订单不存在"),
ORDER_STATUS_INVALID(7002, "订单状态不允许此操作"),
```
