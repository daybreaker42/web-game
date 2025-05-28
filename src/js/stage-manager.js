let currentStageIndex = 0;

function proceedToStage(n) {
  currentStageIndex = n;
  playStageStory(n, () => {
    playStageGameplay(n, onGameEnd);
  });
}

function onGameEnd(gameResult) {
  saveGameResult(gameResult);

  if (gameResult.game_over) {
    onStageOver(gameResult);
  } else {
    if (currentStageIndex + 1 < STORY_SCRIPTS.length) {
      onStageClear(gameResult); // 클리어 안내
      proceedToStage(currentStageIndex + 1);
    } else {
      onAllStagesCleared();
    }
  }
}

// =============================================================================
//                               Callbacks
// =============================================================================

function onAllStagesCleared(gameResult) {
  alert("축하합니다. 모든 스테이지를 클리어했습니다!\n타이틀로 돌아갑니다.");
  returnToTitleScreen();
}

function onStageClear(gameResult) {
  alert("스테이지를 클리어했습니다.\n다음 스테이지로 진행합니다.");
}

function onStageOver(gameResult) {
  alert("게임 오버! 타이틀로 돌아갑니다.");
}

function saveGameResult(gameResult) {
  // TODO: localStorage에 게임 결과 저장
}
