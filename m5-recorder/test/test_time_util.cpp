#include "TestRunner.h"
#include "TimeUtil.h"

using timeutil::DateTime;

TEST(toUnixTime_epoch_is_zero) {
  EXPECT_EQ(0, timeutil::toUnixTime({1970, 1, 1, 0, 0, 0}));
}

TEST(toUnixTime_matches_known_value) {
  // 2026-10-11T01:23:40Z = 1791681820
  EXPECT_EQ(1791681820, timeutil::toUnixTime({2026, 10, 11, 1, 23, 40}));
}

TEST(toUnixTime_handles_leap_day) {
  // 2024-02-29T00:00:00Z = 1709164800
  EXPECT_EQ(1709164800, timeutil::toUnixTime({2024, 2, 29, 0, 0, 0}));
  // 2024-03-01 は 2/29 の 1日後
  EXPECT_EQ(1709164800 + 86400, timeutil::toUnixTime({2024, 3, 1, 0, 0, 0}));
}

TEST(fromUnixTime_roundtrips) {
  const DateTime dt = timeutil::fromUnixTime(1791681820);
  EXPECT_EQ(2026, dt.year);
  EXPECT_EQ(10, dt.month);
  EXPECT_EQ(11, dt.day);
  EXPECT_EQ(1, dt.hour);
  EXPECT_EQ(23, dt.minute);
  EXPECT_EQ(40, dt.second);
}

TEST(formatIso8601_formats_utc) {
  EXPECT_EQ(std::string("2026-10-11T01:23:40Z"),
            timeutil::formatIso8601(1791681820));
}

TEST(formatIso8601_crosses_year_boundary) {
  const int64_t t = timeutil::toUnixTime({2026, 12, 31, 23, 59, 59});
  EXPECT_EQ(std::string("2027-01-01T00:00:00Z"), timeutil::formatIso8601(t + 1));
}

TEST(formatTrackFileName_uses_compact_format) {
  EXPECT_EQ(std::string("20261011_012340.csv"),
            timeutil::formatTrackFileName(1791681820));
}
