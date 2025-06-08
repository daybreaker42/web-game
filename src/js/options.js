function setupOptionModal() {
  function openOptions() {
    qs("#options-modal").showModal();
  }
  document
    .querySelectorAll(".btn-options")
    .forEach((btn) => (btn.onclick = openOptions));
  qs("#modal-close").onclick = () => qs("#options-modal").close();

  const ballSelector = document.getElementById("ball-selector");
  const barSelector = document.getElementById("bar-selector");
  const playerSelector = document.getElementById("player-selector");

  // 공, 바, 사용자 모양 선택 시 저장하는 로직
  ballSelector.addEventListener("click", (event) => {
    if (event.target.tagName !== 'IMG') return;
    const selectedBall = event.target.parentElement.querySelector('input').value;
    const parsedValue = parseInt(selectedBall, 10);
    if (!isNaN(parsedValue)) {
      userOption.ballType = parsedValue;
      console.log(`ballType changed - ${selectedBall}`);
      // 선택 상태 업데이트
      qsa('#ball-selector img').forEach((inputEle, index) => {
        const input = inputEle.parentElement.querySelector('input');
        input.checked = (index + 1 === userOption.ballType);
      });
    }
  });

  barSelector.addEventListener("click", (event) => {
    if (event.target.tagName !== 'IMG') return;
    const selectedBar = event.target.parentElement.querySelector('input').value;
    const parsedValue = parseInt(selectedBar, 10);
    if (!isNaN(parsedValue)) {
      userOption.barType = parsedValue;
      console.log(`barType changed - ${selectedBar}`);
      // 선택 상태 업데이트
      qsa('#bar-selector img').forEach((inputEle, index) => {
        const input = inputEle.parentElement.querySelector('input');
        input.checked = (index + 1 === userOption.barType);
      });
    }
  });

  playerSelector.addEventListener("click", (event) => {
    if (event.target.tagName !== 'IMG') return;
    const selectedPlayer = event.target.parentElement.querySelector('input').value;
    const parsedValue = parseInt(selectedPlayer, 10);
    if (!isNaN(parsedValue)) {
      userOption.playerType = parsedValue;
      console.log(`playerType changed - ${selectedPlayer}`);
      // 선택 상태 업데이트
      qsa('#player-selector img').forEach((inputEle, index) => {
        const input = inputEle.parentElement.querySelector('input');
        input.checked = (index + 1 === userOption.playerType);
      });
    }
  });
}
