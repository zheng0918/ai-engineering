#!/usr/bin/env node
/**
 * Multi-end Compliance Check Engine
 * ====================================
 * Shared engine that auto-detects project type and applies the corresponding
 * rule definitions. All 4 ends (frontend, backend, miniProgram, link) share
 * this single engine — rule definitions are loaded from rules-definitions/.
 *
 * Usage:
 *   node check-compliance.mjs [--end frontend|backend|miniprogram|link] [--json]
 *   node check-compliance.mjs --all                          # run all ends' rules
 *   node check-compliance.mjs --rules-dir <path>             # custom rules directory
 *
 * Project type is auto-detected if --end is not specified:
 *   - pom.xml / build.gradle / *.java  →  backend
 *   - pages.json / manifest.json        →  miniprogram
 *   - vite.config.* / *.vue             →  frontend
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI argument parsing ────────────────────────────────────────────
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const runAll = args.includes('--all');
const endArgIdx = args.indexOf('--end');
const rulesDirIdx = args.indexOf('--rules-dir');
const targetDirIdx = args.indexOf('--target');

const specifiedEnd = endArgIdx >= 0 ? args[endArgIdx + 1] : null;
const rulesDir = rulesDirIdx >= 0 ? args[rulesDirIdx + 1] : join(__dirname, '..', 'rules-definitions');
const targetDir = targetDirIdx >= 0 ? args[targetDirIdx + 1] : process.cwd();

// ── Helper: safe regex constructor ──────────────────────────────────
function rx(pattern, flags) {
  return new RegExp(pattern, flags || '');
}

// ── Project type auto-detection ─────────────────────────────────────
function detectProjectType(root) {
  const signals = [];

  function scan(dir, depth) {
    if (depth > 2) return;
    if (!existsSync(dir)) return;
    try {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === 'target' || entry === '.git' || entry.startsWith('.')) continue;
        const full = join(dir, entry);
        try {
          const st = statSync(full);
          if (st.isDirectory()) { scan(full, depth + 1); continue; }
          signals.push(entry);
        } catch (_) { /* skip */ }
      }
    } catch (_) { /* skip */ }
  }

  const srcDir = join(root, 'src');
  scan(root, 0);

  const allFiles = signals.join('|');
  const hasJava = allFiles.includes('.java') || existsSync(join(root, 'pom.xml')) || existsSync(join(root, 'build.gradle'));
  const hasUniapp = existsSync(join(root, 'pages.json')) || existsSync(join(root, 'manifest.json'));
  const hasVue = allFiles.includes('.vue') || existsSync(join(root, 'vite.config.ts')) || existsSync(join(root, 'vite.config.js'));
  const hasReact = allFiles.includes('.tsx') || allFiles.includes('.jsx');

  if (hasJava) return 'backend';
  if (hasUniapp) return 'miniprogram';
  if (hasVue || hasReact) return 'frontend';
  return 'unknown';
}

// ── Rule loader ─────────────────────────────────────────────────────
// A failed load is NOT an empty rule set: it means the end was never
// scanned. Recorded here so main() can refuse to report a pass.
const loadFailures = [];

async function loadRules(end) {
  const ruleFile = join(rulesDir, end + '.mjs');
  if (!existsSync(ruleFile)) {
    loadFailures.push({ end: end, reason: 'rules file not found: ' + ruleFile });
    console.error('Rules file not found: ' + ruleFile);
    return [];
  }
  try {
    const mod = await import('file://' + ruleFile.replace(/\\/g, '/'));
    const rules = mod.default || mod.rules || [];
    if (!rules.length) {
      loadFailures.push({ end: end, reason: 'rules file exports no rules: ' + ruleFile });
      console.error('Rules file exports no rules: ' + ruleFile);
    }
    return rules;
  } catch (e) {
    loadFailures.push({ end: end, reason: 'load error for ' + end + ': ' + e.message });
    console.error('Failed to load rules for', end + ':', e.message);
    return [];
  }
}

// ── File collector ──────────────────────────────────────────────────
function collectFiles(root, extensions) {
  const results = [];
  const exclude = new Set(['node_modules', 'target', 'dist', '.git', '.claude', 'build', '.gradle', '__pycache__']);
  const stack = [root];

  while (stack.length) {
    const d = stack.pop();
    if (!existsSync(d)) continue;
    try {
      for (const entry of readdirSync(d)) {
        if (exclude.has(entry) || entry.startsWith('.')) continue;
        const full = join(d, entry);
        try {
          const st = statSync(full);
          if (st.isDirectory()) { stack.push(full); continue; }
          const ext = extname(entry).toLowerCase();
          if (extensions.has(ext) || extensions.has(basename(entry))) {
            results.push(full);
          }
        } catch (_) { /* skip */ }
      }
    } catch (_) { /* skip */ }
  }
  return results;
}

// ── Context builder ─────────────────────────────────────────────────
function buildContext(root, extensions) {
  const files = collectFiles(root, extensions);
  const cache = new Map();

  return {
    root: root,
    files: files,
    read: function (path) {
      const abs = path.startsWith(root) ? path : join(root, path);
      if (cache.has(abs)) return cache.get(abs);
      try { const c = readFileSync(abs, 'utf-8'); cache.set(abs, c); return c; }
      catch (_) { return ''; }
    },
    exists: function (path) {
      const abs = path.startsWith(root) ? path : join(root, path);
      return existsSync(abs);
    },
  };
}

