// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  if (window.DEBUG_MODE && window.DEBUG_GAME) {
    // switchGameMode("brick"); // 기본 모드로 초기화
    document.getElementById("gameplay-screen").classList.remove("hidden");
  }
  // 게임 컨트롤 버튼 이벤트 리스너 설정 (한 번만) // 주석 추가
  const startButton = document.getElementById("startButton");
  const pauseButtonLegacy = document.getElementById("pauseButton");
  const pauseButton = document.getElementById("pause-button");
  const restartButton = document.getElementById("restartButton");

  if (startButton) {
    startButton.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.startGame === "function") {
        gameInstance.startGame();
      }
    });
  } else {
    console.error("startButton 요소를 찾을 수 없습니다.");
  }
  if (pauseButton && pauseButtonLegacy) {
    pauseButton.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.togglePause === "function") {
        gameInstance.togglePause();
      }
    });
    pauseButtonLegacy.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.togglePause === "function") {
        gameInstance.togglePause();
      }
    });
  } else {
    console.error("pauseButton 요소를 찾을 수 없습니다.");
  }
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.restartGame === "function") {
        gameInstance.restartGame();
      }
    });
  } else {
    console.error("restartButton 요소를 찾을 수 없습니다.");
  }
});
