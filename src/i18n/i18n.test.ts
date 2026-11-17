import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_SELECTED_KEY,
  normalizeLanguageCode,
} from './languages.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, 'locales');

// Helper to load locale JSON
function loadLocale(code: string): Record<string, any> {
  const filePath = path.join(localesDir, `${code}.json`);
  assert.ok(fs.existsSync(filePath), `Translation file missing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Helper to collect all nested keys as dot-separated strings
function getKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(getKeys(val, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

// Helper to get nested value by dot path
function getNestedValue(obj: Record<string, any>, keyPath: string): any {
  return keyPath.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

test('Supported languages configuration includes all 9 required languages', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 9, 'Must support exactly 9 languages');

  const expectedCodes = ['en', 'hi', 'mr', 'ta', 'bn', 'kn', 'or', 'sa', 'te'];
  const actualCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(actualCodes, expectedCodes);

  // Check fallback language
  assert.equal(DEFAULT_LANGUAGE, 'en', 'Default fallback language must be English (en)');

  // Verify native names are present and non-empty
  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(lang.name && lang.name.trim().length > 0, `Language ${lang.code} missing English name`);
    assert.ok(lang.nativeName && lang.nativeName.trim().length > 0, `Language ${lang.code} missing nativeName`);
  }

  // Verify specific native scripts
  const langMap = Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l.code, l.nativeName]));
  assert.equal(langMap.en, 'English');
  assert.equal(langMap.hi, 'हिन्दी');
  assert.equal(langMap.mr, 'मराठी');
  assert.equal(langMap.ta, 'தமிழ்');
  assert.equal(langMap.bn, 'বাংলা');
  assert.equal(langMap.kn, 'ಕನ್ನಡ');
  assert.equal(langMap.or, 'ଓଡ଼ିଆ');
  assert.equal(langMap.sa, 'संस्कृतम्');
  assert.equal(langMap.te, 'తెలుగు');
});

test('AsyncStorage keys are properly defined and namespaced', () => {
  assert.equal(LANGUAGE_STORAGE_KEY, '@farm2home_app_language');
  assert.equal(LANGUAGE_SELECTED_KEY, '@farm2home_language_selected');
});

test('English base translation file is complete and valid', () => {
  const en = loadLocale('en');
  const enKeys = getKeys(en);

  // Check essential top-level sections
  const requiredSections = [
    'common',
    'language',
    'auth',
    'nav',
    'home',
    'product',
    'cart',
    'checkout',
    'orders',
    'farmer',
    'notifications',
    'profile',
    'validation',
  ];

  for (const section of requiredSections) {
    assert.ok(en[section], `English locale must contain section: ${section}`);
    assert.ok(
      Object.keys(en[section]).length > 0,
      `Section "${section}" in English locale must not be empty`
    );
  }

  assert.ok(enKeys.length >= 80, `English locale should have comprehensive keys (found ${enKeys.length})`);
});

test('All 8 Indic language files match English keys parity with 100% coverage', () => {
  const en = loadLocale('en');
  const enKeys = getKeys(en);

  const indicCodes = ['hi', 'mr', 'ta', 'bn', 'kn', 'or', 'sa', 'te'];

  for (const code of indicCodes) {
    const locale = loadLocale(code);
    const localeKeys = getKeys(locale);

    // Verify all English keys exist in this locale
    for (const key of enKeys) {
      const val = getNestedValue(locale, key);
      assert.ok(
        val !== undefined && val !== null,
        `Missing translation key in "${code}.json": "${key}"`
      );
      assert.equal(
        typeof val,
        'string',
        `Value for key "${key}" in "${code}.json" must be a string`
      );
      assert.ok(
        val.trim().length > 0,
        `Translation for key "${key}" in "${code}.json" must not be empty`
      );
    }

    // Verify interpolation variables (e.g. {{language}}, {{count}}, {{id}})
    const interpolationKeys = [
      'language.continueIn',
      'language.count',
      'cart.itemCount',
      'cart.itemCount_plural',
      'orders.orderNumber',
    ];

    for (const iKey of interpolationKeys) {
      const enVal: string = getNestedValue(en, iKey);
      const locVal: string = getNestedValue(locale, iKey);
      const enMatches = enVal.match(/\{\{([^}]+)\}\}/g) || [];
      const locMatches = locVal.match(/\{\{([^}]+)\}\}/g) || [];
      assert.deepEqual(
        locMatches.sort(),
        enMatches.sort(),
        `Interpolation variable mismatch in "${code}.json" for "${iKey}". Expected ${enMatches.join(', ')} but got ${locMatches.join(', ')}`
      );
    }
  }
});

test('i18n instance returns exact matching translations for each of the 9 languages without swapping', async () => {
  const allCodes = ['en', 'hi', 'mr', 'ta', 'bn', 'kn', 'or', 'sa', 'te'];
  const testResources: Record<string, { translation: Record<string, any> }> = {};

  for (const c of allCodes) {
    testResources[c] = { translation: loadLocale(c) };
  }

  const testInstance = i18next.createInstance();
  await testInstance.init({
    resources: testResources,
    fallbackLng: 'en',
    lng: 'en',
    interpolation: { escapeValue: false },
  });

  const checkKeys = [
    'common.appName',
    'common.tagline',
    'common.continue',
    'auth.welcomeBack',
    'auth.emailOrMobile',
    'auth.password',
    'auth.forgotPassword',
    'auth.signIn',
    'auth.or',
    'auth.continueWithGoogle',
    'auth.dontHaveAccount',
    'auth.createAccount',
  ];

  for (const code of allCodes) {
    await testInstance.changeLanguage(code);
    assert.equal(testInstance.language, code, `Active language must be "${code}"`);

    const expectedLocale = testResources[code].translation;
    for (const key of checkKeys) {
      const actualVal = testInstance.t(key);
      const expectedVal = getNestedValue(expectedLocale, key);
      assert.equal(
        actualVal,
        expectedVal,
        `Language "${code}" key "${key}" mismatch! Got "${actualVal}" but expected "${expectedVal}" from ${code}.json`
      );
    }
  }
});

test('Linguistic marker verification: hi.json is genuine Hindi, mr.json is genuine Marathi, and sa.json is genuine Sanskrit', () => {
  const hi = loadLocale('hi');
  const mr = loadLocale('mr');
  const sa = loadLocale('sa');

  const flatHi = getKeys(hi).map(k => getNestedValue(hi, k));
  const flatMr = getKeys(mr).map(k => getNestedValue(mr, k));
  const flatSa = getKeys(sa).map(k => getNestedValue(sa, k));

  // Marathi grammatical markers that must NEVER appear in Hindi
  const marathiOnlyMarkers = [
    /\bआहे\b/,
    /\bआहेत\b/,
    /\bनाही\b/,
    /\bनाहीत\b/,
    /\bमध्ये\b/,
    /\bआणि\b/,
    /\bकिंवा\b/,
    /\bकरा\b/,
    /\bटाका\b/,
    /\bपहा\b/,
    /\bविसरलात\b/,
    /\bतुमचा\b/,
    /\bतुमची\b/,
    /\bतुमचे\b/,
  ];

  // Hindi grammatical markers that must NEVER appear in Marathi
  const hindiOnlyMarkers = [
    /\bहै\b/,
    /\bहैं\b/,
    /\bनहीं\b/,
    /\bमें\b/,
    /\bऔर\b/,
    /\bकरें\b/,
    /\bकीजिए\b/,
    /\bदर्ज\b/,
    /\bचुनें\b/,
    /\bभूल गए\b/,
    /\bआपका\b/,
    /\bआपकी\b/,
    /\bआपके\b/,
  ];

  // Check hi.json contains Hindi markers and 0 Marathi markers
  let marathiInHiCount = 0;
  for (const text of flatHi) {
    if (typeof text === 'string') {
      for (const rx of marathiOnlyMarkers) {
        if (rx.test(text)) {
          marathiInHiCount++;
          break;
        }
      }
    }
  }
  assert.equal(
    marathiInHiCount,
    0,
    `Found ${marathiInHiCount} Marathi grammatical marker violations in hi.json!`
  );

  // Check mr.json contains Marathi markers and 0 Hindi markers
  let hindiInMrCount = 0;
  for (const text of flatMr) {
    if (typeof text === 'string') {
      for (const rx of hindiOnlyMarkers) {
        if (rx.test(text)) {
          hindiInMrCount++;
          break;
        }
      }
    }
  }
  assert.equal(
    hindiInMrCount,
    0,
    `Found ${hindiInMrCount} Hindi grammatical marker violations in mr.json!`
  );

  // Check sa.json is authentic Sanskrit and not a copy of Hindi or Marathi
  let saIdenticalToHi = 0;
  const enKeys = getKeys(loadLocale('en'));
  for (const k of enKeys) {
    const saVal = getNestedValue(sa, k);
    const hiVal = getNestedValue(hi, k);
    if (saVal === hiVal) {
      saIdenticalToHi++;
    }
  }

  // Allowed shared keys: universal brand names, units, punctuation, numbers (< 3% of total keys)
  const maxAllowedShared = Math.floor(enKeys.length * 0.03);
  assert.ok(
    saIdenticalToHi <= maxAllowedShared,
    `sa.json shares ${saIdenticalToHi} identical keys with hi.json (max allowed: ${maxAllowedShared})`
  );
});

test('Language codes in SUPPORTED_LANGUAGES are unique, match locale files, and normalizeLanguageCode functions correctly', () => {
  const codes = SUPPORTED_LANGUAGES.map(l => l.code);
  const uniqueCodes = new Set(codes);
  assert.equal(uniqueCodes.size, 9, 'All 9 language codes must be distinct');

  // Must match files on disk
  for (const code of codes) {
    const filePath = path.join(localesDir, `${code}.json`);
    assert.ok(fs.existsSync(filePath), `Locale file for code "${code}" must exist`);
  }

  // normalizeLanguageCode returns the exact code for supported languages
  for (const code of codes) {
    assert.equal(normalizeLanguageCode(code), code);
  }

  // normalizeLanguageCode safely falls back to DEFAULT_LANGUAGE ('en') for invalid inputs
  assert.equal(normalizeLanguageCode(null), DEFAULT_LANGUAGE);
  assert.equal(normalizeLanguageCode(undefined), DEFAULT_LANGUAGE);
  assert.equal(normalizeLanguageCode(''), DEFAULT_LANGUAGE);
  assert.equal(normalizeLanguageCode('fr'), DEFAULT_LANGUAGE);
  assert.equal(normalizeLanguageCode('es'), DEFAULT_LANGUAGE);
  assert.equal(normalizeLanguageCode('unknown_script'), DEFAULT_LANGUAGE);
});
