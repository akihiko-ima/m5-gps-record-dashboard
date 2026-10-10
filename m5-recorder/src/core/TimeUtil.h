// UTC の日時と UNIX 時刻（秒）の変換、および文字列化
#pragma once

#include <cstdint>
#include <string>

namespace timeutil {

struct DateTime {
  int year;
  int month;   // 1-12
  int day;     // 1-31
  int hour;    // 0-23
  int minute;  // 0-59
  int second;  // 0-59
};

// UTC の日時を UNIX 時刻（1970-01-01T00:00:00Z からの秒数）に変換する
int64_t toUnixTime(const DateTime& dt);

// UNIX 時刻を UTC の日時に変換する
DateTime fromUnixTime(int64_t unixTime);

// 例: "2026-10-11T01:23:40Z"
std::string formatIso8601(int64_t unixTime);

// 記録ファイル名。例: "20261011_012340.csv"
std::string formatTrackFileName(int64_t unixTime);

}  // namespace timeutil
