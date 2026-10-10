#include "TrackStorage.h"

#include <SD.h>
#include <SPI.h>

#include "../core/CsvFormatter.h"

namespace {

constexpr const char* kTrackDir = "/tracks";

// M5Stack Basic の microSD スロット
constexpr int kSdCsPin = 4;
constexpr uint32_t kSdSpiFrequency = 25000000;

bool endsWith(const std::string& s, const std::string& suffix) {
  return s.size() >= suffix.size() &&
         s.compare(s.size() - suffix.size(), suffix.size(), suffix) == 0;
}

}  // namespace

bool TrackStorage::begin() {
  if (!SD.begin(kSdCsPin, SPI, kSdSpiFrequency)) {
    return false;
  }
  if (!SD.exists(kTrackDir)) {
    return SD.mkdir(kTrackDir);
  }
  return true;
}

bool TrackStorage::open(const std::string& fileName) {
  const std::string path = std::string(kTrackDir) + "/" + fileName;
  file_ = SD.open(path.c_str(), FILE_WRITE);
  if (!file_) {
    return false;
  }
  return append(csv::header());
}

bool TrackStorage::append(const std::string& line) {
  if (!file_) {
    return false;
  }
  const size_t written = file_.write(
      reinterpret_cast<const uint8_t*>(line.data()), line.size());
  file_.flush();
  return written == line.size();
}

void TrackStorage::close() {
  if (file_) {
    file_.close();
  }
}

std::vector<FileEntry> TrackStorage::listFiles() {
  std::vector<FileEntry> entries;
  fs::File dir = SD.open(kTrackDir);
  if (!dir || !dir.isDirectory()) {
    return entries;
  }
  for (fs::File f = dir.openNextFile(); f; f = dir.openNextFile()) {
    // ボード定義のバージョンによってはフルパスが返るため、ファイル名部分だけを取り出す
    std::string name = f.name();
    const size_t slash = name.rfind('/');
    if (slash != std::string::npos) {
      name = name.substr(slash + 1);
    }
    if (!f.isDirectory() && endsWith(name, ".csv")) {
      entries.push_back({name, static_cast<uint32_t>(f.size())});
    }
    f.close();
  }
  dir.close();
  return entries;
}
