# error-code — 错误码映射规范

> 本文件规定后端业务错误码的定义规范，以及前端/小程序的错误码映射与处理约束。

---

## 1. 错误码分段规范

| 范围 | 模块 | 说明 |
|---|---|---|
| 0 | 通用 | 成功 |
| 1001–1099 | 系统 | 参数校验、服务器内部错误 |
| 1101–1199 | 用户 | 登录、注册、权限 |
| 2001–2099 | 文件 | 上传、下载、格式 |
| 3001–3099 | 业务 A | 按模块分配 |
| 4001–4099 | 业务 B | 按模块分配 |
| 9001–9099 | 第三方 | 外部服务调用失败 |

---

## 2. 后端 ErrorCode 枚举（必须）

```java
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // 系统 1xxx
    BAD_REQUEST(1001, "请求参数不合法"),
    UNAUTHORIZED(1002, "未登录或登录已失效"),
    FORBIDDEN(1003, "无操作权限"),
    NOT_FOUND(1004, "资源不存在"),
    INTERNAL_ERROR(1005, "服务器内部错误"),
    PARAM_VALIDATION_FAILED(1006, "参数校验失败"),

    // 用户 11xx
    USER_NOT_FOUND(1101, "用户不存在"),
    USERNAME_EXISTS(1102, "用户名已存在"),
    PASSWORD_INCORRECT(1103, "用户名或密码错误"),
    ACCOUNT_DISABLED(1104, "账号已被停用"),
    TOKEN_EXPIRED(2004, "登录已失效，请重新登录"),
    TOKEN_INVALID(2005, "无效的登录凭证"),

    // 文件 20xx
    FILE_UPLOAD_FAILED(2001, "文件上传失败"),
    FILE_SIZE_EXCEED(2002, "文件大小超出限制"),
    FILE_TYPE_UNSUPPORTED(2003, "不支持的文件格式"),
    ;

    private final int code;
    private final String message;
}
```

**规则：**
- 错误码全局唯一，不可重复
- `message` 为面向用户的提示文案（中文）
- 按模块分段，预留扩展空间
- `TOKEN_EXPIRED` 固定用 2004（前端拦截器硬编码检测）

---

## 3. 前端错误码映射（必须）

```ts
// constants/errorCodes.ts
export const ErrorCodeMessage: Record<number, string> = {
  // 系统
  1001: '请求参数不合法',
  1002: '未登录或登录已失效',
  1003: '无操作权限',
  1004: '资源不存在',
  1005: '服务器繁忙，请稍后重试',
  1006: '请检查输入内容',

  // 用户
  1101: '用户不存在',
  1102: '用户名已存在',
  1103: '用户名或密码错误',
  1104: '账号已被停用，请联系管理员',
  2004: '登录已失效，请重新登录',
  2005: '无效的登录凭证',

  // 文件
  2001: '文件上传失败，请重试',
  2002: '文件大小超出限制',
  2003: '不支持的文件格式',
};

/** 获取错误提示文案，优先用后端返回的 message，否则用本地映射 */
export const getErrorMessage = (code: number, serverMessage?: string): string => {
  if (serverMessage && serverMessage !== 'ok') return serverMessage;
  return ErrorCodeMessage[code] || `请求失败（错误码：${code}）`;
};
```

**规则：**
- `ErrorCodeMessage` 必须覆盖后端所有 ErrorCode
- `getErrorMessage` 优先使用后端 message（后端文案更精确）
- 未知错误码给出兜底提示（含错误码数字方便排查）

---

## 4. 前端 Axios 拦截器错误处理

```ts
// api/request.ts 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<R<any>>) => {
    const { code, message } = response.data;
    if (code === 0) return response.data;

    // token 过期 — 硬编码检测 2004
    if (code === 2004) {
      ElMessage.error('登录已失效，请重新登录');
      useUserStore().logout();
      router.push('/login');
      return Promise.reject(new Error(message));
    }

    // 其他业务错误 — 用 getErrorMessage 统一获取文案
    ElMessage.error(getErrorMessage(code, message));
    return Promise.reject(new Error(message || `请求失败 (${code})`));
  },
  // ...
);
```

---

## 5. 小程序错误处理

```ts
// api/request.ts success 回调
success: (res) => {
  const { code, message, data } = res.data as R<T>;
  if (code === 0) {
    resolve(data);
  } else if (code === 2004) {
    useUserStore().logout();
    uni.reLaunch({ url: '/pages/login/index' });
    reject(new Error('登录已失效'));
  } else {
    // 优先使用后端 message，其次本地映射
    const msg = message || ErrorCodeMessage[code] || `请求失败 (${code})`;
    uni.showToast({ title: msg, icon: 'none' });
    reject(new Error(msg));
  }
},
```

---

## 6. 后端异常抛出规范

```java
// Service 层
throw new BizException(ErrorCode.USERNAME_EXISTS);

// 带动态消息
throw new BizException(ErrorCode.PARAM_VALIDATION_FAILED, "密码长度不能少于 6 位");

// BizException 定义
public class BizException extends RuntimeException {
    private final int code;
    private final String message;

    public BizException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
        this.message = errorCode.getMessage();
    }

    public BizException(ErrorCode errorCode, String detail) {
        super(detail);
        this.code = errorCode.getCode();
        this.message = detail;
    }
}
```

---

## 7. 错误码同步 Checklist

- [ ] 后端 ErrorCode 完整定义（每个业务异常的 code + message）
- [ ] 前端 `ErrorCodeMessage` 覆盖所有 code
- [ ] 小程序 `ErrorCodeMessage` 与前端一致
- [ ] TOKEN_EXPIRED = 2004 三端一致
- [ ] Axios 拦截器正确分发错误码（2004 跳登录 / 其他 toast）
- [ ] 小程序 `uni.request` 封装正确处理 2004
- [ ] `getErrorMessage` 兜底逻辑（未知 code 也给出提示）

---

## 8. 禁止事项

- ❌ 错误码数字重复
- ❌ 前端/小程序拦截器缺少 2004 处理
- ❌ 错误提示显示技术信息（stack trace、SQL 错误）
- ❌ 后端不抛 BizException，直接在 Controller try-catch
- ❌ 新增错误码不同步到前端/小程序映射表
- ❌ 敏感信息出现在错误 message 中（密码、token、手机号）