// ── Report formatting ───────────────────────────────────────────────
function formatReport(results, endLabel) {
  const passed = results.filter(function (r) { return r.pass; });
  const failed = results.filter(function (r) { return !r.pass; });
  const blockers = failed.filter(function (r) { return r.rule.severity === 'BLOCKER'; });
  const errors = failed.filter(function (r) { return r.rule.severity === 'ERROR'; });
  const warns = failed.filter(function (r) { return r.rule.severity === 'WARN'; });

  if (jsonOutput) {
    return JSON.stringify({
      end: endLabel,
      summary: {
        total: results.length,
        passed: passed.length,
        failed: failed.length,
        blockers: blockers.length,
        errors: errors.length,
        warns: warns.length,
      },
      violations: failed.map(function (r) {
        return {
          rule: r.rule.id,
          category: r.rule.category,
          severity: r.rule.severity,
          title: r.rule.title,
          fix: r.rule.fix,
          hits: r.hits.slice(0, 20),
          hitCount: r.hits.length,
        };
      }),
    }, null, 2);
  }

  var lines = [];
  lines.push('');
  lines.push('══ ' + endLabel.toUpperCase() + ' COMPLIANCE REPORT ══');
  lines.push('');
  lines.push('  Rules  : ' + results.length);
  lines.push('  PASS   : ' + passed.length);
  lines.push('  FAIL   : ' + failed.length + ' (BLOCKER:' + blockers.length + ' ERROR:' + errors.length + ' WARN:' + warns.length + ')');
  lines.push('');

  if (failed.length === 0) {
    lines.push('  [PASS] All checks passed!');
    lines.push('');
    return lines.join('\n');
  }

  for (var j = 0; j < failed.length; j++) {
    var item = failed[j];
    var rule = item.rule;
    var hits = item.hits;
    var sev = rule.severity;
    var icon = sev === 'BLOCKER' ? '[BLOCKER]' : sev === 'ERROR' ? '[ERROR]' : '[WARN]';
    lines.push(icon + ' ' + rule.id + ' - ' + rule.title);
    lines.push('   Fix: ' + rule.fix);
    for (var k = 0; k < Math.min(hits.length, 5); k++) {
      var h = hits[k];
      var relPath = h.file.startsWith(targetDir)
        ? h.file.slice(targetDir.length + 1).replace(/\\/g, '/')
        : h.file;
      lines.push('   -> ' + relPath + ':' + h.line + '  ' + h.snippet);
    }
    if (hits.length > 5) {
      lines.push('   ... and ' + (hits.length - 5) + ' more');
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const ends = runAll
    ? ['frontend', 'backend', 'miniprogram', 'link']
    : [specifiedEnd || detectProjectType(targetDir)];

  if (ends[0] === 'unknown') {
    console.error('Cannot detect project type. Use --end to specify: frontend, backend, miniprogram, or link.');
    process.exit(2);
  }

  var allResults = [];

  for (var i = 0; i < ends.length; i++) {
    var end = ends[i];
    var rules = await loadRules(end);
    if (rules.length === 0) {
      console.error('No rules loaded for ' + end);
      continue;
    }

    // Build context for this end
    var exts = new Set();
    for (var r = 0; r < rules.length; r++) {
      if (rules[r].fileExtensions) {
        for (var e = 0; e < rules[r].fileExtensions.length; e++) {
          exts.add(rules[r].fileExtensions[e]);
        }
      }
    }
    // Default extensions per end
    if (exts.size === 0) {
      if (end === 'backend') {
        ['java', 'xml', 'yml', 'yaml', 'sql', 'gradle', 'properties'].forEach(function (x) { exts.add('.' + x); });
      } else if (end === 'miniprogram') {
        ['vue', 'ts', 'js', 'scss', 'css', 'json'].forEach(function (x) { exts.add('.' + x); });
      } else {
        ['vue', 'ts', 'js', 'scss', 'css'].forEach(function (x) { exts.add('.' + x); });
      }
    }

    var ctx = buildContext(targetDir, exts);
    var results = [];

    for (var ri = 0; ri < rules.length; ri++) {
      var rule = rules[ri];
      try {
        var result = rule.check(ctx);
        results.push({ rule: rule, pass: result.pass, hits: result.hits || [] });
      } catch (err) {
        results.push({ rule: rule, pass: false, hits: [{ file: '', line: 0, snippet: 'Check error: ' + err.message }] });
      }
    }

    var report = formatReport(results, end);
    console.log(report);

    for (var ri2 = 0; ri2 < results.length; ri2++) {
      allResults.push(results[ri2]);
    }
  }

  // A rule load failure means an entire end went unscanned. Reporting
  // "no violations" there would be a false pass — refuse instead.
  if (loadFailures.length > 0) {
    console.error('');
    console.error('✗ 规则加载失败 —— 本次扫描结果不可信，以下端未执行任何检查：');
    for (var lf = 0; lf < loadFailures.length; lf++) {
      console.error('    [' + loadFailures[lf].end + '] ' + loadFailures[lf].reason);
    }
    console.error('  当前 rulesDir: ' + rulesDir);
    console.error('  （默认应为仓库根的 rules-definitions/，可用 --rules-dir 覆盖）');
    process.exit(3);
  }

  var totalFailed = allResults.filter(function (r) { return !r.pass; }).length;
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(function (err) {
  console.error('Fatal:', err.message);
  process.exit(2);
});
