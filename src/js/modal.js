function showInfoModal(msg, onClose) {
    elById("info-content").innerHTML = msg.replace(/\n/g, "<br>");
    elById("info-modal").showModal();
    const btn = elById("info-confirm-yes");
    btn.onclick = function () {
      elById("info-modal").close();
      if (typeof onClose === "function") onClose();
    };
  }
  