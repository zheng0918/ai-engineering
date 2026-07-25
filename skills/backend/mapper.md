# mapper — 数据访问层生成技能

> 本技能根据 `rule.md` 约束生成 Mapper 接口与对应 XML。

---

## 触发条件

当用户要求"创建 Mapper"、"写数据访问层"、"新增 SQL 查询"时触发。

---

## Mapper 接口模板（无 SQL 注解）

```java
package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.model.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户表数据访问层。
 *
 * <p>基础 CRUD 由 {@link BaseMapper} 提供；
 * 自定义 SQL 全量定义在 {@code resources/mapper/UserMapper.xml}。
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 按关键字模糊查询用户列表。
     *
     * @param keyword 关键字（用户名或姓名），可空
     * @return 用户列表
     */
    List<User> selectByKeyword(@Param("keyword") String keyword);

    /**
     * 批量插入用户。
     *
     * @param users 用户列表
     * @return 插入行数
     */
    int batchInsert(@Param("list") List<User> users);

    /**
     * 按 ID 更新用户状态。
     *
     * @param id     用户 ID
     * @param status 新状态
     * @return 更新行数
     */
    int updateStatus(@Param("id") Long id, @Param("status") String status);
}
```

---

## 对应 XML 模板

### resources/mapper/UserMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">

    <resultMap id="BaseResultMap" type="com.example.model.entity.User">
        <id column="id" property="id"/>
        <result column="username" property="username"/>
        <result column="password_hash" property="passwordHash"/>
        <result column="real_name" property="realName"/>
        <result column="role" property="role"/>
        <result column="status" property="status"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <!-- 按关键字模糊查询用户 -->
    <select id="selectByKeyword" resultMap="BaseResultMap">
        SELECT * FROM users
        WHERE deleted_at IS NULL
        <if test="keyword != null and keyword != ''">
            AND (username LIKE CONCAT('%', #{keyword}, '%')
                 OR real_name LIKE CONCAT('%', #{keyword}, '%'))
        </if>
        ORDER BY created_at DESC
    </select>

    <!-- 批量插入 -->
    <insert id="batchInsert">
        INSERT INTO users (username, password_hash, role, status, created_at, updated_at)
        VALUES
        <foreach collection="list" item="item" separator=",">
            (#{item.username}, #{item.passwordHash}, #{item.role},
             #{item.status}, now(), now())
        </foreach>
    </insert>

    <!-- 更新状态 -->
    <update id="updateStatus">
        UPDATE users SET status = #{status}, updated_at = now()
        WHERE id = #{id} AND deleted_at IS NULL
    </update>

</mapper>
```

---

## 连表查询 XML 完整示例

```xml
<!-- ===== 关联查询：文档 + 知识库 ===== -->
<resultMap id="DocWithKbResultMap" type="com.example.model.vo.DocumentWithKbVO">
    <id column="id" property="id"/>
    <result column="name" property="name"/>
    <result column="parse_status" property="parseStatus"/>
    <result column="kb_name" property="kbName"/>
    <result column="size_bytes" property="sizeBytes"/>
</resultMap>

<select id="selectDocWithKb" resultMap="DocWithKbResultMap">
    SELECT
        d.id,
        d.name,
        d.parse_status,
        d.size_bytes,
        k.name AS kb_name
    FROM documents d
    LEFT JOIN knowledge_bases k ON d.kb_id = k.id AND k.deleted_at IS NULL
    WHERE d.deleted_at IS NULL
    <if test="kbId != null">
        AND d.kb_id = #{kbId}
    </if>
    <if test="status != null and status != ''">
        AND d.parse_status = #{status}
    </if>
    ORDER BY d.created_at DESC
</select>
```

---

## Service 层条件构造示例

```java
// 条件查询：按用户名模糊 + 状态精确 + 时间范围 + 分页
LambdaQueryWrapper<User> wrapper = Wrappers.lambdaQuery(User.class)
        .like(StringUtils.hasText(query.getKeyword()), User::getUsername, query.getKeyword())
        .eq(StringUtils.hasText(query.getStatus()), User::getStatus, query.getStatus())
        .orderByDesc(User::getCreatedAt);
Page<User> page = page(PageUtil.of(query.getPageNum(), query.getPageSize()), wrapper);
```

---

## 生成时注意事项

1. **Mapper 接口只声明方法签名，不写任何 SQL 注解**
2. **所有 SQL 定义在 `resources/mapper/XxxMapper.xml`**
3. `resultMap` 用于复杂映射，简单字段可用 `resultType`
4. 动态 SQL 使用 `<if>`、`<foreach>` 等 MyBatis 标签
5. 所有查询必须带 `deleted_at IS NULL` 条件
6. **分页查询优先用 MyBatis-Plus 的 `LambdaQueryWrapper` + `Page<T>`（在 ServiceImpl 中组装）**
7. **只有 LambdaQueryWrapper 无法表达的查询（多表 join/聚合/分组）才在 XML 中写 SQL**
8. **所有 SQL 必须兼容 PostgreSQL，严禁 MySQL 专有语法**（`GROUP_CONCAT` → `STRING_AGG`，`IFNULL` → `COALESCE`，`LIMIT x,y` → `LIMIT y OFFSET x` 等），完整对照表见 `database/rule.md` §7
