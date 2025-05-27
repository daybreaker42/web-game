function showMainMenu() {
  const mainMenu = qs("#main-menu");
  mainMenu.classList.add("fade-in");
  show(mainMenu);
}

function showStoryScreen() {
  hide(qs("#level-menu"));
  show(qs("#story-screen"));
}
