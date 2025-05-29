/**
 * playGame(mode, difficulty, stage, onGameEnd)
 * - mode: "story" | "score"
 * - difficulty: "easy" | "normal" | "hard"
 * - stage: 스토리 모드는 1 이상의 정수, 점수모드는 null/-1/미사용
 * - onGameEnd: 게임 종료 콜백
 */
function playGame(mode, difficulty, stage, onGameEnd) {
  playBgm(BGM[`STAGE_${stage}`]);
  const canvas = document.getElementById("game-canvas");

  console.log("게임 시작:", mode, difficulty, stage);

  window.onkeydown = null;
  window.onkeyup = null;
  canvas.onmousemove = null;

  let gameInfo = {
    mode,
    difficulty,
    stage,
  };

  let gameInstance;

  if (mode === "score") {
    gameInstance = new BrickGame(canvas);
  } else if (mode === "story") {
    if (stage === STORY_SCRIPTS.length) {
      gameInstance = new BossGame(canvas);
    } else {
      gameInstance = new BrickGame(canvas);
    }
  } else {
    alert("잘못된 게임 모드입니다.");
    return;
  }
  gameInstance.setGameInfo(gameInfo);
  gameInstance.setOnGameEnd(function (gameResult) {
    setTimeout(() => onGameEnd(gameResult), 1800);
  });

  window.onkeydown = (e) => gameInstance.keyDownHandler(e);
  window.onkeyup = (e) => gameInstance.keyUpHandler(e);
  canvas.onmousemove = (e) => gameInstance.mouseMoveHandler(e);

  gameInstance.startGame();
}
