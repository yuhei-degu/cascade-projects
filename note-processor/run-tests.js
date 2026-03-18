#!/usr/bin/env node
/**
 * Minimal test runner — zero external dependencies.
 * Uses Node.js built-in `assert` only.
 *
 * API mirrors Jest: describe(), test(), expect() with:
 *   .toBe / .toEqual / .toContain / .toHaveLength
 *   .toHaveProperty / .toMatch / .toBeGreaterThan
 *   .toBeLessThanOrEqual / .toBeTruthy / .not.*
 *   expect(fn).not.toThrow() / .toThrow()
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

let passed = 0;
let failed = 0;
const failures = [];
let currentSuite = '';

function describe(label, fn) {
  currentSuite = label;
  fn();
  currentSuite = '';
}

function test(label, fn) {
  const name = currentSuite ? `${currentSuite} > ${label}` : label;
  try {
    fn();
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${label}\n`);
    passed++;
  } catch (err) {
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${label}\n`);
    failures.push({ name, message: err.message });
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected,
        `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected,
        `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    },
    toContain(item) {
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(item),
          `Expected array to contain ${JSON.stringify(item)}, got ${JSON.stringify(actual)}`);
      } else {
        assert.ok(String(actual).includes(item),
          `Expected "${actual}" to contain "${item}"`);
      }
    },
    toHaveLength(n) {
      assert.strictEqual(actual.length, n,
        `Expected length ${n}, got ${actual.length}`);
    },
    toHaveProperty(key) {
      assert.ok(Object.prototype.hasOwnProperty.call(actual, key),
        `Expected object to have property "${key}"`);
    },
    toMatch(pattern) {
      assert.ok(pattern.test ? pattern.test(actual) : String(actual).includes(pattern),
        `Expected "${actual}" to match ${pattern}`);
    },
    toBeGreaterThan(n) {
      assert.ok(actual > n, `Expected ${actual} > ${n}`);
    },
    toBeLessThanOrEqual(n) {
      assert.ok(actual <= n, `Expected ${actual} <= ${n}`);
    },
    toBeTruthy() {
      assert.ok(actual, `Expected truthy value, got ${actual}`);
    },
    not: {
      toThrow() {
        assert.doesNotThrow(actual,
          `Expected function not to throw, but it did`);
      },
      toEqual(expected) {
        assert.notDeepStrictEqual(actual, expected,
          `Expected values to differ`);
      },
      toMatch(pattern) {
        const str = String(actual);
        const matches = pattern.test ? pattern.test(str) : str.includes(pattern);
        assert.ok(!matches, `Expected "${actual}" NOT to match ${pattern}`);
      },
    },
  };
}

// Make globals available for test files
global.describe = describe;
global.test     = test;
global.expect   = expect;
global.beforeEach = (fn) => { global.__beforeEach = fn; };
global.afterEach  = (fn) => { global.__afterEach  = fn; };

// Patch test() to run lifecycle hooks
const _test = test;
global.test = function(label, fn) {
  _test(label, () => {
    if (global.__beforeEach) global.__beforeEach();
    try { fn(); }
    finally { if (global.__afterEach) global.__afterEach(); }
  });
};

// ── Discover and run test files ──────────────────────────────────────────────

const testDir = path.join(__dirname, '__tests__');
const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.js'))
  .sort();

for (const file of files) {
  console.log(`\n\x1b[1m${file}\x1b[0m`);
  global.__beforeEach = null;
  global.__afterEach  = null;
  try {
    require(path.join(testDir, file));
  } catch (err) {
    console.log(`  \x1b[33m⚠ skipped — ${err.message.split("\n")[0]}\x1b[0m`);
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));

if (failures.length > 0) {
  console.log('\n\x1b[31mFailed tests:\x1b[0m');
  failures.forEach(({ name, message }) => {
    console.log(`  ✗ ${name}`);
    console.log(`    ${message}`);
  });
}

console.log(
  `\n\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m` +
  (failed ? `, \x1b[31m${failed} failed\x1b[0m` : '') +
  ` / ${passed + failed} total\n`
);

process.exit(failed > 0 ? 1 : 0);
