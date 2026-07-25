# controller — 接口层规范

> 本文件规定 Controller 的编写约束与 HTTP API 设计规范。

---

## 1. Controller 基本模板

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "用户管理")
public class UserController {

    private final UserService userService;
    private final UserConverter userConverter;

    // 禁止注入 Mapper
}
```

- 必须使用 `@RestController`
- 必须使用 `@RequestMapping("/api/v1/{resource}")` 前缀
- 必须使用 `@RequiredArgsConstructor` + `private final` 构造器注入
- **只能注入 Service，禁止直接注入 Mapper**
- 推荐使用 `@Tag`（springdoc）标注分组

---

## 2. HTTP API 路径设计

| 操作 | HTTP 方法 | 路径 | 返回 |
|---|---|---|---|
| 分页列表 | GET | `/api/v1/users` | `R<PageResult<UserVO>>` |
| 详情 | GET | `/api/v1/users/{id}` | `R<UserDetailVO>` |
| 新增 | POST | `/api/v1/users` | `R<UserVO>` |
| 更新 | PUT | `/api/v1/users/{id}` | `R<UserVO>` |
| 删除 | DELETE | `/api/v1/users/{id}` | `R<Void>` |
| 批量操作 | POST | `/api/v1/users/batch` | `R<Void>` |

---

## 3. 完整 Controller 示例

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "用户管理")
public class UserController {

    private final UserService userService;
    private final UserConverter userConverter;

    @GetMapping
    @Operation(summary = "分页查询用户")
    public R<PageResult<UserVO>> page(@Valid UserQuery query) {
        Page<User> page = userService.page(query.getKeyword(),
                query.getPageNum(), query.getPageSize());
        return R.success(PageResult.from(page, userConverter::toVO));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询用户详情")
    public R<UserDetailVO> get(@PathVariable Long id) {
        return R.success(userService.getDetail(id));
    }

    @PostMapping
    @Operation(summary = "新增用户")
    public R<UserVO> create(@Valid @RequestBody UserCreateDTO dto) {
        return R.success(userService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新用户")
    public R<UserVO> update(@PathVariable Long id,
                            @Valid @RequestBody UserUpdateDTO dto) {
        return R.success(userService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除用户")
    public R<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return R.success();
    }
}
```

---

## 4. 入参与出参规范

### 4.1 入参

- 必须使用 DTO / Query，并使用 `@Valid` 触发校验
- 查询入参使用 `XxxQuery extends PageQuery`
- 路径参数用 `@PathVariable`，请求体用 `@RequestBody`

### 4.2 出参

- 必须使用 VO 包装在 `R<T>` 中
- 分页列表使用 `R<PageResult<VO>>`
- 不得返回 Entity

---

## 5. 方法注释规范（强制）

**每个 Controller 方法必须写 Javadoc**，描述接口的作用：

```java
/**
 * 分页查询用户列表。
 */
@Operation(summary = "分页查询用户")
@GetMapping
public R<PageResult<UserVO>> page(@Valid UserQuery query) {
```

Javadoc 与 `@Operation(summary)` **并存**：Javadoc 提供中文业务描述，`@Operation` 用于 Swagger 文档生成。

## 6. 禁止事项

- ❌ 注入 Mapper
- ❌ 包含业务逻辑
- ❌ 处理事务
- ❌ 使用 `HttpServletRequest` / `ResponseEntity`（除非文件下载）
- ❌ 方法体内手写日志（由切面统一处理）
- ❌ 返回 Entity 对象
- ❌ 返回敏感字段
- ❌ 方法缺少 Javadoc 注释
