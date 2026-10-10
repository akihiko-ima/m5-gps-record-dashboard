// 記録ファイル（CSV）の行を生成する
#pragma once

#include <cstdint>
#include <string>

#include "GpsSample.h"

namespace csv {

// ヘッダー行（改行付き）
std::string header();

// データ行（改行付き）
// 未測位（sample.hasFix == false）の場合は timestamp 以外を空欄にする
std::string row(int64_t unixTime, const GpsSample& sample);

}  // namespace csv
