#include "FileListPager.h"

#include <algorithm>
#include <utility>

FileListPager::FileListPager(std::vector<FileEntry> entries, size_t itemsPerPage)
    : entries_(std::move(entries)), itemsPerPage_(std::max<size_t>(itemsPerPage, 1)) {
  std::sort(entries_.begin(), entries_.end(),
            [](const FileEntry& a, const FileEntry& b) { return a.name > b.name; });
}

size_t FileListPager::pageCount() const {
  if (entries_.empty()) {
    return 1;
  }
  return (entries_.size() + itemsPerPage_ - 1) / itemsPerPage_;
}

size_t FileListPager::pageBegin() const { return currentPage_ * itemsPerPage_; }

size_t FileListPager::pageEnd() const {
  return std::min(pageBegin() + itemsPerPage_, entries_.size());
}

void FileListPager::nextPage() { currentPage_ = (currentPage_ + 1) % pageCount(); }
