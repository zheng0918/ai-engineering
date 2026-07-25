/**
 * Backend compliance rules — aligned with backend rule files
 * Covers: project-structure, entity-design, mapper, controller, service,
 *         exception, logging, security, dto-vo, result, config, database
 */

function rx(pattern, flags) { return new RegExp(pattern, flags || ''); }

export default [
  // ═══ project-structure/rule.md + entity-design/rule.md ═══
  {
    id: 'BE-01',
    category: 'project-structure',
    severity: 'BLOCKER',
    title: 'JPA/Hibernate APIs are forbidden (must use MyBatis-Plus)',
    fileExtensions: ['.java', '.xml', '.gradle'],
    check(ctx) {
      const hits = [];
      const jpaPatterns = [
        'jakarta.persistence', 'javax.persistence',
        'JpaRepository', 'CrudRepository', 'EntityManager',
        'spring-boot-starter-data-jpa', 'hibernate-core', 'org.hibernate',
        '@Entity', '@OneToMany', '@ManyToOne', '@ManyToMany', '@OneToOne',
        '@JoinColumn', '@MappedSuperclass', '@GeneratedValue',
      ];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          for (const pat of jpaPatterns) {
            if (line.includes(pat) && !line.includes('//') && !line.includes('*')) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
              break;
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace JPA with MyBatis-Plus: BaseMapper, IService, ServiceImpl',
  },

  // ═══ mapper/rule.md ═══
  {
    id: 'BE-02',
    category: 'mapper',
    severity: 'BLOCKER',
    title: '@Select/@Update/@Insert/@Delete annotations on Mapper are forbidden',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('mapper') && !f.includes('Mapper')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('@(Select|Update|Insert|Delete)\\b').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Move SQL to XML mapper files under resources/mapper/',
  },

  // ═══ logging/rule.md ═══
  {
    id: 'BE-03',
    category: 'logging',
    severity: 'BLOCKER',
    title: 'System.out.println / printStackTrace / log.warn / log.debug are forbidden',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('System\\.(out|err)\\.print').test(line)
            || rx('printStackTrace\\(\\)').test(line)
            || rx('log\\.(warn|debug|trace)\\s*\\(').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Only use log.info() and log.error(). Remove all debug/warn/trace/println.',
  },

  // ═══ logging/rule.md: sensitive data in logs ═══
  {
    id: 'BE-04',
    category: 'logging',
    severity: 'BLOCKER',
    title: 'Sensitive data must not appear in log statements',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      const sensitive = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'salt', 'openid', 'unionid'];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (!rx('log\\.(info|error)\\s*\\(').test(line)) return;
          for (const s of sensitive) {
            if (line.toLowerCase().includes(s.toLowerCase())) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
              break;
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Remove sensitive fields from log output; log only sanitized identifiers',
  },

  // ═══ exception/rule.md ═══
  {
    id: 'BE-05',
    category: 'exception',
    severity: 'BLOCKER',
    title: 'throw new RuntimeException() is forbidden (use BizException)',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (f.includes('BizException') || f.includes('ErrorCode')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('throw\\s+new\\s+RuntimeException\\s*\\(').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace RuntimeException with BizException + ErrorCode enum',
  },

  // ═══ exception/rule.md: swallowed exceptions ═══
  {
    id: 'BE-06',
    category: 'exception',
    severity: 'BLOCKER',
    title: 'Empty catch blocks or catch without logging are forbidden',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (!rx('catch\\s*\\(.*Exception').test(lines[i])) continue;
          // Check next 3 lines for log.error or throw
          let hasHandling = false;
          for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            if (rx('log\\.(error|info)\\s*\\(').test(lines[j]) || rx('throw\\s+').test(lines[j])) {
              hasHandling = true;
              break;
            }
            if (lines[j].trim() === '}') break;
          }
          if (!hasHandling) {
            hits.push({ file: f, line: i + 1, snippet: lines[i].trim() + ' (no error logging)' });
          }
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Always log the exception: log.error("context", e); then re-throw or handle',
  },

  // ═══ controller/rule.md: Mapper injected into Controller ═══
  {
    id: 'BE-07',
    category: 'controller',
    severity: 'BLOCKER',
    title: 'Controller must not inject Mapper directly',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('Controller')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('private\\s+final\\s+\\w*Mapper\\s+').test(line) || rx('Mapper\\s+\\w+Mapper').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Controller should only inject Service, never Mapper',
  },

  // ═══ dto-vo/rule.md: sensitive fields in VO ═══
  {
    id: 'BE-08',
    category: 'dto-vo',
    severity: 'BLOCKER',
    title: 'VO must not expose sensitive fields (password/token/secret/salt/deletedAt)',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      const sensitive = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'secret', 'apiSecret', 'clientSecret', 'salt', 'deletedAt'];
      for (const f of ctx.files) {
        if (!f.includes('VO') && !f.includes('Vo')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          for (const s of sensitive) {
            if (rx('\\b' + s + '\\b').test(line) && rx('private\\s+').test(line)) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
              break;
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Remove sensitive fields from VO classes',
  },

  // ═══ dto-vo/rule.md: Long ID without @JsonSerialize ═══
  {
    id: 'BE-09',
    category: 'dto-vo',
    severity: 'BLOCKER',
    title: 'Long ID in VO must have @JsonSerialize(using = ToStringSerializer.class)',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('VO') && !f.includes('Vo')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          // Check if this is a Long field named id
          if (!rx('\\bLong\\s+\\w*[iI]d\\b').test(lines[i])) continue;
          // Check if @JsonSerialize is on a nearby line (within 2 lines above)
          let hasAnnotation = false;
          for (let j = Math.max(0, i - 2); j < i; j++) {
            if (lines[j].includes('JsonSerialize') || lines[j].includes('ToStringSerializer')) {
              hasAnnotation = true;
              break;
            }
          }
          if (!hasAnnotation) {
            hits.push({ file: f, line: i + 1, snippet: lines[i].trim() });
          }
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Add @JsonSerialize(using = ToStringSerializer.class) to Long id fields in VO',
  },

  // ═══ dto-vo/rule.md: LocalDateTime without @JsonFormat ═══
  {
    id: 'BE-10',
    category: 'dto-vo',
    severity: 'BLOCKER',
    title: 'LocalDateTime/LocalDate in VO must have @JsonFormat',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('VO') && !f.includes('Vo')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (!rx('\\bLocalDate(Time)?\\s+').test(lines[i])) continue;
          let hasAnnotation = false;
          for (let j = Math.max(0, i - 2); j < i; j++) {
            if (lines[j].includes('JsonFormat')) {
              hasAnnotation = true;
              break;
            }
          }
          if (!hasAnnotation) {
            hits.push({ file: f, line: i + 1, snippet: lines[i].trim() });
          }
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Add @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") to LocalDateTime fields',
  },

  // ═══ service/rule.md: write ops without @Transactional ═══
  {
    id: 'BE-11',
    category: 'service',
    severity: 'BLOCKER',
    title: 'Write operations must have @Transactional(rollbackFor = Exception.class)',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('ServiceImpl')) continue;
        const content = ctx.read(f);
        // Check each method in ServiceImpl
        const methodMatches = content.match(/public\s+\w+\s+(\w+)\s*\(/g) || [];
        // This is a rough check — flag ServiceImpl files that modify data but lack @Transactional
        const hasCreate = rx('create|insert|save|add|update|modify|delete|remove').test(content);
        const hasTransactional = rx('@Transactional').test(content);
        if (hasCreate && !hasTransactional) {
          hits.push({ file: f, line: 1, snippet: 'ServiceImpl with write methods but no @Transactional found' });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Add @Transactional(rollbackFor = Exception.class) to all write methods',
  },

  // ═══ result/rule.md ═══
  {
    id: 'BE-12',
    category: 'result',
    severity: 'BLOCKER',
    title: 'Controller must return R<T> wrapper (not raw Entity or Map)',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('Controller')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          // Check for @Mapping methods that don't return R<...>
          if (rx('@(Get|Post|Put|Delete|Patch)Mapping').test(line) || rx('public\\s+').test(line)) {
            // Skip if next lines include R<...> return type
          }
        });
        // Broader check: any public method in Controller that returns non-R type
        const publicMethods = [...content.matchAll(/public\s+(?!R<)\w+\s+\w+\s*\(/g)];
        for (const m of publicMethods) {
          const lineNum = content.substring(0, m.index).split('\n').length;
          if (!m[0].includes('R<') && !m[0].includes('ResponseEntity') && !m[0].includes('void')) {
            hits.push({ file: f, line: lineNum, snippet: m[0].trim() });
          }
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'All Controller endpoints must return R<T> or R<PageResult<VO>>',
  },

  // ═══ security/rule.md ═══
  {
    id: 'BE-13',
    category: 'security',
    severity: 'BLOCKER',
    title: 'Spring Security imports are forbidden (use lightweight JWT filter)',
    fileExtensions: ['.java', '.xml', '.gradle'],
    check(ctx) {
      const hits = [];
      const patterns = ['spring-boot-starter-security', '@EnableWebSecurity', 'SecurityFilterChain', 'org.springframework.security'];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          for (const pat of patterns) {
            if (line.includes(pat)) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
              break;
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use JwtAuthFilter + @RequireRole annotation instead of Spring Security',
  },

  // ═══ deployment/rule.md: hardcoded secrets ═══
  {
    id: 'BE-14',
    category: 'deployment',
    severity: 'BLOCKER',
    title: 'No hardcoded secrets in application.yml or Dockerfile',
    fileExtensions: ['.yml', '.yaml', '.properties'],
    check(ctx) {
      const hits = [];
      const secretKeys = ['JWT_SECRET', 'DB_PASSWORD', 'REDIS_PASSWORD', 'MINIO_SECRET'];
      for (const f of ctx.files) {
        if (f.includes('application.yml') || f.includes('application.properties') || f.includes('Dockerfile')) {
          const content = ctx.read(f);
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            for (const key of secretKeys) {
              if (line.includes(key) && !line.includes('${') && !line.includes('$(')) {
                // Value is hardcoded, not from env
                const afterColon = line.split(':')[1] || '';
                if (afterColon.trim() && afterColon.trim() !== '') {
                  hits.push({ file: f, line: i + 1, snippet: line.trim() });
                  break;
                }
              }
            }
          });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use environment variable references: ${JWT_SECRET} instead of literal values',
  },

  // ═══ controller/rule.md: @Autowired in Controller ═══
  {
    id: 'BE-15',
    category: 'controller',
    severity: 'ERROR',
    title: '@Autowired is forbidden in Controller (use constructor injection)',
    fileExtensions: ['.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('Controller')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('@Autowired')) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use @RequiredArgsConstructor + private final injection instead of @Autowired',
  },
];
