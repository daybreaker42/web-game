const GAME_RESULT_FIELDS = [
  {
    label: "모드",
    key: "mode",
    convert: { story: "스토리 모드", score: "스코어 모드" },
  },
  {
    label: "난이도",
    key: "difficulty",
    convert: { easy: "쉬움", normal: "보통", hard: "어려움" },
  },
  {
    label: "스테이지",
    key: "stage",
    formatter: (v) => (v !== null && v !== undefined ? v : "-"),
  },
  {
    label: "점수",
    key: "score",
  },
  {
    label: "구출한 포켓몬",
    key: "saved_pokemon",
    custom: true, // 아래에서 별도 처리
  },
];

function showGameResultScreen(gameResult) {
    playBgm(BGM.RESULT);
    renderGameResult(gameResult);
    // elById("game-result-back").onclick = handleReturnToTitleScreen;
}

function renderGameResult(gameResult) {
  let html = "";
  for (const field of GAME_RESULT_FIELDS) {
    if (field.key === "stage" && gameResult.mode === "score") continue;
    let value = gameResult[field.key];
    if (field.convert) value = field.convert[value] || value;
    if (field.formatter) value = field.formatter(value);

    if (field.custom && field.key === "saved_pokemon") {
      const count = Array.isArray(gameResult.saved_pokemon)
        ? gameResult.saved_pokemon.length
        : 0;
      html += `<div class="game-result-row">
            <span class="game-result-label">${field.label}</span>
            <span class="game-result-value">${count}마리</span>
          </div>`;
    } else {
      html += `<div class="game-result-row">
            <span class="game-result-label">${field.label}</span>
            <span class="game-result-value">${value}</span>
          </div>`;
    }
  }

  elById("game-result-contents").innerHTML = html;

  document
    .querySelectorAll(".screen")
    .forEach((e) => e.classList.add("hidden"));
  elById("game-result-screen").classList.remove("hidden");

  const pressMsg = elById("press-any-key-msg");
  if (pressMsg) {
    // 리플로우로 애니메이션 재생
    void pressMsg.offsetWidth;
  }

  function handleAnyPress(e) {
    // 키보드/마우스 눌렀을 때만 한 번 실행
    window.removeEventListener("keydown", handleAnyPress);
    window.removeEventListener("mousedown", handleAnyPress);

    // 메시지 숨기기
    if (pressMsg) pressMsg.classList.add("hidden");

    // 기존 버튼 로직 그대로
    const saveModal = elById("ranking-save-modal");
    saveModal.showModal();

    elById("ranking-save-yes").onclick = function () {
      saveModal.close();
      const nickModal = elById("nickname-modal");
      elById("nickname-input").value = "";
      nickModal.showModal();

      elById("nickname-ok").onclick = async function (e) {
        e.preventDefault();
        const name = elById("nickname-input").value.trim();
        if (!name) {
          nickModal.close();
          showInfoModal("닉네임을 입력하세요!", function () {
            nickModal.showModal();
            elById("nickname-input").focus();
          });
          return;
        }

        nickModal.close();

        let result = false;
        try {
          result = await addScoreRecord(
            gameResult.mode,
            gameResult.difficulty,
            name,
            gameResult.score,
          );
        } catch (e) {
          result = false;
        }
        if (result) {
          showInfoModal(
            "저장되었습니다.\n타이틀로 돌아갑니다.",
            handleReturnToTitleScreen,
          );
        } else {
          showInfoModal(
            "저장에 실패했습니다.\n타이틀로 돌아갑니다.",
            handleReturnToTitleScreen,
          );
        }
      };
    };

    elById("ranking-save-no").onclick = function () {
      saveModal.close();
      handleReturnToTitleScreen();
    };
  }

  // 아무 키나/마우스 클릭시 다음 단계
  window.addEventListener("keydown", handleAnyPress, { once: true });
  window.addEventListener("mousedown", handleAnyPress, { once: true });
}
