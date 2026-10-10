// GPS ユニット（UART / NMEA）から位置情報を読み取る
#pragma once

#include <TinyGPSPlus.h>

#include "../core/Clock.h"
#include "../core/GpsSample.h"

class GpsReader {
 public:
  void begin();

  // 受信済みの NMEA を解析する。loop() から毎回呼ぶこと
  // 測位中は GPS の時刻で clock を同期する
  void update(Clock& clock);

  // 位置を捕捉できているか（最新の位置情報が一定時間内に更新されているか）
  bool hasFix();

  GpsSample sample();

 private:
  TinyGPSPlus gps_;
};
