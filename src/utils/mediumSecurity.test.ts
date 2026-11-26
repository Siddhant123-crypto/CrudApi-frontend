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

test('BUG-01: zero unguarded token, auth response, or password logging remains across mobile auth files', () => {
  const forbiddenPatterns = [
    /console\.log\(\s*['"]ADMIN LOGIN RESPONSE:['"]/,
    /console\.log\(\s*['"]GOOGLE RESULT:['"]/,
    /console\.log\(\s*['"]GOOGLE BACKEND RESPONSE:['"]/,
    /console\.log\(\s*['"]GOOGLE EXISTING USER:['"]/,
    /console\.log\(\s*['"]ACCOUNT_EXISTS_LINK_REQUIRED for:['"]/,
    /console\.log\(\s*['"]Customer Registration Result:['"]/,
    /console\.log\(\s*['"]Farmer Registration Result:['"]/,
    /console\.log\(\s*['"]USER REGISTER RESPONSE:['"]/,
  ];

  const authFiles = [
    'src/screens/NewUserLoginScreen.tsx',
    'src/screens/CustomerRegisterScreen.tsx',
    'src/screens/FarmerRegisterScreen.tsx',
    'src/services/authService.ts',
    'src/context/AuthContext.tsx',
  ];

  for (const rel of authFiles) {
    const content = fs.readFileSync(path.join(MOBILE_ROOT, rel), 'utf8');
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(content, pattern, `${rel} must not contain sensitive auth log ${pattern}`);
    }
  }

  const apiSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/services/api.ts'), 'utf8');
  assert.match(apiSource, /isAuthPath/);
  assert.doesNotMatch(apiSource, /console\.log\([^)]*Authorization/);
});

test('BUG-03A: single-flight refresh handles concurrent 401s cleanly across api, reviewService, and sseNotificationClient', () => {
  const apiSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/services/api.ts'), 'utf8');
  assert.match(apiSource, /export const refreshAccessTokenSingleFlight/);
  assert.match(apiSource, /_staleRetry/);
  assert.doesNotMatch(apiSource, /_authRetry/, 'Obsolete same-token sleep(600) retry loop must not run before refresh');

  const reviewSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/services/reviewService.ts'), 'utf8');
  assert.match(reviewSource, /refreshAccessTokenSingleFlight/);
  assert.match(reviewSource, /response\.status === 401/);

  const sseSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/services/sseNotificationClient.ts'), 'utf8');
  assert.match(sseSource, /refreshAccessTokenSingleFlight/);
  assert.match(sseSource, /xhr\.status === 401/);
  assert.match(sseSource, /xhr\.status === 403/);
});

test('BUG-03B: ResetPasswordScreen enforces full backend password complexity policy', () => {
  const resetSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/screens/ResetPasswordScreen.tsx'), 'utf8');
  assert.match(resetSource, /hasLowercase\s*=\s*\/\[a-z\]\/\.test\(newPassword\)/);
  assert.match(resetSource, /\(\?=.*\.\*\[A-Z\]\).*\(\?=.*\.\*\[a-z\]\).*\(\?=.*\.\*\\d\).*\{8,\}/);
});

test('BUG-03C & ISSUE-07: login heuristic fixed, roles strictly validated & partitioned, and logout awaits server revocation safely', () => {
  const loginSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/screens/NewUserLoginScreen.tsx'), 'utf8');
  assert.doesNotMatch(loginSource, /email\.includes\(\s*['"]admin['"]\s*\)/, 'Emails containing "admin" must not bypass /newuser/login');

  const authCtxSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/context/AuthContext.tsx'), 'utf8');
  assert.match(authCtxSource, /if \(!normalizedRole\)/);
  assert.match(authCtxSource, /await api[\s\S]*\/auth\/logout/);
  assert.match(authCtxSource, /finally\s*\{[\s\S]*clearStoredAuthTokens/);

  const navSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/navigation/AppNavigator.tsx'), 'utf8');
  assert.match(navSource, /normalizeMainRole/);
  assert.match(navSource, /if \(!isLoggedIn \|\| !validatedRole\)/);
  assert.match(navSource, /\{role === 'ADMIN' && \(/);
  assert.match(navSource, /\{role === 'FARMER' && \(/);
  assert.match(navSource, /\{role === 'USER' && \(/);
});
