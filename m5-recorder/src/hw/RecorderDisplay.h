// M5Stack の画面描画
//
// M5 の標準フォントに日本語が含まれないため、表示はすべて英語にする。
#pragma once

#include <M5Unified.h>

#include <cstdint>
#include <string>

#include "../core/FileListPager.h"
#include "../core/GpsSample.h"
#include "../core/RecorderStateMachine.h"

// 画面に表示する内容
struct ScreenData {
  RecorderState state = RecorderState::Idle;
  GpsSample gps;
  bool clockSynced = false;
  int64_t utcNow = 0;

  // 記録中のみ使用
  std::string recordingFileName;
  uint32_t recordCount = 0;
  uint32_t elapsedSeconds = 0;

  // ファイル一覧表示中のみ使用
  const FileListPager* pager = nullptr;
};

class RecorderDisplay {
 public:
  // ファイル一覧の1ページあたりの表示件数
  static constexpr size_t kFilesPerPage = 7;

  void begin();
  void render(const ScreenData& data);

 private:
  void drawHeader(const ScreenData& data);
  void drawGpsStatus(const ScreenData& data, int y);
  void drawMain(const ScreenData& data);
  void drawFixError(const ScreenData& data);
  void drawFileList(const ScreenData& data);
  void drawSdError();
  void drawButtonLabels(const char* a, const char* b, const char* c);

  M5Canvas canvas_{&M5.Display};
  lgfx::LovyanGFX* gfx_ = &M5.Display;
};
