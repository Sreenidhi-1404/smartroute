/**
 * Lightweight JUnit 5 (Jupiter) style testing engine and assertion library
 * Designed to execute both in Node.js (via CLI / npm test) and inside the browser UI.
 */

export interface TestCaseResult {
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
  assertionsCount: number;
}

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  totalDurationMs: number;
  totalAssertions: number;
  results: TestCaseResult[];
  timestamp: string;
}

// JUnit Assertion Exception
export class AssertionFailedError extends Error {
  constructor(message: string, public expected?: any, public actual?: any) {
    super(message);
    this.name = 'AssertionFailedError';
  }
}

// Global assertion counter for the currently running test
let currentAssertionCount = 0;

export const Assert = {
  assertEquals<T>(expected: T, actual: T, message?: string): void {
    currentAssertionCount++;
    if (expected !== actual) {
      const msg = message
        ? `${message} - Expected: <${String(expected)}>, but was: <${String(actual)}>`
        : `Expected: <${String(expected)}>, but was: <${String(actual)}>`;
      throw new AssertionFailedError(msg, expected, actual);
    }
  },

  assertNotEquals<T>(unexpected: T, actual: T, message?: string): void {
    currentAssertionCount++;
    if (unexpected === actual) {
      const msg = message
        ? `${message} - Expected not equal to: <${String(unexpected)}>`
        : `Expected not equal to: <${String(unexpected)}>`;
      throw new AssertionFailedError(msg, unexpected, actual);
    }
  },

  assertTrue(condition: boolean, message?: string): void {
    currentAssertionCount++;
    if (condition !== true) {
      throw new AssertionFailedError(message || 'Expected condition to be true, but was false', true, false);
    }
  },

  assertFalse(condition: boolean, message?: string): void {
    currentAssertionCount++;
    if (condition !== false) {
      throw new AssertionFailedError(message || 'Expected condition to be false, but was true', false, true);
    }
  },

  assertNotNull(object: any, message?: string): void {
    currentAssertionCount++;
    if (object === null || object === undefined) {
      throw new AssertionFailedError(message || 'Expected non-null object, but was null/undefined', 'non-null', object);
    }
  },

  assertNull(object: any, message?: string): void {
    currentAssertionCount++;
    if (object !== null && object !== undefined) {
      throw new AssertionFailedError(message || `Expected null, but was: <${String(object)}>`, null, object);
    }
  },

  assertThrows(expectedError: any, block: () => void, message?: string): void {
    currentAssertionCount++;
    let threw = false;
    try {
      block();
    } catch (err: any) {
      threw = true;
      if (expectedError && typeof expectedError === 'function') {
        if (!(err instanceof expectedError)) {
          throw new AssertionFailedError(
            message || `Expected exception of type ${expectedError.name}, but caught ${err?.name || 'unknown error'}`,
            expectedError.name,
            err?.name
          );
        }
      }
    }
    if (!threw) {
      throw new AssertionFailedError(message || 'Expected block to throw exception, but it completed normally');
    }
  },
};

export type TestFn = () => void | Promise<void>;

export interface TestDefinition {
  name: string;
  description: string;
  fn: TestFn;
}

export class JUnitTestSuite {
  private tests: TestDefinition[] = [];
  private beforeEachFns: (() => void | Promise<void>)[] = [];

  constructor(public readonly name: string) {}

  public beforeEach(fn: () => void | Promise<void>): this {
    this.beforeEachFns.push(fn);
    return this;
  }

  public test(name: string, description: string, fn: TestFn): this {
    this.tests.push({ name, description, fn });
    return this;
  }

  public getTestDefinitions(): TestDefinition[] {
    return [...this.tests];
  }

  public async run(): Promise<TestSuiteResult> {
    const results: TestCaseResult[] = [];
    const suiteStart = Date.now();
    let totalAssertions = 0;

    for (const t of this.tests) {
      currentAssertionCount = 0;
      const testStart = performance.now();
      let status: 'passed' | 'failed' | 'skipped' = 'passed';
      let errorMsg: string | undefined;

      try {
        for (const hook of this.beforeEachFns) {
          await hook();
        }
        await t.fn();
      } catch (err: any) {
        status = 'failed';
        errorMsg = err instanceof Error ? err.message : String(err);
      }

      const testDuration = Math.round(performance.now() - testStart);
      totalAssertions += currentAssertionCount;

      results.push({
        name: t.name,
        description: t.description,
        status,
        durationMs: Math.max(testDuration, 1),
        error: errorMsg,
        assertionsCount: currentAssertionCount,
      });
    }

    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const totalDurationMs = Date.now() - suiteStart;

    return {
      suiteName: this.name,
      totalTests: results.length,
      passed,
      failed,
      skipped,
      totalDurationMs,
      totalAssertions,
      results,
      timestamp: new Date().toISOString(),
    };
  }
}
