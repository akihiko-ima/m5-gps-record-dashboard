#include "TestRunner.h"

int main() {
  int failedTests = 0;
  for (const auto& test : testing::registry()) {
    const int before = testing::failureCount();
    test.body();
    const bool passed = testing::failureCount() == before;
    if (!passed) {
      ++failedTests;
    }
    std::cout << (passed ? "[PASS] " : "[FAIL] ") << test.name << "\n";
  }
  std::cout << "\n" << testing::registry().size() << " tests, " << failedTests
            << " failed\n";
  return failedTests == 0 ? 0 : 1;
}
