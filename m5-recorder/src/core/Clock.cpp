#include "Clock.h"

void Clock::sync(int64_t unixTime, uint32_t millisAtSync) {
  baseUnixMillis_ = unixTime * 1000;
  baseMillis_ = millisAtSync;
  synced_ = true;
}

int64_t Clock::now(uint32_t millisNow) const {
  if (!synced_) {
    return 0;
  }
  // 符号なし減算により millis() のオーバーフロー（約49日）をまたいでも正しく求まる
  const uint32_t elapsed = millisNow - baseMillis_;
  return (baseUnixMillis_ + elapsed) / 1000;
}
