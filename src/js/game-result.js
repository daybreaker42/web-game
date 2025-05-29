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
      label: "날짜",
      key: "date",
      formatter: (v) =>
        v
          ? new Date(v).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
    },
    {
      label: "구출한 포켓몬",
      key: "saved_pokemon",
      custom: true, // 아래에서 별도 처리
    },
  ];
  
  function renderGameResult(gameResult) {
    let html = "";
    for (const field of GAME_RESULT_FIELDS) {
      // 스코어 모드에서 '스테이지' 필드는 건너뜀
      if (field.key === "stage" && gameResult.mode === "score") continue;
  
      let value = gameResult[field.key];
      if (field.convert) value = field.convert[value] || value;
      if (field.formatter) value = field.formatter(value);
  
      // 구출 포켓몬 마릿수만 표시
      if (field.custom && field.key === "saved_pokemon") {
        const count = Array.isArray(gameResult.saved_pokemon) ? gameResult.saved_pokemon.length : 0;
        html += `<div class="game-result-row">
          <span class="game-result-label">${field.label}</span>
          <span>${count}마리</span>
        </div>`;
      } else {
        html += `<div class="game-result-row">
          <span class="game-result-label">${field.label}</span>
          <span>${value}</span>
        </div>`;
      }
    }
  
    elById("game-result-contents").innerHTML = html;
  
    document.querySelectorAll(".screen").forEach((e) => e.classList.add("hidden"));
    elById("game-result-screen").classList.remove("hidden");
  
    elById("btn-game-result-ok").onclick = function () {
      // 랭킹 저장 여부 모달
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
            showInfoModal("닉네임을 입력하세요!", function () {
              elById("nickname-input").focus();
            });
            return;
          }
          nickModal.close();
  
          let result = false;
          try {
            // addScoreRecord가 Promise 또는 boolean 반환 지원
            result = await addScoreRecord(
              gameResult.mode,
              gameResult.difficulty,
              name,
              gameResult.score
            );
          } catch (e) {
            result = false;
          }
          if (result) {
            showInfoModal("저장되었습니다.\n타이틀로 돌아갑니다.", returnToTitleScreen);
          } else {
            showInfoModal("저장에 실패했습니다.\n타이틀로 돌아갑니다.", returnToTitleScreen);
          }
        };
      };
  
      elById("ranking-save-no").onclick = function () {
        saveModal.close();
        returnToTitleScreen();
      };
    };
  }
  