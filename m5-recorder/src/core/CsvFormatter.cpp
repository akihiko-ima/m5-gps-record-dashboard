#include "CsvFormatter.h"

#include <cstdio>

#include "TimeUtil.h"

namespace csv {

namespace {

std::string formatDouble(double value, int precision) {
  char buf[32];
  snprintf(buf, sizeof(buf), "%.*f", precision, value);
  return buf;
}

}  // namespace

std::string header() {
  return "timestamp,latitude,longitude,altitude_m,speed_kmh,satellites,hdop\n";
}

std::string row(int64_t unixTime, const GpsSample& sample) {
  std::string line = timeutil::formatIso8601(unixTime);
  if (!sample.hasFix) {
    return line + ",,,,,,\n";
  }
  line += "," + formatDouble(sample.latitude, 6);
  line += "," + formatDouble(sample.longitude, 6);
  line += ",";
  if (sample.altitudeValid) line += formatDouble(sample.altitudeM, 1);
  line += ",";
  if (sample.speedValid) line += formatDouble(sample.speedKmh, 1);
  line += ",";
  if (sample.satellitesValid) line += std::to_string(sample.satellites);
  line += ",";
  if (sample.hdopValid) line += formatDouble(sample.hdop, 1);
  return line + "\n";
}

}  // namespace csv
