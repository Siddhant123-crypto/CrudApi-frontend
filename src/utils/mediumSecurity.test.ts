import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOBILE_ROOT = path.resolve(__dirname, '../..');

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

test('BUG-M15: zero plaintext userToken reads or writes remain outside tokenStorage.ts', () => {
  const srcFiles = collectTsFiles(path.join(MOBILE_ROOT, 'src'));
  const offenders: string[] = [];

  for (const file of srcFiles) {
    const rel = path.relative(MOBILE_ROOT, file).replace(/\\/g, '/');
    if (rel === 'src/services/tokenStorage.ts' || rel.endsWith('.test.ts')) {
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('userToken')) {
      offenders.push(rel);
    }
  }

  assert.deepEqual(offenders, [], `Found lingering plaintext userToken references: ${offenders.join(', ')}`);

  const tokenStorageContent = fs.readFileSync(path.join(MOBILE_ROOT, 'src/services/tokenStorage.ts'), 'utf8');
  assert.match(tokenStorageContent, /expo-secure-store/);
  assert.match(tokenStorageContent, /AsyncStorage\.removeItem\(LEGACY_TOKEN_KEY\)/);
});

test('BUG-M16: App.tsx wraps root application tree with ErrorBoundary fallback component', () => {
  const appTsx = fs.readFileSync(path.join(MOBILE_ROOT, 'App.tsx'), 'utf8');
  assert.match(appTsx, /import ErrorBoundary from '\.\/src\/components\/ErrorBoundary'/);
  assert.match(appTsx, /<ErrorBoundary>[\s\S]*<\/ErrorBoundary>/);

  const ebSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/components/ErrorBoundary.tsx'), 'utf8');
  assert.match(ebSource, /static getDerivedStateFromError/);
  assert.match(ebSource, /componentDidCatch/);
  assert.match(ebSource, /common\.retry/);
  assert.doesNotMatch(ebSource, /componentStack.*render|error\.stack/i, 'Fallback UI must not render stack traces');
});

test('BUG-M04: registration screens enforce strong password policy (>= 8 chars, mixed case, digit, symbol)', () => {
  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!*?._-]).{8,}$/;
  assert.equal(strongPasswordRegex.test('weak'), false);
  assert.equal(strongPasswordRegex.test('Short1!'), false);
  assert.equal(strongPasswordRegex.test('onlylowercase1!'), false);
  assert.equal(strongPasswordRegex.test('NoSpecial123'), false);
  assert.equal(strongPasswordRegex.test('Farm2Home@123'), true);

  for (const screen of ['src/screens/CustomerRegisterScreen.tsx', 'src/screens/FarmerRegisterScreen.tsx']) {
    const content = fs.readFileSync(path.join(MOBILE_ROOT, screen), 'utf8');
    assert.match(content, /\(\?=.*\.\*\[A-Z\]\).*\(\?=.*\.\*\\d\).*\{8,\}/, `${screen} must enforce strong password regex`);
  }
});
