import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const allowlistPath = path.join(rootDir, 'i18n-audit-allowlist.json');
const enLocalePath = path.join(srcDir, 'i18n', 'locales', 'en.json');

// 1. Load allowlist
let allowlist = {
  ignoreFiles: [],
  exactStrings: [],
  patterns: [],
  dynamicKeyPrefixes: []
};

if (fs.existsSync(allowlistPath)) {
  allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf-8'));
}

const exactStringSet = new Set(allowlist.exactStrings.map(item => item.value));
const regexPatterns = allowlist.patterns.map(item => new RegExp(item.pattern));

// 2. Load English locale keys
function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enLocale = JSON.parse(fs.readFileSync(enLocalePath, 'utf-8'));
const enKeys = new Set(flattenKeys(enLocale));

// 3. Helper to test if a string is allowlisted
function isAllowlisted(str) {
  const trimmed = str.trim();
  if (!trimmed) return true;
  if (exactStringSet.has(trimmed)) return true;
  for (const reg of regexPatterns) {
    if (reg.test(trimmed)) return true;
  }
  return false;
}

// 4. File collector
function getSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getSourceFiles(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = getSourceFiles(srcDir);
const usedKeys = new Set();
const missingKeys = [];
const hardcodedViolations = [];

for (const filePath of allFiles) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  // Check if file should be ignored
  const shouldIgnore = allowlist.ignoreFiles.some(pattern => {
    if (pattern.endsWith('/**')) {
      const base = pattern.replace('/**', '');
      return relPath.startsWith(base);
    }
    if (pattern.endsWith('*.d.ts')) {
      return relPath.endsWith('.d.ts');
    }
    if (pattern.includes('.test.')) {
      return relPath.includes('.test.');
    }
    return relPath === pattern;
  });

  if (shouldIgnore || relPath.endsWith('.d.ts')) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check key usages: t('namespace.key') or t("namespace.key")
  const tCalls = content.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g);
  for (const match of tCalls) {
    const key = match[1];
    usedKeys.add(key);
    if (!enKeys.has(key)) {
      // Check if key is a prefix or contains plural
      const isPluralVariant = key.endsWith('_plural') || key.endsWith('_one') || key.endsWith('_other');
      if (!isPluralVariant && !missingKeys.some(m => m.key === key && m.file === relPath)) {
        missingKeys.push({ key, file: relPath });
      }
    }
  }

  // Scan line by line for hardcoded strings
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNum = lineIndex + 1;

    // Skip import lines, comments, console logs, styles
    const trimmed = line.trim();
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export type ') ||
      trimmed.startsWith('console.') ||
      trimmed.includes('styles = StyleSheet.create')
    ) {
      continue;
    }

    // 1. Alert.alert("Title", "Message")
    if (line.includes('Alert.alert(')) {
      const alertMatch = line.match(/Alert\.alert\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
      if (alertMatch) {
        const title = alertMatch[1];
        const msg = alertMatch[2];
        if (title && !isAllowlisted(title)) {
          hardcodedViolations.push({
            file: relPath,
            line: lineNum,
            type: 'Alert.alert title',
            raw: title
          });
        }
        if (msg && !isAllowlisted(msg)) {
          hardcodedViolations.push({
            file: relPath,
            line: lineNum,
            type: 'Alert.alert message',
            raw: msg
          });
        }
      }
    }

    // 2. Specific props with string literals
    const targetProps = [
      'placeholder',
      'headerTitle',
      'tabBarLabel',
      'drawerLabel',
      'accessibilityLabel',
      'accessibilityHint'
    ];

    for (const prop of targetProps) {
      const propRegex = new RegExp(`\\b${prop}=['"]([^'"]+)['"]`, 'g');
      let pMatch;
      while ((pMatch = propRegex.exec(line)) !== null) {
        const val = pMatch[1];
        if (!isAllowlisted(val)) {
          hardcodedViolations.push({
            file: relPath,
            line: lineNum,
            type: `prop ${prop}`,
            raw: val
          });
        }
      }
    }

    // Check title="..." and label="..." only when not in style or testID or icons
    if (!line.includes('testID') && !line.includes('accessibilityRole')) {
      const generalProps = ['title', 'label'];
      for (const prop of generalProps) {
        const propRegex = new RegExp(`\\b${prop}=['"]([^'"]+)['"]`, 'g');
        let gpMatch;
        while ((gpMatch = propRegex.exec(line)) !== null) {
          const val = gpMatch[1];
          if (!isAllowlisted(val)) {
            hardcodedViolations.push({
              file: relPath,
              line: lineNum,
              type: `prop ${prop}`,
              raw: val
            });
          }
        }
      }
    }

    // 3. JSX Text Nodes: >Some text<
    if (filePath.endsWith('.tsx')) {
      if (
        !line.includes('=>') &&
        !trimmed.startsWith('interface ') &&
        !trimmed.startsWith('type ') &&
        !trimmed.startsWith('declare ')
      ) {
        const jsxTextRegex = />\s*([A-Za-z0-9][^<>{}\n]*?[A-Za-z0-9])\s*</g;
        let jsxMatch;
        while ((jsxMatch = jsxTextRegex.exec(line)) !== null) {
          const text = jsxMatch[1].trim();
          // Ignore if text is purely numbers or code
          if (!isAllowlisted(text)) {
            hardcodedViolations.push({
              file: relPath,
              line: lineNum,
              type: 'JSX Text',
              raw: text
            });
          }
        }
      }
    }
  }
}

