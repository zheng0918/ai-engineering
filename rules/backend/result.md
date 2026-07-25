# result — 统一响应结构规范

> 本文件规定统一响应体（R）与分页响应（PageResult）的结构约束。

---

## 1. R — 统一响应体

### 1.1 结构定义

```java
@Data
public class R<T> implements Serializable {

    /** 业务状态码：0 成功；非 0 为业务码。 */
    private int code;

    /** 提示信息，成功为 "ok"。 */
    private String message;

    /** 业务数据载荷，失败时为 null。 */
    private T data;

    /** 全链路追踪 ID，从 MDC 的 traceId 读取。 */
    private String traceId;
}
```

### 1.2 工厂方法

```java
// 成功（无数据）
public static <T> R<T> success() { ... }

// 成功（带数据）
public static <T> R<T> success(T data) { ... }

// 成功（带数据 + 自定义消息）
public static <T> R<T> success(T data, String message) { ... }

// 失败
public static <T> R<T> fail(int code, String message) { ... }
```

### 1.3 响应示例

```json
// 成功
{
    "code": 0,
    "message": "ok",
    "data": { "id": "1", "username": "admin" },
    "traceId": "a1b2c3d4e5f6"
}

// 失败
{
    "code": 1002,
    "message": "资源不存在",
    "data": null,
    "traceId": "a1b2c3d4e5f6"
}
```

---

## 2. PageResult — 分页响应

### 2.1 结构定义

```java
@Data
public class PageResult<T> implements Serializable {

    /** 当前页码（从 1 开始）。 */
    private long pageNum;

    /** 每页条数。 */
    private long pageSize;

    /** 总记录数。 */
    private long total;

    /** 当前页数据列表。 */
    private List<T> list;

    public static <E, T> PageResult<T> from(IPage<E> page, Function<E, T> converter) {
        PageResult<T> result = new PageResult<>();
        result.setPageNum(page.getCurrent());
        result.setPageSize(page.getSize());
        result.setTotal(page.getTotal());
        result.setList(page.getRecords().stream().map(converter).toList());
        return result;
    }
}
```

### 2.2 Controller 使用方式

```java
// 分页列表
@GetMapping
public R<PageResult<UserVO>> page(@Valid UserQuery query) {
    Page<User> page = userService.page(query.getKeyword(),
            query.getPageNum(), query.getPageSize());
    return R.success(PageResult.from(page, userConverter::toVO));
}

// 详情
@GetMapping("/{id}")
public R<UserDetailVO> get(@PathVariable Long id) {
    return R.success(userService.getDetail(id));
}

// 新增
@PostMapping
public R<UserVO> create(@Valid @RequestBody UserCreateDTO dto) {
    return R.success(userService.create(dto));
}

// 删除
@DeleteMapping("/{id}")
public R<Void> delete(@PathVariable Long id) {
    userService.delete(id);
    return R.success();
}
```

### 2.3 分页响应示例

```json
{
    "code": 0,
    "message": "ok",
    "data": {
        "pageNum": 1,
        "pageSize": 10,
        "total": 100,
        "list": [ ... ]
    },
    "traceId": "a1b2c3d4e5f6"
}
```

---

## 3. PageUtil 分页工具

```java
public final class PageUtil {
    private PageUtil() {}

    public static <T> Page<T> of(Long pageNum, Long pageSize) {
        long pn = pageNum == null || pageNum < 1 ? 1 : pageNum;
        long ps = pageSize == null || pageSize < 1 ? 10 : Math.min(pageSize, 100);
        return new Page<>(pn, ps);
    }
}
```

---

## 4. 禁止事项

- ❌ 不使用统一响应结构 R
- ❌ 成功返回非 0 code
- ❌ 列表接口不使用 PageResult 分页
- ❌ PageResult 中暴露 Entity 类型（必须为 VO）
- ❌ traceId 为空
- ❌ 使用 `ok()` 而非 `success()`
