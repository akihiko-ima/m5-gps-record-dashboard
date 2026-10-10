// M5 GPS レコーダー
//
// GPS の位置情報を10秒ごとに microSD の /tracks/YYYYMMDD_HHMMSS.csv に記録する。
// 仕様: docs/ideas/m5-recorder-spec.md

#include <M5Unified.h>

#include "src/core/Clock.h"
#include "src/core/CsvFormatter.h"
#include "src/core/FileListPager.h"
#include "src/core/RecorderStateMachine.h"
#include "src/core/TimeUtil.h"
#include "src/hw/GpsReader.h"
#include "src/hw/RecorderDisplay.h"
#include "src/hw/TrackStorage.h"

namespace {

constexpr uint32_t kRecordIntervalMs = 10000;
constexpr uint32_t kDisplayRefreshMs = 1000;

GpsReader gps;
TrackStorage storage;
RecorderDisplay display;
Clock gpsClock;
RecorderStateMachine machine;
FileListPager pager;

// 記録中の情報
std::string recordingFileName;
uint32_t recordCount = 0;
uint32_t recordStartMs = 0;
uint32_t lastRecordMs = 0;

uint32_t lastRenderMs = 0;

// 記録を開始できる状態か。ファイル名と timestamp に UTC が必要なため、時計の同期も条件にする
bool canRecord() { return gps.hasFix() && gpsClock.isSynced(); }

void handleEvent(RecorderEvent event);

void render() {
  ScreenData data;
  data.state = machine.state();
  data.gps = gps.sample();
  data.clockSynced = gpsClock.isSynced();
  data.utcNow = gpsClock.now(millis());
  data.recordingFileName = recordingFileName;
  data.recordCount = recordCount;
  data.elapsedSeconds = (millis() - recordStartMs) / 1000;
  data.pager = &pager;
  display.render(data);
  lastRenderMs = millis();
}

void writeRow() {
  const std::string line = csv::row(gpsClock.now(millis()), gps.sample());
  if (!storage.append(line)) {
    handleEvent(RecorderEvent::SdFailed);
    return;
  }
  ++recordCount;
}

void startRecording() {
  const uint32_t now = millis();
  recordingFileName = timeutil::formatTrackFileName(gpsClock.now(now));
  if (!storage.open(recordingFileName)) {
    handleEvent(RecorderEvent::SdFailed);
    return;
  }
  recordCount = 0;
  recordStartMs = now;
  lastRecordMs = now;
  writeRow();  // 開始直後に1行目を記録する
}

void handleEvent(RecorderEvent event) {
  switch (machine.handle(event, canRecord())) {
    case RecorderAction::StartRecording:
      startRecording();
      break;
    case RecorderAction::StopRecording:
    case RecorderAction::AbortRecording:
      storage.close();
      break;
    case RecorderAction::OpenFileList:
      pager = FileListPager(storage.listFiles(), RecorderDisplay::kFilesPerPage);
      break;
    case RecorderAction::NextPage:
      pager.nextPage();
      break;
    case RecorderAction::None:
      break;
  }
  render();
}

}  // namespace

void setup() {
  auto config = M5.config();
  M5.begin(config);
  display.begin();
  gps.begin();
  if (!storage.begin()) {
    handleEvent(RecorderEvent::SdFailed);
  }
  render();
}

void loop() {
  M5.update();
  gps.update(gpsClock);

  if (M5.BtnA.wasPressed()) handleEvent(RecorderEvent::ButtonA);
  if (M5.BtnB.wasPressed()) handleEvent(RecorderEvent::ButtonB);
  if (M5.BtnC.wasPressed()) handleEvent(RecorderEvent::ButtonC);

  if (machine.state() == RecorderState::Recording &&
      millis() - lastRecordMs >= kRecordIntervalMs) {
    // 基準時刻を間隔ぶん進めて、書き込み時間による記録間隔のずれを防ぐ
    lastRecordMs += kRecordIntervalMs;
    writeRow();
  }

  if (millis() - lastRenderMs >= kDisplayRefreshMs) {
    render();
  }

  // NMEA の受信バッファがあふれないよう、長くブロックしない
  delay(1);
}
