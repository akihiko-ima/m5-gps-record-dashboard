#include "RecorderDisplay.h"

#include "../core/TimeUtil.h"

namespace {

constexpr int kScreenWidth = 320;
constexpr int kScreenHeight = 240;
constexpr int kHeaderHeight = 32;
constexpr int kFooterHeight = 24;
constexpr int kMargin = 8;
constexpr int kLineHeight = 22;

// M5Stack Basic のボタンA/B/Cの位置（画面下の中心X座標）
constexpr int kButtonCenterX[3] = {65, 160, 255};

std::string formatElapsed(uint32_t seconds) {
  char buf[16];
  snprintf(buf, sizeof(buf), "%02lu:%02lu:%02lu",
           static_cast<unsigned long>(seconds / 3600),
           static_cast<unsigned long>(seconds % 3600 / 60),
           static_cast<unsigned long>(seconds % 60));
  return buf;
}

std::string formatSize(uint32_t bytes) {
  char buf[16];
  if (bytes < 1024) {
    snprintf(buf, sizeof(buf), "%luB", static_cast<unsigned long>(bytes));
  } else {
    snprintf(buf, sizeof(buf), "%.1fKB", bytes / 1024.0);
  }
  return buf;
}

}  // namespace

void RecorderDisplay::begin() {
  M5.Display.setRotation(1);
  // 8bit カラーの全画面キャンバス（約77KB）に描画してから転送し、ちらつきを防ぐ。
  // メモリ確保に失敗した場合は画面へ直接描画する
  canvas_.setColorDepth(8);
  if (canvas_.createSprite(kScreenWidth, kScreenHeight) != nullptr) {
    gfx_ = &canvas_;
  }
  gfx_->setTextFont(2);
}

void RecorderDisplay::render(const ScreenData& data) {
  gfx_->fillScreen(TFT_BLACK);
  drawHeader(data);

  switch (data.state) {
    case RecorderState::Idle:
      drawMain(data);
      drawButtonLabels("START", "FILES", "");
      break;
    case RecorderState::Recording:
      drawMain(data);
      drawButtonLabels("STOP", "", "");
      break;
    case RecorderState::FixError:
      drawFixError(data);
      drawButtonLabels("RETRY", "FILES", "");
      break;
    case RecorderState::FileList:
      drawFileList(data);
      drawButtonLabels("", "BACK", "NEXT");
      break;
    case RecorderState::SdError:
      drawSdError();
      drawButtonLabels("", "", "");
      break;
  }

  if (gfx_ == &canvas_) {
    canvas_.pushSprite(0, 0);
  }
}

void RecorderDisplay::drawHeader(const ScreenData& data) {
  const char* title = "";
  uint16_t color = TFT_DARKGREY;
  switch (data.state) {
    case RecorderState::Idle:
      title = "IDLE";
      color = TFT_DARKGREY;
      break;
    case RecorderState::Recording:
      title = "RECORDING";
      color = TFT_RED;
      break;
    case RecorderState::FixError:
      title = "GPS FIX ERROR";
      color = TFT_ORANGE;
      break;
    case RecorderState::FileList:
      title = "SAVED FILES";
      color = TFT_BLUE;
      break;
    case RecorderState::SdError:
      title = "SD CARD ERROR";
      color = TFT_RED;
      break;
  }
  gfx_->fillRect(0, 0, kScreenWidth, kHeaderHeight, color);
  gfx_->setTextColor(TFT_WHITE, color);
  gfx_->setTextSize(1.5);
  gfx_->setCursor(kMargin, 6);
  gfx_->print(title);

  if (data.clockSynced) {
    // 右上に UTC の時刻（HH:MM:SS）を表示
    const std::string iso = timeutil::formatIso8601(data.utcNow);
    gfx_->setTextSize(1);
    gfx_->setCursor(kScreenWidth - 90, 9);
    gfx_->printf("%s UTC", iso.substr(11, 8).c_str());
  }
  gfx_->setTextSize(1);
}

