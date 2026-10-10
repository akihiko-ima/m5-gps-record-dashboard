#include "Clock.h"
#include "TestRunner.h"

TEST(clock_is_not_synced_initially) {
  Clock clock;
  EXPECT_FALSE(clock.isSynced());
  EXPECT_EQ(0, clock.now(12345));
}

TEST(clock_returns_synced_time) {
  Clock clock;
  clock.sync(1791681820, 5000);
  EXPECT_TRUE(clock.isSynced());
  EXPECT_EQ(1791681820, clock.now(5000));
}

TEST(clock_adds_elapsed_time) {
  Clock clock;
  clock.sync(1791681820, 5000);
  EXPECT_EQ(1791681820, clock.now(5999));
  EXPECT_EQ(1791681821, clock.now(6000));
  EXPECT_EQ(1791681830, clock.now(15000));
}

TEST(clock_handles_millis_overflow) {
  Clock clock;
  clock.sync(1791681820, 0xFFFFF000u);  // オーバーフローの 4096ms 前
  EXPECT_EQ(1791681830, clock.now(0xFFFFF000u + 10000u));  // 折り返し後
}

TEST(clock_resync_replaces_base) {
  Clock clock;
  clock.sync(1791681820, 5000);
  clock.sync(1791681900, 90000);
  EXPECT_EQ(1791681910, clock.now(100000));
}
