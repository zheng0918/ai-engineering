# feign — 远程调用规范

> 本文件规定 Spring WebClient（HTTP 远程调用）的配置与使用规范。

---

## 1. 技术选型

本项目使用 **Spring WebClient**（WebFlux 提供）做远程 HTTP 调用，不使用 OpenFeign。

适用范围：
- 透传 SSE 流式响应（AI 问答）
- 调用 Python AI 服务（REST/SSE）
- 调用第三方 API

---

## 2. WebClient 配置

```java
/**
 * WebClient 配置，统一 Timeout/连接池/拦截器。
 */
@Configuration
public class WebClientConfig {

    /**
     * 通用 WebClient Bean，20s 连接超时 + 300s 读取超时（适配 SSE 长连接）。
     */
    @Bean
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 20_000)
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(300, TimeUnit.SECONDS)));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
```

---

## 3. 远程调用 Client 封装

```java
/**
 * AI 服务代理客户端，封装与 Python AI 服务的 HTTP 交互。
 *
 * <p>失败/errcode 非 0/重试/降级必打 ERROR（含 errcode/errmsg，异常对象作为最后一个参数）。
 * 禁止打印密钥/完整凭证。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiProxyClient {

    private final WebClient webClient;
    private final AiServiceProperties aiProps;

    /**
     * 向 Python AI 服务发起 SSE 透传请求。
     *
     * @param requestBody JSON 请求体
     * @return SSE 流
     */
    public Flux<ServerSentEvent<String>> streamChat(String requestBody) {
        return webClient.post()
                .uri(aiProps.getChatUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
                .doOnError(e -> log.error("调用 AI 聊天服务失败 url={}", aiProps.getChatUrl(), e));
    }

    /**
     * 向 Python AI 服务发起同步 REST 请求。
     *
     * @param path       接口路径
     * @param requestBody JSON 请求体
     * @return JSON 响应字符串
     */
    public String post(String path, Object requestBody) {
        try {
            return webClient.post()
                    .uri(aiProps.getBaseUrl() + path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
                    .block();
        } catch (Exception e) {
            log.error("调用 AI 服务失败 path={}", path, e);
            throw new BizException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }
}
```

---

## 4. Properties 配置

```java
@Data
@ConfigurationProperties(prefix = "app.ai-service")
@Configuration
public class AiServiceProperties {
    /** Python AI 服务基地址（绝不能输出到日志）。 */
    private String baseUrl;
    /** SSE 聊天接口完整 URL。 */
    private String chatUrl;
    /** 内部通信 token（绝不能输出到日志或响应体）。 */
    private String internalToken;
}
```

```yaml
# application.yml
app:
  ai-service:
    base-url: http://localhost:9000       # Python AI 服务地址（生产环境通过环境变量覆盖）
    chat-url: http://localhost:9000/api/v1/chat/stream
    internal-token: ${AI_INTERNAL_TOKEN:}  # 内部通信 token，绝不能输出到日志
```

---

## 5. 异常处理

```java
// 全局异常处理器补充 WebClient 异常处理
@ExceptionHandler(WebClientResponseException.class)
public ApiResponse<Void> handleWebClient(WebClientResponseException e) {
    log.error("调用 AI 服务失败 status={} body={}", e.getStatusCode(),
            e.getResponseBodyAsString(), e);
    return ApiResponse.fail(ErrorCode.AI_SERVICE_UNAVAILABLE.getCode(),
            ErrorCode.AI_SERVICE_UNAVAILABLE.getMessage());
}
```

---

## 6. 调用失败处理原则

| 场景 | 处理方式 |
|---|---|
| 连接超时 | log.error + 抛 BizException(AI_SERVICE_UNAVAILABLE) |
| 读取超时 | log.error + 抛 BizException(AI_SERVICE_UNAVAILABLE) |
| 非 2xx 响应 | log.error(含 status + body) + 抛 BizException |
| 不可恢复故障 | 快速失败，不重复重试 |
| 降级 | log.error("降级") + 返回兜底数据 |

---

## 7. 禁止事项

- ❌ 打印密钥 / token / 完整 URL 含凭证
- ❌ 吞掉调用失败异常
- ❌ 在业务代码里直接 new WebClient（必须注入 Bean）
- ❌ 用 RestTemplate（统一用 WebClient）
- ❌ 远程调用不加超时
