// 1回分の GPS 取得結果
#pragma once

struct GpsSample {
  // 位置を捕捉できているか。false の場合、CSV では timestamp 以外を空欄にする
  bool hasFix = false;

  double latitude = 0.0;
  double longitude = 0.0;

  // 測位中でも個別に取得できない項目があるため、項目ごとに有効フラグを持つ
  bool altitudeValid = false;
  double altitudeM = 0.0;

  bool speedValid = false;
  double speedKmh = 0.0;

  bool satellitesValid = false;
  int satellites = 0;

  bool hdopValid = false;
  double hdop = 0.0;
};
