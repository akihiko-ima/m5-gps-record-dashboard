// GPS の時刻を基準に、本体の経過時間（millis）から現在の UTC を求める時計
//
// M5Stack Basic にはバックアップ電池付きの RTC がないため、測位中は GPS の
// 時刻で同期し続け、未測位の間は最後に同期した時刻からの経過時間で補う。
#pragma once

#include <cstdint>

class Clock {
 public:
  // unixTime: GPS から得た UTC（UNIX 秒）
  // millisAtSync: その時刻を受信したときの millis() の値
  void sync(int64_t unixTime, uint32_t millisAtSync);

  bool isSynced() const { return synced_; }

  // 現在の UTC（UNIX 秒）。isSynced() が false の場合は 0 を返す
  int64_t now(uint32_t millisNow) const;

 private:
  bool synced_ = false;
  int64_t baseUnixMillis_ = 0;
  uint32_t baseMillis_ = 0;
};
