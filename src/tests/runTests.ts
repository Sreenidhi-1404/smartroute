#!/usr/bin/env node
import { studentManagementTestSuite } from './studentManagement.test';

async function main() {
  console.log('\n======================================================================');
  console.log('   SMARTROUTE JUNIT TEST RUNNER (Kovai Valley Matriculation School)   ');
  console.log('======================================================================\n');
  console.log(`[INFO] Initializing JUnit 5 Jupiter Execution Engine...`);
  console.log(`[INFO] Scanning test classes: ${studentManagementTestSuite.name}`);
  console.log(`[INFO] Found ${studentManagementTestSuite.getTestDefinitions().length} test methods.\n`);
  console.log('----------------------------------------------------------------------');
  console.log(`Running Suite: ${studentManagementTestSuite.name}`);
  console.log('----------------------------------------------------------------------\n');

  const suiteStart = Date.now();
  const result = await studentManagementTestSuite.run();
  const totalElapsed = ((Date.now() - suiteStart) / 1000).toFixed(2);

  for (const t of result.results) {
    if (t.status === 'passed') {
      console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${t.name} (${t.durationMs}ms, ${t.assertionsCount} assertions)`);
      console.log(`         \x1b[90m↳ ${t.description}\x1b[0m`);
    } else {
      console.log(`  \x1b[31m✖ [FAIL]\x1b[0m ${t.name} (${t.durationMs}ms)`);
      console.log(`         \x1b[31mError: ${t.error}\x1b[0m`);
    }
  }

  console.log('\n======================================================================');
  console.log('                         TEST RUN SUMMARY                             ');
  console.log('======================================================================');
  console.log(`Tests run: ${result.totalTests}, Passed: \x1b[32m${result.passed}\x1b[0m, Failed: \x1b[31m${result.failed}\x1b[0m, Skipped: ${result.skipped}`);
  console.log(`Total Assertions Evaluated: ${result.totalAssertions}`);
  console.log(`Total Execution Time: ${totalElapsed}s`);

  if (result.failed === 0) {
    console.log('\n\x1b[32m[BUILD SUCCESS] All JUnit tests completed successfully!\x1b[0m\n');
    process.exit(0);
  } else {
    console.log('\n\x1b[31m[BUILD FAILURE] One or more unit tests failed!\x1b[0m\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[FATAL] Test runner encountered an unhandled exception:', err);
  process.exit(1);
});
