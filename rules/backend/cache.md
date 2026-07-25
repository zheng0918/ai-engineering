# cache — 缓存规范

> 本文件规定 Spring Cache 与 Redis 缓存的使用规范。

---

## 1. 缓存策略选型

| 场景 | 方案 | 说明 |
|---|---|---|
| 本地缓存（单机） | Caffeine / Guava Cache | 配置数据、字典数据 |
| 分布式缓存 | Redis + Spring Cache | 用户会话、频繁读的热点数据 |
| 二级缓存 | Caffeine(L1) + Redis(L2) | 高并发读、低容忍延迟 |

---

## 2. 缓存配置

### 2.1 Redis 配置

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}       # 生产环境通过环境变量覆盖，绝不能输出到日志
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 4
```

### 2.2 Spring Cache 配置

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .withCacheConfiguration("dictCache",
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofHours(1)))
                .withCacheConfiguration("userCache",
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)))
                .build();
    }
}
```

---

## 3. 缓存使用示例

### 3.1 注解方式

```java
@Slf4j
@Service
public class SysDictServiceImpl extends ServiceImpl<SysDictMapper, SysDict> implements SysDictService {

    /**
     * 查询字典列表（缓存 1 小时）。
     */
    @Override
    @Cacheable(value = "dictCache", key = "#dictType")
    public List<SysDict> listByType(String dictType) {
        return lambdaQuery().eq(SysDict::getDictType, dictType)
                .orderByAsc(SysDict::getSort)
                .list();
    }

    /**
     * 更新字典后清除缓存。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = "dictCache", key = "#dictType")
    public void updateDict(String dictType, SysDict dict) {
        updateById(dict);
    }
}
```

### 3.2 手动方式

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class CacheSupport {

    private final RedisTemplate<String, Object> redisTemplate;

    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    public <T> T get(String key, Class<T> type) {
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? type.cast(value) : null;
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }
}
```

---

## 4. 缓存 Key 命名规范

| 前缀 | 用途 | 示例 |
|---|---|---|
| `dict:` | 字典缓存 | `dict:project_type` |
| `user:` | 用户缓存 | `user:123` |
| `kb:` | 知识库 | `kb:detail:456` |
| `token:` | 会话令牌 | `token:blacklist` |

Key 格式：`{业务域}:{子域}:{唯一标识}`，使用冒号分隔实现 Redis key 层级。

---

## 5. 缓存失效策略

| 策略 | 适用场景 | 实现 |
|---|---|---|
| TTL 自动过期 | 字典、配置 | `entryTtl(Duration.ofHours(1))` |
| 写后删除（Cache-Aside） | 更新频繁的数据 | `@CacheEvict` / 手动 delete |
| 主动预热 | 启动时加载配置 | `@PostConstruct` + `@CachePut` |

---

## 6. 降级处理

```java
/**
 * 获取字典值，Redis 不可用时降级为查 DB。
 */
public String getDictValue(String dictType, String dictKey) {
    try {
        String cached = cacheSupport.get("dict:" + dictType + ":" + dictKey, String.class);
        if (cached != null) return cached;
    } catch (Exception e) {
        log.error("Redis 查询失败，降级查 DB dictType={}", dictType, e);
    }
    return queryFromDb(dictType, dictKey);
}
```

---

## 7. 禁止事项

- ❌ Redis password / secret 明文日志
- ❌ 缓存 Key 无命名规范（直接用业务 ID 裸字符串）
- ❌ 缓存永不过期
- ❌ 缓存不一致时无降级方案
- ❌ 大对象不设过期直接打入 Redis（可能导致内存溢出）
- ❌ 大量使用 KEYS 命令（生产禁用）
