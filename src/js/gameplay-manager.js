function playStageGameplay(stageIndex, onGameEnd) {
  // TODO: 본게임 구현
  alert(`Stage ${stageIndex + 1} 게임 시작`);
  setTimeout(() => {
    // TODO: 값 교체
    const gameResult = DEMO_GAME_RESULT_1;
    onGameEnd(gameResult);
  }, 2000);
}
