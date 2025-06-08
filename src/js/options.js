function setupRadioSelector(selectorId, userKey) {
    const container = document.getElementById(selectorId);
    container.addEventListener("click", (event) => {
      const label = event.target.closest('.option');
      if (!label) return;
      const input = label.querySelector('input[type="radio"]');
      if (!input) return;
      input.checked = true;
      userOption[userKey] = parseInt(input.value, 10);
      console.log(`${userKey} changed - ${input.value}`);
    });
  }
  
  function setupOptionModal() {
    function openOptions() {
      qs("#options-modal").showModal();
    }
    document.querySelectorAll(".btn-options")
      .forEach((btn) => (btn.onclick = openOptions));
    qs("#modal-close").onclick = () => qs("#options-modal").close();
  
    setupRadioSelector("ball-selector", "ballType");
    setupRadioSelector("bar-selector", "barType");
    setupRadioSelector("player-selector", "playerType");
  }
  