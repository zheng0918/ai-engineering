# controller — 接口层生成技能

> 本技能根据 `rule.md` 约束生成 Controller。

---

## 触发条件

当用户要求"创建 Controller"、"生成 API 接口"、"写 REST 接口"时触发。

---

## 完整 Controller 模板

```java
package com.example.controller;

import com.example.common.result.R;
import com.example.common.result.PageResult;
import com.example.model.query.XxxQuery;
import com.example.model.dto.XxxCreateDTO;
import com.example.model.dto.XxxUpdateDTO;
import com.example.model.vo.XxxDetailVO;
import com.example.model.vo.XxxVO;
import com.example.service.XxxService;
import com.example.converter.XxxConverter;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * {资源中文名}管理接口。
 */
@RestController
@RequestMapping("/api/v1/xxx")
@RequiredArgsConstructor
@Tag(name = "{资源中文名}管理")
public class XxxController {

    private final XxxService xxxService;
    private final XxxConverter xxxConverter;

    /**
     * 分页查询{资源}列表。
     */
    @GetMapping
    @Operation(summary = "分页查询{资源}")
    public R<PageResult<XxxVO>> page(@Valid XxxQuery query) {
        Page<Xxx> page = xxxService.page(query.getKeyword(),
                query.getPageNum(), query.getPageSize());
        return R.success(PageResult.from(page, xxxConverter::toVO));
    }

    /**
     * 根据ID查询{资源}详情。
     */
    @GetMapping("/{id}")
    @Operation(summary = "查询{资源}详情")
    public R<XxxDetailVO> get(@PathVariable Long id) {
        return R.success(xxxService.getDetail(id));
    }

    /**
     * 新增{资源}。
     */
    @PostMapping
    @Operation(summary = "新增{资源}")
    public R<XxxVO> create(@Valid @RequestBody XxxCreateDTO dto) {
        return R.success(xxxService.create(dto));
    }

    /**
     * 根据ID更新{资源}。
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新{资源}")
    public R<XxxVO> update(@PathVariable Long id,
                           @Valid @RequestBody XxxUpdateDTO dto) {
        return R.success(xxxService.update(id, dto));
    }

    /**
     * 根据ID逻辑删除{资源}。
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除{资源}")
    public R<Void> delete(@PathVariable Long id) {
        xxxService.delete(id);
        return R.success();
    }
}
```

---

## 路由设计速查

| 操作 | 方法 | 路径 | 入参 | 返回 |
|---|---|---|---|---|
| 分页列表 | GET | `/api/v1/{resources}` | `@Valid XxxQuery` | `R<PageResult<XxxVO>>` |
| 详情 | GET | `/api/v1/{resources}/{id}` | `@PathVariable Long id` | `R<XxxDetailVO>` |
| 新增 | POST | `/api/v1/{resources}` | `@Valid @RequestBody XxxCreateDTO` | `R<XxxVO>` |
| 更新 | PUT | `/api/v1/{resources}/{id}` | `@Valid @RequestBody XxxUpdateDTO` | `R<XxxVO>` |
| 删除 | DELETE | `/api/v1/{resources}/{id}` | `@PathVariable Long id` | `R<Void>` |

---

## 生成时注意事项

1. **只注入 Service，禁止注入 Mapper**
2. **入参必须用 `@Valid` 触发校验**
3. **返回统一用 `R<T>` 包装，方法用 `R.success()`**
4. **不在方法体内手写日志（切面统一处理）**
5. **每个方法必须写 Javadoc**
