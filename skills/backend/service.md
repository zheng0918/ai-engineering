# service — 业务逻辑层生成技能

> 本技能根据 `rule.md` 约束生成 Service 接口与 ServiceImpl。

---

## Service 接口模板

```java
package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.common.result.PageResult;
import com.example.model.entity.Xxx;

public interface XxxService extends IService<Xxx> {

    /**
     * 分页查询{资源}列表。
     */
    PageResult<Xxx> page(String keyword, Long pageNum, Long pageSize);

    /**
     * 新增{资源}。
     */
    Xxx create(Xxx entity);

    /**
     * 更新指定{资源}。
     */
    Xxx update(Long id, Xxx update);

    /**
     * 逻辑删除指定{资源}。
     */
    void delete(Long id);
}
```

## ServiceImpl 完整模板

```java
package com.example.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BizException;
import com.example.common.exception.ErrorCode;
import com.example.common.result.PageResult;
import com.example.common.util.PageUtil;
import com.example.mapper.XxxMapper;
import com.example.model.entity.Xxx;
import com.example.service.XxxService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class XxxServiceImpl extends ServiceImpl<XxxMapper, Xxx> implements XxxService {

    /**
     * 使用 MyBatis-Plus 分页查询{资源}，支持关键字模糊搜索。
     */
    @Override
    public PageResult<Xxx> page(String keyword, Long pageNum, Long pageSize) {
        var wrapper = Wrappers.lambdaQuery(Xxx.class)
                .like(StringUtils.hasText(keyword), Xxx::getName, keyword)
                .orderByDesc(Xxx::getCreatedAt);
        Page<Xxx> page = page(PageUtil.of(pageNum, pageSize), wrapper);
        log.info("分页查询{资源}成功 keyword={} pageNum={} pageSize={} total={}",
                keyword, pageNum, pageSize, page.getTotal());
        return PageResult.from(page);
    }

    /**
     * 新增{资源}，校验名称非空。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Xxx create(Xxx entity) {
        if (!StringUtils.hasText(entity.getName())) {
            throw new BizException(ErrorCode.PARAM_INVALID, "名称不能为空");
        }
        save(entity);
        log.info("{资源}创建成功 id={} name={}", entity.getId(), entity.getName());
        return entity;
    }

    /**
     * 更新指定{资源}，先校验存在性再更新非空字段。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Xxx update(Long id, Xxx update) {
        Xxx entity = getById(id);
        if (entity == null) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        if (StringUtils.hasText(update.getName())) {
            entity.setName(update.getName());
        }
        updateById(entity);
        log.info("{资源}更新成功 id={}", id);
        return entity;
    }

    /**
     * 逻辑删除指定{资源}，先校验存在性。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Xxx entity = getById(id);
        if (entity == null) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        removeById(id);
        log.info("{资源}删除成功 id={}", id);
    }
}
```

## 带 Converter 的完整示例

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final UserConverter userConverter;

    @Override
    public UserDetailVO getDetail(Long id) {
        User user = getById(id);
        if (user == null) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        log.info("查询用户详情成功 userId={}", id);
        return userConverter.toDetailVO(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserVO createUser(UserCreateDTO dto) {
        if (getByUsername(dto.getUsername()) != null) {
            throw new BizException(ErrorCode.PARAM_INVALID, "用户名已存在");
        }
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPasswordHash(PasswordEncoderUtil.encode(dto.getPassword()));
        user.setRole(dto.getRole() != null ? dto.getRole() : "editor");
        user.setStatus("ACTIVE");

        save(user);
        log.info("用户创建成功 userId={} username={} role={}", user.getId(), user.getUsername(), user.getRole());

        user.setPasswordHash(null);
        return userConverter.toVO(user);
    }
}
```

---

## 生成时注意事项

1. **写操作必须加 `@Transactional(rollbackFor = Exception.class)`**
2. **业务异常必须用 `BizException` + `ErrorCode`，不在方法内 catch 后打 WARN**
3. **关键业务节点打 INFO 日志**（创建成功、更新成功、删除成功、查询成功含入参与结果摘要）
4. **接口返回前抹去敏感字段**
5. **Entity → VO 转换在 Service 层完成**
6. **每个方法必须写 Javadoc**，描述方法作用与关键实现细节
7. **分页使用 `PageUtil.of(pageNum, pageSize)`**
