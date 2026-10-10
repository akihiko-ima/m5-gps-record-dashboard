#include "RecorderStateMachine.h"

RecorderAction RecorderStateMachine::handle(RecorderEvent event, bool hasFix) {
  if (event == RecorderEvent::SdFailed) {
    const bool wasRecording = state_ == RecorderState::Recording;
    state_ = RecorderState::SdError;
    return wasRecording ? RecorderAction::AbortRecording : RecorderAction::None;
  }

  switch (state_) {
    case RecorderState::Idle:
    case RecorderState::FixError:
      if (event == RecorderEvent::ButtonA) {
        return tryStartRecording(hasFix);
      }
      if (event == RecorderEvent::ButtonB) {
        state_ = RecorderState::FileList;
        return RecorderAction::OpenFileList;
      }
      return RecorderAction::None;

    case RecorderState::Recording:
      // 記録中はボタンB・Cを無効にする
      if (event == RecorderEvent::ButtonA) {
        state_ = RecorderState::Idle;
        return RecorderAction::StopRecording;
      }
      return RecorderAction::None;

    case RecorderState::FileList:
      if (event == RecorderEvent::ButtonB) {
        state_ = RecorderState::Idle;
        return RecorderAction::None;
      }
      if (event == RecorderEvent::ButtonC) {
        return RecorderAction::NextPage;
      }
      return RecorderAction::None;

    case RecorderState::SdError:
      // 再起動でのみ復帰する
      return RecorderAction::None;
  }
  return RecorderAction::None;
}

RecorderAction RecorderStateMachine::tryStartRecording(bool hasFix) {
  if (!hasFix) {
    state_ = RecorderState::FixError;
    return RecorderAction::None;
  }
  state_ = RecorderState::Recording;
  return RecorderAction::StartRecording;
}
