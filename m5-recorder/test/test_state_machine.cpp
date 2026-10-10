#include "RecorderStateMachine.h"
#include "TestRunner.h"

namespace {

using S = RecorderState;
using E = RecorderEvent;
using A = RecorderAction;

std::ostream& operator<<(std::ostream& os, S s) { return os << static_cast<int>(s); }
std::ostream& operator<<(std::ostream& os, A a) { return os << static_cast<int>(a); }

// 指定の状態まで遷移させたステートマシンを作る
RecorderStateMachine machineIn(S state) {
  RecorderStateMachine m;
  switch (state) {
    case S::Idle:
      break;
    case S::FixError:
      m.handle(E::ButtonA, false);
      break;
    case S::Recording:
      m.handle(E::ButtonA, true);
      break;
    case S::FileList:
      m.handle(E::ButtonB, true);
      break;
    case S::SdError:
      m.handle(E::SdFailed, true);
      break;
  }
  return m;
}

void expectTransition(S from, E event, bool hasFix, S to, A action) {
  RecorderStateMachine m = machineIn(from);
  EXPECT_EQ(from, m.state());
  EXPECT_EQ(action, m.handle(event, hasFix));
  EXPECT_EQ(to, m.state());
}

}  // namespace

TEST(sm_starts_idle) { EXPECT_EQ(S::Idle, RecorderStateMachine().state()); }

TEST(sm_idle_buttonA_with_fix_starts_recording) {
  expectTransition(S::Idle, E::ButtonA, true, S::Recording, A::StartRecording);
}

TEST(sm_idle_buttonA_without_fix_goes_fix_error) {
  expectTransition(S::Idle, E::ButtonA, false, S::FixError, A::None);
}

TEST(sm_idle_buttonB_opens_file_list) {
  expectTransition(S::Idle, E::ButtonB, false, S::FileList, A::OpenFileList);
}

TEST(sm_idle_buttonC_does_nothing) {
  expectTransition(S::Idle, E::ButtonC, true, S::Idle, A::None);
}

TEST(sm_fix_error_buttonA_with_fix_starts_recording) {
  expectTransition(S::FixError, E::ButtonA, true, S::Recording, A::StartRecording);
}

TEST(sm_fix_error_buttonA_without_fix_stays) {
  expectTransition(S::FixError, E::ButtonA, false, S::FixError, A::None);
}

TEST(sm_fix_error_buttonB_opens_file_list) {
  expectTransition(S::FixError, E::ButtonB, false, S::FileList, A::OpenFileList);
}

TEST(sm_recording_buttonA_stops) {
  expectTransition(S::Recording, E::ButtonA, false, S::Idle, A::StopRecording);
}

TEST(sm_recording_ignores_buttonB_and_C) {
  expectTransition(S::Recording, E::ButtonB, true, S::Recording, A::None);
  expectTransition(S::Recording, E::ButtonC, true, S::Recording, A::None);
}

TEST(sm_recording_sd_failure_aborts) {
  expectTransition(S::Recording, E::SdFailed, true, S::SdError, A::AbortRecording);
}

TEST(sm_idle_sd_failure_goes_sd_error) {
  expectTransition(S::Idle, E::SdFailed, true, S::SdError, A::None);
}

TEST(sm_file_list_buttonB_returns_idle) {
  expectTransition(S::FileList, E::ButtonB, true, S::Idle, A::None);
}

TEST(sm_file_list_buttonC_next_page) {
  expectTransition(S::FileList, E::ButtonC, true, S::FileList, A::NextPage);
}

TEST(sm_file_list_ignores_buttonA) {
  expectTransition(S::FileList, E::ButtonA, true, S::FileList, A::None);
}

TEST(sm_sd_error_ignores_buttons) {
  expectTransition(S::SdError, E::ButtonA, true, S::SdError, A::None);
  expectTransition(S::SdError, E::ButtonB, true, S::SdError, A::None);
  expectTransition(S::SdError, E::ButtonC, true, S::SdError, A::None);
}
