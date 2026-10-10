// ホスト PC 用の簡易テストランナー（外部依存なし）
#pragma once

#include <cmath>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

namespace testing {

struct TestCase {
  std::string name;
  std::function<void()> body;
};

inline std::vector<TestCase>& registry() {
  static std::vector<TestCase> tests;
  return tests;
}

inline int& failureCount() {
  static int count = 0;
  return count;
}

struct Registrar {
  Registrar(const std::string& name, std::function<void()> body) {
    registry().push_back({name, std::move(body)});
  }
};

}  // namespace testing

#define TEST(name)                                                   \
  static void name();                                                \
  static testing::Registrar registrar_##name(#name, name);           \
  static void name()

#define EXPECT_TRUE(cond)                                                     \
  do {                                                                        \
    if (!(cond)) {                                                            \
      std::cerr << "  " << __FILE__ << ":" << __LINE__ << ": EXPECT_TRUE("    \
                << #cond << ") failed\n";                                     \
      ++testing::failureCount();                                              \
    }                                                                         \
  } while (0)

#define EXPECT_FALSE(cond) EXPECT_TRUE(!(cond))

#define EXPECT_EQ(expected, actual)                                           \
  do {                                                                        \
    auto e_ = (expected);                                                     \
    auto a_ = (actual);                                                       \
    if (!(e_ == a_)) {                                                        \
      std::cerr << "  " << __FILE__ << ":" << __LINE__ << ": expected <"      \
                << e_ << "> but was <" << a_ << ">\n";                       \
      ++testing::failureCount();                                              \
    }                                                                         \
  } while (0)
