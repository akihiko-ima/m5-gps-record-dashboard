// 保存済みファイル一覧の並び替えとページ分割
#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

struct FileEntry {
  std::string name;
  uint32_t sizeBytes;
};

class FileListPager {
 public:
  FileListPager() = default;

  // ファイル名（= 記録開始日時）の降順、つまり新しい順に並べ替えて保持する
  FileListPager(std::vector<FileEntry> entries, size_t itemsPerPage);

  const std::vector<FileEntry>& entries() const { return entries_; }

  // ファイルが 0 件でも 1 を返す（空のページを1枚表示するため）
  size_t pageCount() const;
  size_t currentPage() const { return currentPage_; }

  // 現在のページに表示する要素の範囲 [first, last)
  size_t pageBegin() const;
  size_t pageEnd() const;

  // 次のページへ。最終ページの次は先頭に戻る
  void nextPage();

 private:
  std::vector<FileEntry> entries_;
  size_t itemsPerPage_ = 1;
  size_t currentPage_ = 0;
};
