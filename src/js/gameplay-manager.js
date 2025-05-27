const DEMO_GAME_RESULTS = [
  {
    mode: "score",
    difficulty: "normal",
    stage: 0,
    score: 5000,
    date: "2023-10-01T12:00:00Z",
    game_over: false,
    saved_pokemon: [1, 2, 3],
  },
  {
    mode: "score",
    difficulty: "hard",
    stage: 1,
    score: 7000,
    date: "2023-10-02T12:00:00Z",
    game_over: true,
    saved_pokemon: [4, 5],
  },
];

function playStageGameplay(stageIndex, onGameEnd) {
  // TODO: 본게임 구현
  alert(`Stage ${stageIndex + 1} 게임 시작`);
  setTimeout(() => {
    const gameResult = DEMO_GAME_RESULTS[0];
    if (typeof onGameEnd === "function") onGameEnd(gameResult);
  }, 2000);
}