void RecorderDisplay::drawGpsStatus(const ScreenData& data, int y) {
  const GpsSample& g = data.gps;
  gfx_->setCursor(kMargin, y);
  gfx_->setTextColor(TFT_WHITE, TFT_BLACK);
  gfx_->print("GPS: ");
  gfx_->setTextColor(g.hasFix ? TFT_GREEN : TFT_ORANGE, TFT_BLACK);
  gfx_->print(g.hasFix ? "FIX" : "NO FIX");
  gfx_->setTextColor(TFT_WHITE, TFT_BLACK);
  if (g.satellitesValid) {
    gfx_->printf("   Sats: %d", g.satellites);
  }
  if (g.hdopValid) {
    gfx_->printf("   HDOP: %.1f", g.hdop);
  }

  gfx_->setCursor(kMargin, y + kLineHeight);
  if (g.hasFix) {
    gfx_->printf("Lat: %.6f", g.latitude);
    gfx_->setCursor(kMargin, y + kLineHeight * 2);
    gfx_->printf("Lon: %.6f", g.longitude);
  } else {
    gfx_->print("Lat: ---");
    gfx_->setCursor(kMargin, y + kLineHeight * 2);
    gfx_->print("Lon: ---");
  }
}

void RecorderDisplay::drawMain(const ScreenData& data) {
  int y = kHeaderHeight + kMargin;
  drawGpsStatus(data, y);
  y += kLineHeight * 3 + kMargin;

  gfx_->setTextColor(TFT_WHITE, TFT_BLACK);
  if (data.state == RecorderState::Recording) {
    gfx_->setCursor(kMargin, y);
    gfx_->printf("File: %s", data.recordingFileName.c_str());
    gfx_->setCursor(kMargin, y + kLineHeight);
    gfx_->printf("Rows: %lu", static_cast<unsigned long>(data.recordCount));
    gfx_->setCursor(kMargin, y + kLineHeight * 2);
    gfx_->printf("Time: %s", formatElapsed(data.elapsedSeconds).c_str());
  } else {
    gfx_->setCursor(kMargin, y);
    gfx_->print("Press A to start recording.");
  }
}

void RecorderDisplay::drawFixError(const ScreenData& data) {
  int y = kHeaderHeight + kMargin;
  gfx_->setTextColor(TFT_ORANGE, TFT_BLACK);
  gfx_->setCursor(kMargin, y);
  gfx_->print("No GPS fix. Recording was not started.");
  gfx_->setTextColor(TFT_WHITE, TFT_BLACK);
  gfx_->setCursor(kMargin, y + kLineHeight);
  gfx_->print("Move to a place with open sky,");
  gfx_->setCursor(kMargin, y + kLineHeight * 2);
  gfx_->print("then press A to retry.");
  drawGpsStatus(data, y + kLineHeight * 3 + kMargin);
}

void RecorderDisplay::drawFileList(const ScreenData& data) {
  const int y = kHeaderHeight + kMargin;
  gfx_->setTextColor(TFT_WHITE, TFT_BLACK);
  const FileListPager* pager = data.pager;
  if (pager == nullptr || pager->entries().empty()) {
    gfx_->setCursor(kMargin, y);
    gfx_->print("No saved files.");
    return;
  }

  gfx_->setCursor(kMargin, y);
  gfx_->printf("%u files   page %u/%u",
               static_cast<unsigned>(pager->entries().size()),
               static_cast<unsigned>(pager->currentPage() + 1),
               static_cast<unsigned>(pager->pageCount()));

  int rowY = y + kLineHeight;
  for (size_t i = pager->pageBegin(); i < pager->pageEnd(); ++i) {
    const FileEntry& e = pager->entries()[i];
    gfx_->setCursor(kMargin, rowY);
    gfx_->print(e.name.c_str());
    gfx_->setCursor(kScreenWidth - 80, rowY);
    gfx_->print(formatSize(e.sizeBytes).c_str());
    rowY += kLineHeight;
  }
}

void RecorderDisplay::drawSdError() {
  const int y = kHeaderHeight + kMargin;
  gfx_->setTextColor(TFT_RED, TFT_BLACK);
  gfx_->setCursor(kMargin, y);
  gfx_->print("Cannot access the microSD card.");
  gfx_->setTextColor(TFT_WHITE, TFT_BLACK);
  gfx_->setCursor(kMargin, y + kLineHeight);
  gfx_->print("Check the card, then restart the device.");
}

void RecorderDisplay::drawButtonLabels(const char* a, const char* b,
                                       const char* c) {
  const int y = kScreenHeight - kFooterHeight;
  gfx_->fillRect(0, y, kScreenWidth, kFooterHeight, TFT_NAVY);
  gfx_->setTextColor(TFT_WHITE, TFT_NAVY);
  gfx_->setTextDatum(top_center);
  const char* labels[3] = {a, b, c};
  for (int i = 0; i < 3; ++i) {
    gfx_->drawString(labels[i], kButtonCenterX[i], y + 4);
  }
  gfx_->setTextDatum(top_left);
}
