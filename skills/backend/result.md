# result — 统一响应生成技能

> 本技能根据 `rule.md` 约束生成 R 与 PageResult。

---

## 触发条件

当用户要求"创建响应结构"、"统一返回格式"、"添加分页响应"时触发。

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
 *
 * <p>code=0 成功，非 0 为业务码；HTTP 状态码与业务码解耦——
 * 业务异常一律 HTTP 200 + 非 0 code，由前端按 code 判定。
 * traceId 自动从 MDC 读取，贯穿全链路日志。
 */
@Data
public class R<T> implements Serializable {

    /** 业务状态码：0 成功。 */
    private int code;

    /** 提示信息，成功为 "ok"。 */
    private String message;

    /** 业务数据载荷，失败时为 null。 */
    private T data;

    /** 全链路追踪 ID，从 MDC 的 traceId 读取。 */
    private String traceId;

    private R(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.traceId = MDC.get(HeaderConstants.MDC_TRACE_ID);
    }

    /** 无数据成功响应。 */
    public static <T> R<T> success() {
        return new R<>(0, "ok", null);
    }

    /** 带数据成功响应。 */
    public static <T> R<T> success(T data) {
        return new R<>(0, "ok", data);
    }

    /** 带数据和消息的成功响应。 */
    public static <T> R<T> success(T data, String message) {
        return new R<>(0, message, data);
    }

    /** 失败响应。 */
    public static <T> R<T> fail(int code, String message) {
        return new R<>(code, message, null);
    }
}
```

## PageResult.java 完整模板

```java
package com.example.common.result;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.function.Function;

/**
 * 分页响应包装。
 *
 * <p>统一列表接口分页结构，承载当前页数据与总量。
 */
@Data
public class PageResult<T> implements Serializable {

    private long pageNum;
    private long pageSize;
    private long total;
    private List<T> list;

    public static <E, T> PageResult<T> from(IPage<E> page, Function<E, T> converter) {
        PageResult<T> result = new PageResult<>();
        result.setPageNum(page.getCurrent());
        result.setPageSize(page.getSize());
        result.setTotal(page.getTotal());
        result.setList(page.getRecords().stream().map(converter).toList());
        return result;
    }

    public static <T> PageResult<T> from(IPage<T> page) {
        return from(page, Function.identity());
    }
}
```

## PageUtil.java 完整模板

```java
package com.example.common.util;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public final class PageUtil {
    private PageUtil() {}

    private static final long DEFAULT_SIZE = 10L;
    private static final long MAX_SIZE = 100L;

    public static <T> Page<T> of(Long pageNum, Long pageSize) {
        long pn = pageNum == null || pageNum < 1 ? 1 : pageNum;
        long ps = pageSize == null || pageSize < 1 ? DEFAULT_SIZE
                : Math.min(pageSize, MAX_SIZE);
        return new Page<>(pn, ps);
    }
}
```
