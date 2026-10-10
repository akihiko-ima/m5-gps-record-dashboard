# m5-recorder

M5Stack Basic + GPS ユニットで、位置情報を10秒ごとに microSD に CSV で記録するファームウェアです。
仕様は [docs/ideas/m5-recorder-spec.md](../docs/ideas/m5-recorder-spec.md) を参照してください。

## 必要なもの

### ハードウェア

- M5Stack Basic v2.7
- M5Stack用GPSユニット v1.1（本体側面の Grove ポート **Port A** に接続）
  - Port C（M5GO ボトム）に接続する場合は `src/hw/GpsReader.cpp` のピンを RX: 16 / TX: 17 に変更してください
- microSD カード（FAT32 でフォーマット）

### ソフトウェア

| 項目       | 内容                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| ボード定義 | M5Stack（ボードマネージャー URL: `https://static-cdn.m5stack.com/resource/arduino/package_m5stack_index.json`） |
| ボード     | M5Stack-Core-ESP32（FQBN: `m5stack:esp32:m5stack_core`）                                                  |
| ライブラリ | M5Unified、TinyGPSPlus                                                                                          |

## ビルドと書き込み

### Arduino IDE

1. ボードマネージャーの追加 URL に上記 URL を登録し、「M5Stack」をインストール
2. ライブラリマネージャーで `M5Unified` と `TinyGPSPlus` をインストール
3. `m5-recorder/m5-recorder.ino` を開き、ボード「M5Stack-Core-ESP32」を選んで書き込む

### arduino-cli

```bash
arduino-cli config add board_manager.additional_urls https://static-cdn.m5stack.com/resource/arduino/package_m5stack_index.json
arduino-cli core update-index
arduino-cli core install m5stack:esp32
arduino-cli lib install M5Unified TinyGPSPlus

# uploadするport確認
arduino-cli board list

arduino-cli compile --fqbn m5stack:esp32:m5stack_core m5-recorder
arduino-cli upload  --fqbn m5stack:esp32:m5stack_core -p /dev/ttyACM0 m5-recorder
```

## 操作方法

| 画面                        | ボタンA          | ボタンB      | ボタンC    |
| --------------------------- | ---------------- | ------------ | ---------- |
| IDLE（待機中）              | 記録開始         | ファイル一覧 | -          |
| GPS FIX ERROR（測位エラー） | 記録開始を再試行 | ファイル一覧 | -          |
| RECORDING（記録中）         | 記録終了         | -            | -          |
| SAVED FILES（ファイル一覧） | -                | 待機中に戻る | 次のページ |
| SD CARD ERROR               | -                | -            | -          |

- 記録は GPS が測位できているときのみ開始できます。未測位なら「GPS FIX ERROR」になるので、空が開けた場所に移動してからボタンAで再試行してください
- SD CARD ERROR になった場合は、カードを確認して本体を再起動してください
- 画面表示は英語です（M5 の標準フォントに日本語がないため）

## 出力ファイル

`/tracks/YYYYMMDD_HHMMSS.csv`（記録開始時刻、UTC）

```csv
timestamp,latitude,longitude,altitude_m,speed_kmh,satellites,hdop
2026-10-11T01:23:40Z,35.681236,139.767125,12.3,42.5,9,0.9
2026-10-11T01:24:00Z,,,,,,
```

記録中に未測位になった行は、timestamp のみ記録して残りは空欄になります。

## ディレクトリ構成

```
m5-recorder/
├── m5-recorder.ino   # エントリポイント（各部品の結合）
├── src/core/         # ハードウェアに依存しないロジック（ホストでテスト可能）
├── src/hw/           # GPS・microSD・画面を扱う部分
└── test/             # src/core のユニットテスト
```

## ユニットテスト

ハードウェアに依存しないロジック（`src/core`）は PC 上の g++ でテストできます。

```bash
make -C m5-recorder/test
```

## 実機での確認手順

1. microSD を挿さずに起動 → 「SD CARD ERROR」が表示される
2. microSD を挿して起動 → 「IDLE」が表示される
3. 屋内など未測位の状態でボタンA → 「GPS FIX ERROR」が表示される
4. 屋外で「GPS: FIX」になってからボタンA → 「RECORDING」になり、10秒ごとに Rows が増える
5. ボタンAで記録終了 → ボタンBで一覧に新しいファイルが先頭に表示される
6. 記録したファイルを PC で開き、10秒間隔の行が記録されていることを確認する
7. 記録中に GPS アンテナを覆うなどして未測位にし、timestamp のみの行が記録されることを確認する
