// microSD の /tracks ディレクトリへの記録ファイルの読み書き
#pragma once

#include <FS.h>

#include <string>
#include <vector>

#include "../core/FileListPager.h"

class TrackStorage {
 public:
  // SD カードを初期化し、/tracks がなければ作成する
  bool begin();

  // 記録ファイルを新規作成してヘッダー行を書き込む
  bool open(const std::string& fileName);

  // 1行を追記し、電源断に備えて毎回フラッシュする
  bool append(const std::string& line);

  void close();

  // /tracks 内の .csv ファイルの一覧（並び順は未定義）
  std::vector<FileEntry> listFiles();

 private:
  fs::File file_;
};
