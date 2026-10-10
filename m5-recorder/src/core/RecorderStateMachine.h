// レコーダーの状態遷移（仕様書「5. 状態遷移」の遷移表に対応）
//
// 副作用は持たず、次の状態と実行すべきアクションを返すだけにする。
// ファイル作成などの実処理は呼び出し側がアクションに応じて行う。
#pragma once

enum class RecorderState {
  Idle,       // 待機中
  FixError,   // 測位エラー（未測位のため記録を開始できなかった）
  Recording,  // 記録中
  FileList,   // ファイル一覧
  SdError,    // SD エラー（再起動で復帰）
};

enum class RecorderEvent {
  ButtonA,
  ButtonB,
  ButtonC,
  SdFailed,  // SD の初期化・書き込みに失敗した
};

enum class RecorderAction {
  None,
  StartRecording,  // 新しいファイルを作成して記録を開始する
  StopRecording,   // ファイルをクローズして記録を終了する
  AbortRecording,  // 記録中に SD エラーが発生したため記録を中断する
  OpenFileList,    // ファイル一覧を読み込んで1ページ目を表示する
  NextPage,        // ファイル一覧の次のページを表示する
};

class RecorderStateMachine {
 public:
  RecorderState state() const { return state_; }

  // イベントを処理して状態を更新し、実行すべきアクションを返す
  // hasFix: イベント発生時点で GPS が測位済みか
  RecorderAction handle(RecorderEvent event, bool hasFix);

 private:
  RecorderAction tryStartRecording(bool hasFix);

  RecorderState state_ = RecorderState::Idle;
};