// 4. Find unused keys in en.json
const unusedKeys = [];
for (const key of enKeys) {
  if (usedKeys.has(key)) continue;
  // Check if covered by dynamic prefixes
  const isDynamic = (allowlist.dynamicKeyPrefixes || []).some(prefix => key.startsWith(prefix));
  if (!isDynamic) {
    unusedKeys.push(key);
  }
}

// 5. Output Report
console.log('='.repeat(70));
console.log('FARM2HOME i18n AUDIT REPORT');
console.log('='.repeat(70));
console.log(`Total en.json keys: ${enKeys.size}`);
console.log(`Total keys used in code: ${usedKeys.size}`);
console.log(`Missing translation keys in en.json: ${missingKeys.length}`);
console.log(`Unused keys in en.json (excluding dynamic prefixes): ${unusedKeys.length}`);
console.log(`Hardcoded user-facing string violations: ${hardcodedViolations.length}`);
console.log('-'.repeat(70));

if (missingKeys.length > 0) {
  console.log('\n❌ MISSING KEYS (used in code with t() but not found in en.json):');
  for (const m of missingKeys.slice(0, 20)) {
    console.log(`  - [${m.file}] t('${m.key}')`);
  }
  if (missingKeys.length > 20) {
    console.log(`  ... and ${missingKeys.length - 20} more.`);
  }
}

if (hardcodedViolations.length > 0) {
  console.log('\n❌ HARDCODED USER-FACING STRING VIOLATIONS:');
  for (const v of hardcodedViolations.slice(0, 30)) {
    console.log(`  - ${v.file}:${v.line} (${v.type}): "${v.raw}"`);
  }
  if (hardcodedViolations.length > 30) {
    console.log(`  ... and ${hardcodedViolations.length - 30} more.`);
  }
}

if (unusedKeys.length > 0) {
  console.log('\n⚠️ UNUSED KEYS IN en.json:');
  for (const u of unusedKeys.slice(0, 15)) {
    console.log(`  - ${u}`);
  }
  if (unusedKeys.length > 15) {
    console.log(`  ... and ${unusedKeys.length - 15} more.`);
  }
}

console.log('\n' + '='.repeat(70));

try {
  fs.writeFileSync(path.join(rootDir, 'audit_violations.json'), JSON.stringify({ violations: hardcodedViolations, missing: missingKeys }, null, 2));
} catch (e) {}

if (hardcodedViolations.length > 0 || missingKeys.length > 0) {
  console.log(`FAILED: ${hardcodedViolations.length} hardcoded strings and ${missingKeys.length} missing keys remaining.`);
  process.exit(1);
} else {
  console.log('PASSED: 0 hardcoded strings and 0 missing keys!');
  process.exit(0);
}
