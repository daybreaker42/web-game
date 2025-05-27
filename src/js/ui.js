function showMainMenu() {
  const mainMenu = qs("#main-menu");
  mainMenu.classList.add("fade-in");
  show(mainMenu);
}

function showStoryScreen() {
  console.log("showStoryScreen called");
  hide(qs("#difficulty-menu"));
  show(qs("#story-screen"));
}
