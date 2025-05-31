/**
 * 통합 모달 표시 함수
 * @param {string} message - 모달에 출력할 내용 (html 가능)
 * @param {object} options - { input: boolean, buttons: [ { label, callback, id } ], placeholder: string }
 */
function showUniModal(message, options = {}) {
  const modal = elById("uni-modal");
  const content = elById("uni-modal-content");
  const inputContainer = elById("uni-modal-input-container");
  const input = elById("uni-modal-input");
  const btns = elById("uni-modal-btns");
  const form = elById("uni-modal-form"); // <form ...>

  // 1. 내용 세팅
  content.innerHTML = message.replace(/\n/g, "<br>");

  // 2. width 자동 조정
  const plainMsg = message.replace(/<[^>]+>/g, "");
  if (plainMsg.length >= 15) {
    modal.style.width = "500px";
  } else {
    modal.style.width = "";
  }

  // 3. 입력창(있으면)
  if (options.input) {
    inputContainer.style.display = "";
    input.value = "";
    input.placeholder = options.placeholder || "";
    setTimeout(() => input.focus(), 50);
  } else {
    inputContainer.style.display = "none";
  }

  // 4. 버튼 세팅
  btns.innerHTML = "";
  (options.buttons || [{ label: "확인", callback: null }]).forEach(
    (btnOpt, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pixel-box modal-inner-button";
      btn.style.margin = "10px 4px";
      btn.textContent = btnOpt.label;
      btn.id = btnOpt.id || `uni-modal-btn-${idx}`;
      btn.onclick = (e) => {
        playSfx(SFX.BUTTON); // ★ 효과음
        modal.close();
        if (btnOpt.callback)
          btnOpt.callback(options.input ? input.value.trim() : undefined, e);
      };
      btns.appendChild(btn);
    },
  );

  // 4-1. 폼 엔터키 제출/닫힘 막기 & 엔터시 첫 번째 버튼 클릭 트리거
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault(); // 기본 동작(닫힘) 막기
      // 엔터 입력시, 첫 번째 버튼 클릭과 동일하게 동작하게 하기
      const firstBtn = btns.querySelector("button");
      if (firstBtn) firstBtn.click();
    };
  }

  // 5. 모달 열기
  modal.showModal();
}

/**
 * 스토리 스킵 확인 모달 표시 (공통)
 * @param {Function} onSkip - 스킵 확정 시 실행할 콜백
 */
function showStorySkipConfirm(onSkip) {
  showUniModal(
    "스토리를 스킵하시겠습니까?<br><small>이전으로 돌아갈 수 없습니다.</small>",
    {
      buttons: [
        {
          label: "네",
          id: "uni-modal-skip-yes",
          callback: () => {
            // 스킵 처리 콜백 실행 (onSkip 직접 전달)
            if (typeof onSkip === "function") onSkip();
          },
        },
        {
          label: "아니오",
          id: "uni-modal-skip-no",
          // 아무 일도 하지 않음 (모달이 자동으로 닫힘)
        },
      ],
    },
  );
}

function showNicknameInputModal(gameResult) {
  showUniModal("닉네임을 입력하세요\n(A-Z, 0-9만 사용)", {
    input: true,
    placeholder: "최대 6자",
    buttons: [
      {
        label: "확인",
        callback: async (name) => {
          if (!name) {
            showUniModal("닉네임을 입력하세요!", {
              buttons: [
                {
                  label: "확인",
                  callback: () => showNicknameInputModal(gameResult),
                },
              ],
            });
            return;
          }
          if (!/^[A-Z0-9]{1,6}$/.test(name)) {
            showUniModal(
              "닉네임은 대문자 알파벳(A-Z)와\n숫자(0-9)만 사용할 수 있습니다!",
              {
                buttons: [
                  {
                    label: "확인",
                    callback: () => showNicknameInputModal(gameResult),
                  },
                ],
              },
            );
            return;
          }

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

          // 콜백 분기
          let afterSaveCallback;
          if (gameResult.mode === "score" || gameResult.game_over) {
            afterSaveCallback = handleReturnToTitleScreen;
          } else {
            // 스토리 모드 + 클리어 상황 (엔딩)
            afterSaveCallback = () => {
              showCredits(gameResult);
            };
          }

          if (result) {
            showUniModal("저장되었습니다.<br>타이틀로 돌아갑니다.", {
              buttons: [{ label: "확인", callback: afterSaveCallback }],
            });
          } else {
            showUniModal("저장에 실패했습니다.<br>타이틀로 돌아갑니다.", {
              buttons: [{ label: "확인", callback: afterSaveCallback }],
            });
          }
        },
      },
    ],
  });
}

function showInfoModal(msg, onClose) {
  showUniModal(msg, {
    buttons: [
      {
        label: "확인",
        callback: onClose,
      },
    ],
  });
}