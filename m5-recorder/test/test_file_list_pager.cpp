#include "FileListPager.h"
#include "TestRunner.h"

#include <cstdio>

namespace {

std::vector<FileEntry> sampleEntries(int count) {
  std::vector<FileEntry> entries;
  for (int i = 0; i < count; ++i) {
    char name[32];
    snprintf(name, sizeof(name), "202610%02d_120000.csv", i + 1);
    entries.push_back({name, static_cast<uint32_t>(i * 100)});
  }
  return entries;
}

}  // namespace

TEST(pager_sorts_newest_first) {
  FileListPager pager({{"20261009_080000.csv", 1},
                       {"20261011_012340.csv", 2},
                       {"20261010_235959.csv", 3}},
                      5);
  EXPECT_EQ(std::string("20261011_012340.csv"), pager.entries()[0].name);
  EXPECT_EQ(std::string("20261010_235959.csv"), pager.entries()[1].name);
  EXPECT_EQ(std::string("20261009_080000.csv"), pager.entries()[2].name);
}

TEST(pager_empty_has_one_empty_page) {
  FileListPager pager({}, 5);
  EXPECT_EQ(size_t{1}, pager.pageCount());
  EXPECT_EQ(size_t{0}, pager.pageBegin());
  EXPECT_EQ(size_t{0}, pager.pageEnd());
  pager.nextPage();
  EXPECT_EQ(size_t{0}, pager.currentPage());
}

TEST(pager_splits_into_pages) {
  FileListPager pager(sampleEntries(12), 5);
  EXPECT_EQ(size_t{3}, pager.pageCount());
  EXPECT_EQ(size_t{0}, pager.pageBegin());
  EXPECT_EQ(size_t{5}, pager.pageEnd());
  pager.nextPage();
  EXPECT_EQ(size_t{5}, pager.pageBegin());
  EXPECT_EQ(size_t{10}, pager.pageEnd());
  pager.nextPage();
  EXPECT_EQ(size_t{10}, pager.pageBegin());
  EXPECT_EQ(size_t{12}, pager.pageEnd());
}

TEST(pager_wraps_to_first_page) {
  FileListPager pager(sampleEntries(6), 5);
  pager.nextPage();
  EXPECT_EQ(size_t{1}, pager.currentPage());
  pager.nextPage();
  EXPECT_EQ(size_t{0}, pager.currentPage());
}

TEST(pager_exact_multiple_has_no_extra_page) {
  FileListPager pager(sampleEntries(10), 5);
  EXPECT_EQ(size_t{2}, pager.pageCount());
}
