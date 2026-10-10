#include "GpsReader.h"

#include <Arduino.h>
#include <M5Unified.h>

#include "../core/TimeUtil.h"

namespace {

// GPS ユニット v1.1 を本体側面の Grove ポート（Port A）に接続する
// Port C（M5GO ボトム）に接続する場合は RX: 16 / TX: 17 にする
constexpr int kGpsRxPin = 22;
constexpr int kGpsTxPin = 21;
constexpr uint32_t kGpsBaudRate = 115200;

// この時間以上更新がない値は無効とみなす
constexpr uint32_t kMaxDataAgeMs = 3000;

}  // namespace

void GpsReader::begin() {
  // Port A は内部 I2C（電源 IC）と同じピンのため、M5.begin() が初期化した I2C を解放してから UART に割り当てる
  M5.In_I2C.release();
  Serial2.begin(kGpsBaudRate, SERIAL_8N1, kGpsRxPin, kGpsTxPin);
}

void GpsReader::update(Clock& clock) {
  while (Serial2.available() > 0) {
    gps_.encode(Serial2.read());
  }

  // 未測位時のモジュール内部時刻は不正確な場合があるため、測位中のみ同期する
  if (hasFix() && gps_.time.isUpdated() && gps_.date.isValid() &&
      gps_.time.isValid()) {
    const timeutil::DateTime dt{gps_.date.year(),  gps_.date.month(),
                                gps_.date.day(),   gps_.time.hour(),
                                gps_.time.minute(), gps_.time.second()};
    // 受信からの経過時間を差し引き、その時刻を受信した時点の millis() を基準にする
    clock.sync(timeutil::toUnixTime(dt), millis() - gps_.time.age());
  }
}

bool GpsReader::hasFix() {
  return gps_.location.isValid() && gps_.location.age() < kMaxDataAgeMs;
}

GpsSample GpsReader::sample() {
  GpsSample s;
  s.hasFix = hasFix();
  if (!s.hasFix) {
    return s;
  }
  s.latitude = gps_.location.lat();
  s.longitude = gps_.location.lng();

  s.altitudeValid = gps_.altitude.isValid() && gps_.altitude.age() < kMaxDataAgeMs;
  s.altitudeM = gps_.altitude.meters();

  s.speedValid = gps_.speed.isValid() && gps_.speed.age() < kMaxDataAgeMs;
  s.speedKmh = gps_.speed.kmph();

  s.satellitesValid =
      gps_.satellites.isValid() && gps_.satellites.age() < kMaxDataAgeMs;
  s.satellites = static_cast<int>(gps_.satellites.value());

  s.hdopValid = gps_.hdop.isValid() && gps_.hdop.age() < kMaxDataAgeMs;
  s.hdop = gps_.hdop.hdop();
  return s;
}
