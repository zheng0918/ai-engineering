/**
 * Link (cross-end) compliance rules — aligned with link rule files
 * Covers: api-contract, pagination, data-format, error-code,
 *         auth-flow, type-sync, state-mapping, file-upload
 *
 * Link rules are designed to run on ANY project type and check for
 * cross-end consistency patterns.
 */

function rx(pattern, flags) { return new RegExp(pattern, flags || ''); }

export default [
  // ═══ pagination/rule.md: field name consistency ═══
  {
    id: 'LINK-01',
    category: 'pagination',
    severity: 'BLOCKER',
    title: 'Pagination fields must be pageNum/pageSize (not page/size or offset/limit)',
    fileExtensions: ['.ts', '.vue', '.java'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          // Check for wrong pagination field names
          if (rx('\\bpage\\s*[=:]\\s*').test(line) && !rx('pageNum|pageSize|page_size|page_num').test(line)
            && rx('query|params|state|props').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
          if (rx('offset|limit').test(line) && rx('query|params|api|request').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() + ' (use pageNum/pageSize instead of offset/limit)' });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use pageNum/pageSize consistently across all three ends',
  },

  // ═══ data-format/rule.md: ID type consistency ═══
  {
    id: 'LINK-02',
    category: 'data-format',
    severity: 'BLOCKER',
    title: 'ID must be string in TypeScript (not number)',
    fileExtensions: ['.ts'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.ts$').test(f)) continue;
        if (f.includes('node_modules')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          // Match interface/type definitions with id: number
          if (rx('\\bid\\s*[?:]\\s*number\\b').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Change id: number to id: string (backend Long -> frontend string)',
  },

  // ═══ data-format/rule.md: date type consistency ═══
  {
    id: 'LINK-03',
    category: 'data-format',
    severity: 'ERROR',
    title: 'Dates must be string in TypeScript (not Date)',
    fileExtensions: ['.ts'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.ts$').test(f)) continue;
        if (f.includes('node_modules')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx(':\\s*Date\\b').test(line) && rx('interface|type').test(content)) {
            // Only flag in type definitions (interfaces/types)
            const lineContent = content.substring(0, content.indexOf(line) + line.length);
            const hasInterfaceNearby = rx('interface|type\\s+\\w+').test(lineContent.split('\n').slice(-5).join('\n'));
            if (hasInterfaceNearby || f.includes('types/') || f.includes('models')) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Change Date to string for API response types (backend sends ISO 8601 strings)',
  },

  // ═══ auth-flow/rule.md: token key consistency ═══
  {
    id: 'LINK-04',
    category: 'auth-flow',
    severity: 'BLOCKER',
    title: 'Token storage key must be "token" (not accessToken/jwt/authToken)',
    fileExtensions: ['.ts', '.vue', '.js'],
    check(ctx) {
      const hits = [];
      const badKeys = ['accessToken', 'access_token', 'jwt', 'authToken', 'auth_token', 'bearer'];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          for (const key of badKeys) {
            if (rx('(setItem|getItem|setStorageSync|getStorageSync)\\s*\\(\\s*["\\\']' + key + '["\\\']').test(line)) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
              break;
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use "token" as the unified storage key across all ends',
  },

  // ═══ error-code/rule.md: 2004 handling ═══
  {
    id: 'LINK-05',
    category: 'error-code',
    severity: 'BLOCKER',
    title: 'Response interceptor must handle code 2004 (token expired)',
    fileExtensions: ['.ts'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('request.ts') && !f.includes('http.ts')) continue;
        const content = ctx.read(f);
        if (!rx('2004').test(content)) {
          hits.push({ file: f, line: 1, snippet: 'Interceptor does not handle code 2004 (token expired)' });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Add code === 2004 -> logout + redirect to login in response interceptor',
  },

  // ═══ type-sync/rule.md: any type usage ═══
  {
    id: 'LINK-06',
    category: 'type-sync',
    severity: 'ERROR',
    title: 'any type should not be used in API type definitions',
    fileExtensions: ['.ts'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('types/') && !f.includes('models')) continue;
        if (!rx('\\.ts$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx(':\\s*any\\b').test(line) || rx('<any>').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace any with concrete types or use unknown with type guards',
  },

  // ═══ state-mapping/rule.md: four-state coverage ═══
  {
    id: 'LINK-07',
    category: 'state-mapping',
    severity: 'ERROR',
    title: 'Data pages must cover loading/error/empty/normal states',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f) || !(f.includes('/pages/') || f.includes('/views/'))) continue;
        const content = ctx.read(f);
        const hasLoading = rx('\\bloading\\b').test(content);
        const hasError = rx('\\berror\\b').test(content);
        const hasEmpty = rx('\\bempty\\b').test(content) || rx('el-empty|u-empty|a-empty').test(content);
        const isDataPage = rx('Api\\s*\\.').test(content) || rx('http\\.(get|post)').test(content) || rx('\\.(get|post|put|delete)\\s*\\(').test(content);
        if (isDataPage && (!hasLoading || !hasError || !hasEmpty)) {
          const missing = [];
          if (!hasLoading) missing.push('loading');
          if (!hasError) missing.push('error');
          if (!hasEmpty) missing.push('empty');
          hits.push({ file: f, line: 1, snippet: 'Missing states: ' + missing.join(', ') });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Add v-if branches for loading / error / empty / normal states',
  },

  // ═══ file-upload/rule.md: upload without auth header ═══
  {
    id: 'LINK-08',
    category: 'file-upload',
    severity: 'ERROR',
    title: 'File upload must include Authorization header',
    fileExtensions: ['.ts', '.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('upload')) continue;
        if (!rx('\\.(ts|vue)$').test(f)) continue;
        const content = ctx.read(f);
        if (rx('uploadFile|upload\\s*\\(').test(content) && !rx('Authorization|header\\s*\\[').test(content)) {
          hits.push({ file: f, line: 1, snippet: 'Upload function may be missing Authorization header' });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Include Authorization: Bearer {token} in upload request headers',
  },
];
