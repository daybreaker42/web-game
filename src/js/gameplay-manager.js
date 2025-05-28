function playStageGameplay(stageIndex, onGameEnd) {
  let currentGame = null;
  if (1 <= stageIndex && stageIndex <= 3) {
    currentGame = new BrickGame(canvas);
  } else if (stageIndex == 4) {
    currentGame = new BossGame(canvas);
  } else {
    console.error(`gameIndex 에러! - 1~4 사이의 값을 가져야 합니다. ${gameIndex}`);
  }
}
