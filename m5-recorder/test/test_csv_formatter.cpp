#include "CsvFormatter.h"
#include "TestRunner.h"

namespace {

GpsSample fixedSample() {
  GpsSample s;
  s.hasFix = true;
  s.latitude = 35.658636;
  s.longitude = 139.745407;
  s.altitudeValid = true;
  s.altitudeM = 12.34;
  s.speedValid = true;
  s.speedKmh = 42.5;
  s.satellitesValid = true;
  s.satellites = 9;
  s.hdopValid = true;
  s.hdop = 0.92;
  return s;
}

}  // namespace

TEST(csv_header_matches_spec) {
  EXPECT_EQ(std::string(
                "timestamp,latitude,longitude,altitude_m,speed_kmh,satellites,"
                "hdop\n"),
            csv::header());
}

TEST(csv_row_with_fix) {
  EXPECT_EQ(std::string("2026-10-11T01:23:40Z,35.658636,139.745407,12.3,42.5,9,"
                        "0.9\n"),
            csv::row(1791681820, fixedSample()));
}

TEST(csv_row_without_fix_has_only_timestamp) {
  GpsSample s = fixedSample();
  s.hasFix = false;
  EXPECT_EQ(std::string("2026-10-11T01:24:00Z,,,,,,\n"),
            csv::row(1791681840, s));
}

TEST(csv_row_with_fix_leaves_invalid_fields_blank) {
  GpsSample s = fixedSample();
  s.altitudeValid = false;
  s.hdopValid = false;
  EXPECT_EQ(std::string("2026-10-11T01:23:40Z,35.658636,139.745407,,42.5,9,\n"),
            csv::row(1791681820, s));
}

TEST(csv_row_with_negative_coordinates) {
  GpsSample s = fixedSample();
  s.latitude = -33.868820;
  s.longitude = -151.209296;
  EXPECT_EQ(std::string("2026-10-11T01:23:40Z,-33.868820,-151.209296,12.3,42.5,"
                        "9,0.9\n"),
            csv::row(1791681820, s));
}
