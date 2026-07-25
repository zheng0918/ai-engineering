# dto-vo — DTO/VO 生成技能

> 本技能根据 `rule.md` 约束生成 DTO、Query 与 VO。

---

## 触发条件

当用户要求"创建 DTO"、"生成 VO"、"定义请求/响应对象"、"创建 Query"时触发。

---

## Query 模板（继承 PageQuery）

```java
package com.example.model.query;

import com.example.model.base.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * {资源}分页查询入参。
 * 对应接口：{@code GET /api/v1/xxx}
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class XxxQuery extends PageQuery {

    /** 关键字模糊搜索，可空。 */
    private String keyword;
}
```

---

## DTO 模板

### CreateDTO

```java
package com.example.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * {资源}创建入参。
 * 对应接口：{@code POST /api/v1/xxx}
 */
@Data
public class XxxCreateDTO {

    @NotBlank(message = "{字段}不能为空")
    @Size(min = 2, max = 128, message = "{字段}2-128字符")
    @Schema(description = "名称")
    private String name;

    @Size(max = 500, message = "{字段}最多500字符")
    @Schema(description = "描述")
    private String description;
}
```

### UpdateDTO

```java
package com.example.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * {资源}更新入参。
 * 对应接口：{@code PUT /api/v1/xxx/{id}}
 *
 * <p>仅传需要更新的字段，null 字段不更新。
 */
@Data
public class XxxUpdateDTO {

    @Size(min = 2, max = 128, message = "{字段}2-128字符")
    @Schema(description = "名称")
    private String name;

    @Schema(description = "状态")
    private String status;
}
```

---

## VO 模板（含 Long→String + 时间注解 + @Schema）

```java
package com.example.model.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * {资源}列表项响应。
 */
@Data
public class XxxVO {

    /** {资源} ID（转 String 避免 JS 精度丢失）。 */
    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "{资源}ID")
    private Long id;

    @Schema(description = "名称")
    private String name;

    @Schema(description = "状态")
    private String status;

    /** 创建时间。 */
    @Schema(description = "创建时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;
}
```

---

## Converter 模板

```java
package com.example.converter;

import com.example.model.entity.Xxx;
import com.example.model.vo.XxxDetailVO;
import com.example.model.vo.XxxVO;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface XxxConverter {

    XxxVO toVO(Xxx entity);

    XxxDetailVO toDetailVO(Xxx entity);

    List<XxxVO> toVOList(List<Xxx> entities);
}
```

---

## 生成时注意事项

1. **Query 命名不要 DTO 后缀：`XxxQuery`，必须继承 `PageQuery`**
2. **DTO 命名加 DTO 后缀：`XxxCreateDTO`、`XxxUpdateDTO`**
3. **VO 所有 Long 类型 ID 必须加 `@JsonSerialize(using = ToStringSerializer.class)`**
4. **VO 所有 LocalDateTime 必须加 `@JsonFormat`**
5. **Query 放 `model/query/`，DTO 放 `model/dto/`，VO 放 `model/vo/`**
6. **MapStruct Converter 放 `converter/` 包**
7. **每个字段必须有 `/** ... */` 注释和 `@Schema(description = "...")` 注解**
