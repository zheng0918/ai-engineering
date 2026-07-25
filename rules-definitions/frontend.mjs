/**
 * Frontend compliance rules — aligned with frontend rule files
 * Covers: config, api, style, script, types, pages
 */

import { join } from 'path';

function rx(pattern, flags) { return new RegExp(pattern, flags || ''); }

export default [
  // ═══ config/rule.md ═══
  {
    id: 'FE-01',
    category: 'config',
    severity: 'BLOCKER',
    title: 'API address must not be hardcoded',
    fileExtensions: ['.ts', '.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.(ts|vue)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('https?:\\/\\/localhost[:\\d]*\\/api').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace hardcoded URL with import.meta.env.VITE_API_BASE',
  },

  // ═══ api/rule.md ═══
  {
    id: 'FE-02',
    category: 'api',
    severity: 'BLOCKER',
    title: 'Direct axios usage in pages is forbidden',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f)) continue;
        if (f.includes('request.ts')) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('axios\\s*\\.(get|post|put|delete|request)\\s*\\(').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use the http instance from @/api/request.ts or import API module methods',
  },

  {
    id: 'FE-03',
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
          if (rx('["\\\']\\/api\\/v\\d+\\/').test(line) && !line.includes('@/api/')) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Move API URL definitions to api/modules/, call via module methods in pages',
  },

  // ═══ Global prohibitions (root/agent.md) ═══
  {
    id: 'FE-04',
    category: 'global',
    severity: 'BLOCKER',
    title: 'var declarations are forbidden',
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
          if (rx('\\bvar\\s+\\w+\\s*=').test(line) || rx('\\bvar\\s+\\w+\\s*[;,]').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace var with const or let',
  },

  {
    id: 'FE-05',
    category: 'global',
    severity: 'BLOCKER',
    title: 'Inline styles are forbidden',
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
    fix: 'Replace inline style with class, define styles in <style scoped> or SCSS',
  },

  // ═══ style/rule.md ═══
  {
    id: 'FE-06',
    category: 'style',
    severity: 'ERROR',
    title: '<style> tags must use scoped or BEM naming',
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
    fix: 'Add scoped attribute to <style> tag, or ensure BEM naming convention',
  },

  // ═══ frontend/agent.md ═══
  {
    id: 'FE-07',
    category: 'script',
    severity: 'BLOCKER',
    title: 'All .vue files must use <script setup lang="ts">',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f)) continue;
        const content = ctx.read(f);
        // Has <script> but not setup
        const hasScript = rx('<script\\b').test(content);
        const hasSetup = rx('<script\\b[^>]*\\bsetup\\b').test(content);
        if (hasScript && !hasSetup) {
          const lineIdx = content.split('\n').findIndex(function (l) { return rx('<script\\b').test(l); });
          hits.push({ file: f, line: lineIdx + 1, snippet: (content.split('\n')[lineIdx] || '').trim() });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace <script> with <script setup lang="ts">',
  },

  // ═══ Type safety ═══
  {
    id: 'FE-08',
    category: 'types',
    severity: 'ERROR',
    title: 'ref<any> declarations are forbidden',
    fileExtensions: ['.ts', '.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.(ts|vue)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('ref\\s*<\\s*any\\s*>').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Replace ref<any> with a concrete TypeScript type',
  },

  // ═══ Page four-state coverage ═══
  {
    id: 'FE-09',
    category: 'pages',
    severity: 'ERROR',
    title: 'Data pages must cover 4 states: loading/error/empty/normal',
    fileExtensions: ['.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (!rx('\\.vue$').test(f) || !f.includes('/pages/')) continue;
        const content = ctx.read(f);
        const hasLoading = rx('\\bloading\\b').test(content);
        const hasError = rx('\\berror\\b').test(content) || rx('v-if\\s*=\\s*["\\\']\\s*error').test(content);
        const hasEmpty = rx('\\bempty\\b').test(content) || rx('v-if\\s*=\\s*["\\\'].*empty').test(content) || rx('el-empty').test(content);
        const hasApiCall = rx('Api\\s*\\.').test(content) || rx('http\\.(get|post)').test(content);
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

  // ═══ config/rule.md: env.d.ts type declarations ═══
  {
    id: 'FE-10',
    category: 'config',
    severity: 'BLOCKER',
    title: 'Environment variables must have type declarations (env.d.ts)',
    fileExtensions: ['.d.ts'],
    check(ctx) {
      const envPath = join(ctx.root, 'src', 'env.d.ts');
      if (!ctx.exists(envPath)) {
        return { pass: false, hits: [{ file: 'src/env.d.ts', line: 0, snippet: 'File not found' }] };
      }
      const content = ctx.read(envPath);
      const hasImportMetaEnv = rx('interface\\s+ImportMetaEnv\\s*\\{').test(content);
      const hasViteApiBase = rx('VITE_API_BASE').test(content);
      if (!hasImportMetaEnv || !hasViteApiBase) {
        return { pass: false, hits: [{ file: 'src/env.d.ts', line: 1, snippet: 'Missing ImportMetaEnv interface or VITE_API_BASE' }] };
      }
      return { pass: true, hits: [] };
    },
    fix: 'Declare interface ImportMetaEnv { readonly VITE_API_BASE: string } in env.d.ts',
  },

  // ═══ .env files ═══
  {
    id: 'FE-11',
    category: 'config',
    severity: 'ERROR',
    title: '.env.development and .env.production must exist',
    fileExtensions: ['.env.development', '.env.production'],
    check(ctx) {
      const hits = [];
      for (const env of ['.env.development', '.env.production']) {
        if (!ctx.exists(join(ctx.root, env))) {
          hits.push({ file: env, line: 0, snippet: 'File not found' });
        }
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Create .env.development and .env.production with VITE_API_BASE and VITE_APP_TITLE',
  },

  // ═══ router/rule.md: no hardcoded route paths ═══
  {
    id: 'FE-12',
    category: 'router',
    severity: 'ERROR',
    title: 'Route navigation should not use hardcoded path strings',
    fileExtensions: ['.ts', '.vue'],
    check(ctx) {
      const hits = [];
      for (const f of ctx.files) {
        if (f.includes('router/') || f.includes('request.ts')) continue;
        if (!rx('\\.(ts|vue)$').test(f)) continue;
        const content = ctx.read(f);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rx('router\\.(push|replace)\\s*\\(\\s*["\\\']\\/').test(line)) {
            hits.push({ file: f, line: i + 1, snippet: line.trim() });
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Use named routes: router.push({ name: "RouteName" }) instead of hardcoded paths',
  },

  // ═══ Hardcoded colors (style/rule.md) ═══
  {
    id: 'FE-13',
    category: 'style',
    severity: 'ERROR',
    title: 'Hardcoded hex colors should use SCSS variables',
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
            // Exclude $var: #value; (variable definitions)
            if (!rx('^\\s*\\$[\\w-]+\\s*:').test(line)) {
              hits.push({ file: f, line: i + 1, snippet: line.trim() });
            }
          }
        });
      }
      return { pass: hits.length === 0, hits };
    },
    fix: 'Define colors as SCSS variables in variables.scss and reference by variable name',
  },
];
