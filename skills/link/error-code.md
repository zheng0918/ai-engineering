# error-code — 错误码映射生成技能

> 本技能生成后端 ErrorCode 枚举 + 前端/小程序错误码映射表。

---

## 触发条件

当需要"定义错误码"、"生成错误处理"、"对齐前后端错误提示"时触发。

---

## 生成清单

- 后端：`common/exception/ErrorCode.java`
- 前端：`constants/errorCodes.ts`
- 小程序：`constants/errorCodes.ts`

---

## 后端 ErrorCode 完整模板

```java
package com.example.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ==================== 系统级 1xxx ====================
    SUCCESS(0, "ok"),
    BAD_REQUEST(1001, "请求参数不合法"),
    UNAUTHORIZED(1002, "未登录或登录已失效"),
    FORBIDDEN(1003, "无操作权限"),
    NOT_FOUND(1004, "资源不存在"),
    INTERNAL_ERROR(1005, "服务器内部错误"),
    PARAM_VALIDATION_FAILED(1006, "参数校验失败"),
    METHOD_NOT_ALLOWED(1007, "不支持的请求方法"),
    RATE_LIMITED(1008, "请求过于频繁，请稍后重试"),

    // ==================== 用户/鉴权 11xx ====================
    USER_NOT_FOUND(1101, "用户不存在"),
    USERNAME_EXISTS(1102, "用户名已存在"),
    PASSWORD_INCORRECT(1103, "用户名或密码错误"),
    ACCOUNT_DISABLED(1104, "账号已被停用"),
    OLD_PASSWORD_INCORRECT(1105, "原密码错误"),
    PHONE_EXISTS(1106, "手机号已被绑定"),
    TOKEN_EXPIRED(2004, "登录已失效，请重新登录"),
    TOKEN_INVALID(2005, "无效的登录凭证"),

    // ==================== 文件 20xx ====================
    FILE_UPLOAD_FAILED(2001, "文件上传失败"),
    FILE_SIZE_EXCEED(2002, "文件大小超出限制"),
    FILE_TYPE_UNSUPPORTED(2003, "不支持的文件格式"),
    FILE_NOT_FOUND(2004, "文件不存在"),

    // ==================== 业务 — 按模块扩展 ====================
    ;

    private final int code;
    private final String message;
}
```

---

## 前端 ErrorCode 映射模板

```ts
// constants/errorCodes.ts

/** 错误码 → 用户提示文案（兜底映射） */
export const ErrorCodeMessage: Record<number, string> = {
  1001: '请求参数不合法',
  1002: '未登录或登录已失效',
  1003: '无操作权限',
  1004: '资源不存在',
  1005: '服务器繁忙，请稍后重试',
  1006: '请检查输入内容',
  1007: '不支持的请求方法',
  1008: '请求过于频繁，请稍后重试',

  1101: '用户不存在',
  1102: '用户名已存在',
  1103: '用户名或密码错误',
  1104: '账号已被停用，请联系管理员',
  1105: '原密码错误',
  1106: '手机号已被绑定',

  2004: '登录已失效，请重新登录',
  2005: '无效的登录凭证',

  2001: '文件上传失败，请重试',
  2002: '文件大小超出限制',
  2003: '不支持的文件格式',
  2004: '文件不存在',
};

/** 获取用户提示文案 */
export const getErrorMessage = (code: number, serverMessage?: string): string => {
  // 优先使用后端返回的精确消息
  if (serverMessage && serverMessage !== 'ok' && serverMessage.length > 0) {
    return serverMessage;
  }
  return ErrorCodeMessage[code] || `请求失败（错误码：${code}）`;
};

/** 需要跳转登录页的错误码 */
export const LOGOUT_CODES = [2004];
```

---

## 小程序错误码映射模板

```ts
// constants/errorCodes.ts — 与前端完全一致

/** 错误码 → 用户提示文案 */
export const ErrorCodeMessage: Record<number, string> = {
  1001: '请求参数不合法',
  1002: '未登录或登录已失效',
  // ... 与前端一致
};

/** 获取用户提示文案 */
export const getErrorMessage = (code: number, serverMessage?: string): string => {
  if (serverMessage && serverMessage !== 'ok' && serverMessage.length > 0) {
    return serverMessage;
  }
  return ErrorCodeMessage[code] || `请求失败（错误码：${code}）`;
};

/** 需要跳转登录页的错误码 */
export const LOGOUT_CODES = [2004];
```

---

## 生成时注意事项

1. **TOKEN_EXPIRED 必须固定为 2004**：前端硬编码检测此值，不能改
2. **ErrorCode message 必须面向用户**：不说"NullPointerException"，说"服务器繁忙"
3. **前端 getErrorMessage 优先用后端 message**：后端动态消息更精确
4. **兜底文案必须包含错误码**：方便用户截图后技术支持排查
5. **小程序映射表与前端完全一致**：可考虑抽取公共 constants 包
6. **新增错误码必须三端同步**：后端加一个 → 前端/小程序各加一个映射
