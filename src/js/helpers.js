const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => [...document.querySelectorAll(sel)];
const elById = (id) => document.getElementById(id);

const hide = (el) => {
  el.classList.remove("fade-in");
  el.classList.remove("fade-out");
  el.classList.add("hidden");
};

const show = (el) => {
  el.classList.remove("fade-out");
  el.classList.remove("fade-in");
  el.classList.remove("hidden");
};

const hideAll = (els) => {
  els.forEach((el) => {
    el.classList.add("hidden");
  });
};

const hideAllFade = (els) => {
  els.forEach((el) => {
    el.classList.remove("fade-in");
    el.classList.add("fade-out");
    hide(el);
  });
};

const showWithFade = (el) => {
  el.classList.remove("fade-out");
  el.classList.add("fade-in");
  el.classList.remove("hidden");
};

const hideWithFade = (el) => {
  el.classList.add("fade-out");
  el.classList.remove("fade-in");
  el.classList.add("hidden");
};
