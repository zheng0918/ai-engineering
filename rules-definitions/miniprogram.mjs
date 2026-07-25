/**
 * MiniProgram compliance rules — aligned with miniProgram rule files
 * Covers: project-structure, pages, components, api, style, router,
 *         authorization, error-handling, interaction
 */

function rx(pattern, flags) { return new RegExp(pattern, flags || ''); }

export default [
  // ═══ project-structure/rule.md + style/rule.md ═══
  {
    id: 'MP-01',
    category: 'global',
    severity: 'BLOCKER',
    title: 'var declarations are forbidden (use const/let)',
    fileExtensions: ['.ts', '.vue', '.js'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.(ts|vue|js)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (/^\s*\/\/|^\s*\*/.test(line)) return;
          if (line.includes("'var'") || line.includes('"var"')) return;
          if (rx('\\bvar\\s+\\w+').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace var with const or let',
  },

  // ═══ style/rule.md ═══
  {
    id: 'MP-02',
    category: 'style',
    severity: 'BLOCKER',
    title: 'Inline styles are forbidden (must use class + rpx)',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        let inTemplate = false;
        lines.forEach((line, i) => {
          if (rx('<template').test(line)) inTemplate = true;
          if (rx('<\\/template').test(line)) inTemplate = false;
          if (inTemplate && rx('\\sstyle\\s*=\\s*["\\\']').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace inline style with class; use rpx units in SCSS',
  },

  // ═══ style/rule.md: px units ═══
  {
    id: 'MP-03',
    category: 'style',
    severity: 'ERROR',
    title: 'px units should be rpx (responsive pixels)',
    fileExtensions: ['.vue', '.scss', '.css'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.(vue|scss|css)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        let inStyle = false;
        lines.forEach((line, i) => {
          if (rx('<style').test(line)) inStyle = true;
          if (rx('<\\/style').test(line)) inStyle = false;
          if (f.endsWith('.scss') || f.endsWith('.css')) inStyle = true;
          if (inStyle && rx('\\d+px\\b').test(line) && !rx('\\$').test(line)) {
            // Exclude border: 1px (sometimes needed for hairline)
            if (!rx('border[^:]*:\\s*1px').test(line)) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace px with rpx (750rpx = screen width). Border hairlines may use 1px.',
  },

  // ═══ style/rule.md: hardcoded colors ═══
  {
    id: 'MP-04',
    category: 'style',
    severity: 'ERROR',
    title: 'Hardcoded hex colors must use SCSS variables',
    fileExtensions: ['.vue', '.scss'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.(vue|scss)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        let inStyle = false;
        lines.forEach((line, i) => {
          if (rx('<style').test(line)) inStyle = true;
          if (rx('<\\/style').test(line)) inStyle = false;
          if (f.endsWith('.scss')) inStyle = true;
          if (inStyle && rx(':\\s*#[0-9a-fA-F]{3,8}\\b').test(line)) {
            if (!rx('^\\s*\\$[\\w-]+\\s*:').test(line)) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Define colors in variables.scss and reference by variable name',
  },

  // ═══ api/rule.md ═══
  {
    id: 'MP-05',
    category: 'api',
    severity: 'BLOCKER',
    title: 'uni.request / wx.request must not be called directly in pages',
    fileExtensions: ['.vue', '.ts'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (f.includes('request.ts') || f.includes('api/')) continue;
        if (!rx('\\.(vue|ts)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('(uni|wx)\\.request\\s*\\(').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use the wrapped API module methods from api/ directory',
  },

  // ═══ api/rule.md: hardcoded API URLs ═══
  {
    id: 'MP-06',
    category: 'api',
    severity: 'BLOCKER',
    title: 'API URLs must not be hardcoded in pages',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('["\\\']\\/api\\/v\\d+\\/').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Define API URLs in api/ modules, import and call from pages',
  },

  // ═══ router/rule.md: hardcoded route paths ═══
  {
    id: 'MP-07',
    category: 'router',
    severity: 'BLOCKER',
    title: 'Route paths must use PAGES constants, not hardcoded strings',
    fileExtensions: ['.vue', '.ts'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.(vue|ts)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('uni\\.(navigateTo|redirectTo|reLaunch)\\s*\\(\\s*\\{\\s*url:\\s*["\\\']\\/pages\\/').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use PAGES constants: uni.navigateTo({ url: PAGES.GOODS_DETAIL + "?id=" + id })',
  },

  // ═══ pages/rule.md + error-handling/rule.md ═══
  {
    id: 'MP-08',
    category: 'pages',
    severity: 'ERROR',
    title: 'Pages must cover 4 states: loading/error/empty/normal',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f) || !f.includes('/pages/')) continue;
        const content = ctx.read(f);
        const hasLoading = rx('\\bloading\\b').test(content) || rx('u-loading-page').test(content);
        const hasError = rx('\\berror\\b').test(content) || rx('v-if\\s*=\\s*["\\\']\\s*error').test(content);
        const hasEmpty = rx('\\bempty\\b').test(content) || rx('u-empty').test(content);
        const hasApiCall = rx('Api\\s*\\.').test(content) || rx('\\.(get|post)\\s*\\(').test(content);
        if (hasApiCall && (!hasLoading || !hasError || !hasEmpty)) {
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

  // ═══ authorization/rule.md: openid stored locally ═══
  {
    id: 'MP-09',
    category: 'authorization',
    severity: 'BLOCKER',
    title: 'openid/session_key must not be stored in mini program local storage',
    fileExtensions: ['.ts', '.vue', '.js'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('setStorageSync\\s*\\(\\s*["\\\'][^"\\\']*openid').test(line)
            || rx('setStorageSync\\s*\\(\\s*["\\\'][^"\\\']*session_key').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'openid must be managed server-side only; never store in mini program Storage',
  },

  // ═══ interaction/rule.md: delete without confirmation ═══
  {
    id: 'MP-10',
    category: 'interaction',
    severity: 'ERROR',
    title: 'Delete operations must have secondary confirmation modal',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f)) continue;
        const content = ctx.read(f);
        // Crude check: if there's a delete function but no showModal nearby
        if (rx('delete\\w*Api|remove\\w*Api|\\.delete\\(|\\.remove\\(').test(content)) {
          if (!rx('showModal|Modal\\.confirm|confirm\\(').test(content)) {
            hits.push({ file: f, line: 1, snippet: 'Delete operation without confirmation modal detected' });
          }
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Wrap delete in uni.showModal confirmation before executing',
  },

  // ═══ components/rule.md: component without Props type ═══
  {
    id: 'MP-11',
    category: 'components',
    severity: 'ERROR',
    title: 'Components must use typed defineProps with TypeScript interface',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!f.includes('/components/')) continue;
        if (!rx('\\.vue$').test(f)) continue;
        const content = ctx.read(f);
        if (rx('defineProps\\s*\\(').test(content) && !rx('defineProps\\s*<').test(content)) {
          hits.push({ file: f, line: 1, snippet: 'defineProps() used without TypeScript generic type' });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use defineProps<PropsInterface>() with a typed interface',
  },

  // ═══ style/rule.md: missing scoped ═══
  {
    id: 'MP-12',
    category: 'style',
    severity: 'ERROR',
    title: '<style> tags must use scoped',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          const isStyleTag = rx('<style(?:\\s+lang\\s*=\\s*["\\\']\\w+["\\\'])?\\s*>').test(line);
          const hasScoped = rx('\\sscoped\\b').test(line);
          if (isStyleTag && !hasScoped) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Add scoped attribute to <style> tags',
  },
];
