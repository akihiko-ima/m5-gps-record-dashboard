#include "TimeUtil.h"

#include <cstdio>

namespace timeutil {

namespace {

// Howard Hinnant の days_from_civil / civil_from_days アルゴリズム
int64_t daysFromCivil(int64_t y, unsigned m, unsigned d) {
  y -= m <= 2;
  const int64_t era = (y >= 0 ? y : y - 399) / 400;
  const unsigned yoe = static_cast<unsigned>(y - era * 400);
  const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return era * 146097 + static_cast<int64_t>(doe) - 719468;
}

void civilFromDays(int64_t z, int& year, int& month, int& day) {
  z += 719468;
  const int64_t era = (z >= 0 ? z : z - 146096) / 146097;
  const unsigned doe = static_cast<unsigned>(z - era * 146097);
  const unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  const unsigned mp = (5 * doy + 2) / 153;
  const unsigned d = doy - (153 * mp + 2) / 5 + 1;
  const unsigned m = mp < 10 ? mp + 3 : mp - 9;
  year = static_cast<int>(static_cast<int64_t>(yoe) + era * 400 + (m <= 2));
  month = static_cast<int>(m);
  day = static_cast<int>(d);
}

constexpr int64_t kSecondsPerDay = 86400;

}  // namespace

int64_t toUnixTime(const DateTime& dt) {
  const int64_t days = daysFromCivil(dt.year, static_cast<unsigned>(dt.month),
                                     static_cast<unsigned>(dt.day));
  return days * kSecondsPerDay + dt.hour * 3600 + dt.minute * 60 + dt.second;
}

DateTime fromUnixTime(int64_t unixTime) {
  int64_t days = unixTime / kSecondsPerDay;
  int64_t secondsOfDay = unixTime % kSecondsPerDay;
  if (secondsOfDay < 0) {
    secondsOfDay += kSecondsPerDay;
    --days;
  }
  DateTime dt{};
  civilFromDays(days, dt.year, dt.month, dt.day);
  dt.hour = static_cast<int>(secondsOfDay / 3600);
  dt.minute = static_cast<int>(secondsOfDay % 3600 / 60);
  dt.second = static_cast<int>(secondsOfDay % 60);
  return dt;
}

std::string formatIso8601(int64_t unixTime) {
  const DateTime dt = fromUnixTime(unixTime);
  char buf[32];
  snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02dZ", dt.year,
           dt.month, dt.day, dt.hour, dt.minute, dt.second);
  return buf;
}

std::string formatTrackFileName(int64_t unixTime) {
  const DateTime dt = fromUnixTime(unixTime);
  char buf[32];
  snprintf(buf, sizeof(buf), "%04d%02d%02d_%02d%02d%02d.csv", dt.year, dt.month,
           dt.day, dt.hour, dt.minute, dt.second);
  return buf;
}

}  // namespace timeutil
