let currentStageIndex = 0;
let accumulatedGameResult = {
  // ... curGameResult
  score: 0,
  saved_pokemon: [],
};

function proceedToStage(stageIdx) {
  currentStageIndex = stageIdx;
  console.log(`Proceeding to stage ${stageIdx}`);

  // stage 1 시작 전 누적 데이터 초기화
  if (stageIdx === 1) {
    accumulatedGameResult = {
      score: 0,
      saved_pokemon: [],
    };
  }

  // Stage 4는 게임 이전에 스토리 재생
  const beforeStage =
    stageIdx === N_STAGES ? (cb) => playStory(N_STAGES, cb) : (cb) => cb();

  stopBgm();
  stopSfx();

  beforeStage(() => {
    if (stageIdx === N_STAGES) hideWithFade(qs("#story-screen"));
    playGame("story", selectedDifficulty, stageIdx, (gameResult) => {
      onGameEnd(gameResult);
    });
  });
}

/**
 * 게임 끝나고 호출하는 함수, 다음 스테이지로 넘어가거나 없으면 타이틀로
 */
function onGameEnd(gameResult) {
  stopBgm();

  console.log("게임 종료:", gameResult);
  accumulateGameResult(gameResult);

  if (gameResult.game_over) {
    onStageOver(gameResult);
  } else {
    hideWithFade(qs("#gameplay-screen"));
    onStageClear(gameResult);
  }
}

// =============================================================================
//                               Callbacks
// =============================================================================

function onStageClear(gameResult) {
  if (currentStageIndex === N_STAGES) {
    // 1. 엔딩 일러스트 → 2. 크레딧 → 3. 게임 결과
    isCleared = true;
    playStory(N_STAGES + 1, () => {
      accumulateGameResult(gameResult);
      console.log("Accumulated Game Result:", accumulatedGameResult);
      showCredits(accumulatedGameResult, () => {
        showGameResultScreen(accumulatedGameResult);
      });
    });
  } else {
    // 기존 그대로 (1~3스테이지)
    playStory(currentStageIndex, () => {
      stopBgm();
      proceedToStage(currentStageIndex + 1);
    });
  }
}

function onStageOver(gameResult) {
  accumulateGameResult(gameResult);
  showGameResultScreen(accumulatedGameResult);
}

function accumulateGameResult(gameResult) {
  accumulatedGameResult = {
    ...gameResult,
    score: accumulatedGameResult.score + gameResult.score,
    saved_pokemon: [
      ...accumulatedGameResult.saved_pokemon,
      ...gameResult.saved_pokemon,
    ],
  };
}
