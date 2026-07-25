# service — 业务逻辑层规范

> 本文件规定 Service 接口与 ServiceImpl 实现的强约束。

---

## 1. Service 接口规范

```java
public interface XxxService extends IService<Xxx> {
    // 声明业务能力
}
```

- 必须继承 `IService<Entity>`
- 只声明业务能力，不得包含实现

---

## 2. ServiceImpl 实现规范

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class XxxServiceImpl
    extends ServiceImpl<XxxMapper, Xxx>
    implements XxxService {

    private final XxxConverter xxxConverter;
    // 如需调用其他 Service，继续注入
}
```

- 必须标注 `@Service`
- 必须继承 `ServiceImpl<XxxMapper, Xxx>`
- 必须实现对应的 `XxxService` 接口
- 统一用 Lombok `@Slf4j` 声明日志

---

## 3. 写操作与事务

| 操作 | 要求 |
|---|---|
| 新增（Create） | `@Transactional(rollbackFor = Exception.class)` |
| 更新（Update） | 先校验存在性 + 权限；`@Transactional(rollbackFor = Exception.class)` |
| 删除（Delete） | 优先逻辑删除；物理删除需用户确认 |
| 批量写 | `saveBatch` / `updateBatchById`；`@Transactional(rollbackFor = Exception.class)` |
| 多表写 | 同一 `@Transactional` 边界 |

### 完整写操作示例

```java
@Override
@Transactional(rollbackFor = Exception.class)
public UserVO createUser(UserCreateDTO dto) {
    // 1. 业务校验
    if (getByUsername(dto.getUsername()) != null) {
        throw new BizException(ErrorCode.PARAM_INVALID, "用户名已存在");
    }

    // 2. 构建实体
    User user = new User();
    user.setUsername(dto.getUsername());
    user.setPasswordHash(PasswordEncoderUtil.encode(dto.getPassword()));
    user.setRole(dto.getRole() != null ? dto.getRole() : "editor");

    // 3. 持久化
    save(user);
    log.info("用户创建成功 userId={} username={}", user.getId(), user.getUsername());

    // 4. 返回 VO（不含密码）
    user.setPasswordHash(null);
    return userConverter.toVO(user);
}
```

---

## 4. 业务异常规范

- 业务异常使用 `BizException` + `ErrorCode`
- 禁止直接抛 `RuntimeException`
- Service 内校验失败直接抛 `BizException`，由 `GlobalExceptionHandler` 统一捕获

---

## 5. Entity → VO 转换

- 在 Service 层完成，不在 Controller 完成
- 使用 MapStruct Converter

---

## 6. 方法注释规范（强制）

**每个方法必须写 Javadoc**，描述方法的核心作用和关键业务逻辑：

```java
/**
 * 分页查询用户列表，支持关键字模糊搜索。
 */
PageResult<UserVO> page(String keyword, Long pageNum, Long pageSize);

/**
 * 新增用户，校验用户名唯一性并加密密码。
 */
@Transactional(rollbackFor = Exception.class)
UserVO create(UserCreateDTO dto);
```

- 接口方法：描述业务能力，说明入参/出参含义
- 实现方法：额外注明使用的技术手段（如"使用 MyBatis-Plus lambdaQuery"）、事务边界、关键校验逻辑

## 7. 禁止事项

- ❌ Service 接口不继承 `IService<Entity>`
- ❌ ServiceImpl 不继承 `ServiceImpl<Mapper, Entity>`
- ❌ 写操作无 `@Transactional(rollbackFor = Exception.class)`
- ❌ 直接抛 `RuntimeException`
- ❌ Service 中处理 HTTP 细节
- ❌ catch 块吞异常
- ❌ 循环内逐条打 INFO 日志
- ❌ 接口返回前不抹去敏感字段
- ❌ 方法缺少 Javadoc 注释
- ❌ 方法名与 `IService` 内置方法冲突（如 `list()`、`getById()` 等），如有冲突必须重命名
