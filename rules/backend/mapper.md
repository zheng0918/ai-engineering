# mapper — 数据访问层规范

> 本文件规定 MyBatis-Plus Mapper 接口与 XML SQL 编写的强约束。

---

## 1. Mapper 接口规范

### 1.1 基本模板

```java
@Mapper
public interface XxxMapper extends BaseMapper<Xxx> {
    // 仅声明方法签名，不写任何 SQL 注解
    List<Xxx> selectByCondition(@Param("keyword") String keyword);
}
```

- 必须标注 `@Mapper`
- 必须继承 `BaseMapper<Entity>`
- 简单 CRUD 直接使用 `BaseMapper` 提供的方法，不允许重复造轮子
- **禁止在 Mapper 接口上使用 `@Select`、`@Update`、`@Insert`、`@Delete` 注解**
- **所有 SQL 必须在 `resources/mapper/XxxMapper.xml` 中定义**

---

## 2. Mapper XML 规范（强制）

### 2.1 文件位置

```
src/main/resources/mapper/XxxMapper.xml
```

### 2.2 基本 XML 模板

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">

    <!-- 通用查询结果映射 -->
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

    <!-- 按关键字模糊查询 -->
    <select id="selectByKeyword" resultMap="BaseResultMap">
        SELECT * FROM users
        WHERE deleted_at IS NULL
        <if test="keyword != null and keyword != ''">
            AND (username LIKE CONCAT('%', #{keyword}, '%')
                 OR real_name LIKE CONCAT('%', #{keyword}, '%'))
        </if>
        ORDER BY created_at DESC
    </select>

</mapper>
```

### 2.3 多表 join 查询 XML 示例

```xml
<!-- 关联查询：文档 + 知识库 -->
<resultMap id="DocWithKbResultMap" type="com.example.model.vo.DocumentWithKbVO">
    <id column="id" property="id"/>
    <result column="name" property="name"/>
    <result column="parse_status" property="parseStatus"/>
    <result column="kb_name" property="kbName"/>
</resultMap>

<select id="selectDocWithKb" resultMap="DocWithKbResultMap">
    SELECT
        d.id,
        d.name,
        d.parse_status,
        k.name AS kb_name
    FROM documents d
    LEFT JOIN knowledge_bases k ON d.kb_id = k.id AND k.deleted_at IS NULL
    WHERE d.deleted_at IS NULL
    <if test="kbId != null">
        AND d.kb_id = #{kbId}
    </if>
    ORDER BY d.created_at DESC
</select>
```

### 2.4 聚合/分组查询 XML 示例

```xml
<!-- 按状态统计文档数量 -->
<select id="countByStatus" resultType="com.example.model.vo.StatusCountVO">
    SELECT
        parse_status AS status,
        COUNT(*) AS count
    FROM documents
    WHERE kb_id = #{kbId}
      AND deleted_at IS NULL
    GROUP BY parse_status
</select>
```

### 2.5 批量插入 XML 示例

```xml
<insert id="batchInsert" parameterType="java.util.List">
    INSERT INTO users (username, password_hash, role, status, created_at, updated_at)
    VALUES
    <foreach collection="list" item="item" separator=",">
        (#{item.username}, #{item.passwordHash}, #{item.role},
         #{item.status}, now(), now())
    </foreach>
</insert>
```

### 2.6 更新 XML 示例

```xml
<update id="updateStatus">
    UPDATE users
    SET status = #{status}, updated_at = now()
    WHERE id = #{id} AND deleted_at IS NULL
</update>
```

---

## 3. Mapper 接口对应声明

```java
/**
 * 用户表数据访问层。
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 按关键字模糊查询用户列表。
     *
     * @param keyword 关键字（用户名或姓名）
     * @return 用户列表
     */
    List<User> selectByKeyword(@Param("keyword") String keyword);

    /**
     * 按知识库 ID 统计各状态文档数。
     *
     * @param kbId 知识库 ID
     * @return 各状态文档数量
     */
    List<StatusCountVO> countByStatus(@Param("kbId") Long kbId);

    /**
     * 批量插入用户。
     *
     * @param users 用户列表
     * @return 插入行数
     */
    int batchInsert(@Param("list") List<User> users);

    /**
     * 更新用户状态。
     *
     * @param id     用户 ID
     * @param status 新状态
     * @return 更新行数
     */
    int updateStatus(@Param("id") Long id, @Param("status") String status);
}
```

---

## 4. 查询与分页规则

### 4.1 分页必须

- **列表接口必须分页**，使用 MyBatis-Plus `Page<T>`
- 分页入参继承 `PageQuery`（`pageNum` 从 1 开始，`pageSize` 默认 10，最大 100）
- 复杂条件优先用 `LambdaQueryWrapper`（在 ServiceImpl 组装）

### 4.2 禁止全表查询

- `selectList(null)`、`list()` 不带 `Wrapper`、`find*All()` 无任何条件均禁止
- 例外：字典表/配置表等有限集合，需在方法注释中说明上限

---

## 5. SQL 方言约束

**所有 XML 中的 SQL 必须对 PostgreSQL 兼容，严禁使用 MySQL 专有语法。** 具体对照表参见 `database/rule.md` §7。

常用易错点：
- 聚合拼接用 `STRING_AGG(col, sep ORDER BY x)`，**禁止** `GROUP_CONCAT`
- 分页用 `LIMIT count OFFSET offset`，**禁止** `LIMIT offset, count`
- 空值处理用 `COALESCE`，**禁止** `IFNULL`
- 条件判断用 `CASE WHEN`，**禁止** `IF(cond, a, b)`

## 6. 禁止事项

- ❌ Mapper 接口使用 `@Select` / `@Update` / `@Insert` / `@Delete` 注解写 SQL
- ❌ SQL 写在 Mapper 接口而非 XML
- ❌ Mapper 不标注 `@Mapper`
- ❌ Mapper 不继承 `BaseMapper<Entity>`
- ❌ 在 Mapper 中加业务判断
- ❌ 无边界全表查询
- ❌ 使用 `Map<String, Object>` 当查询入参
- ❌ 退化为 `JdbcTemplate` 直拼 SQL
- ❌ XML 中使用 MySQL 专有函数/语法（`GROUP_CONCAT`、`SEPARATOR`、`IFNULL`、`LIMIT x,y` 等）
