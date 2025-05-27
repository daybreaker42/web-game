function setupOptionModal() {
  function openOptions() {
    qs("#options-modal").showModal();
  }
  document
    .querySelectorAll(".btn-options")
    .forEach((btn) => (btn.onclick = openOptions));
  qs("#modal-close").onclick = () => qs("#options-modal").close();
}
