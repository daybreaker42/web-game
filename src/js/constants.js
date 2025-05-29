const GAME_TIME = 3000; // 3초

const STORY_SCRIPTS = [
  window.story_chapter0_opening, // 0: START 스토리
  window.story_chapter1, // 1: Stage 1 후 스토리
  window.story_chapter2, // 2: Stage 2 후 스토리
  window.story_chapter3, // 3: Stage 3 후 스토리
  window.story_chapter4_finale, // 4: Stage 4 전 스토리 (보스전 전)
  window.story_chapter5_closing, // 5: ENDING 스토리
];
const N_STAGES = STORY_SCRIPTS.length - 2; // 스토리 스크립트 개수 (보스전 제외)

const BGM = {
  TITLE: "title.mp3",
  STORY: "story.mp3",
  STAGE_1: "stage-1.mp3",
  STAGE_2: "stage-2.mp3",
  STAGE_3: "stage-3.mp3",
  STAGE_4: "stage-4-boss.mp3",
  ENDING: "ending.mp3",
  CREDITS: "credits.mp3",
  INTRO: "intro.mp3",
  RANKING: "ranking.mp3",
  RESULT: "game-result.mp3",
};
const SFX = {
  BUTTON: "button-click.wav",
  START: "press-any-button.mp3",
  STORY: "story-next.wav",
  CRT_TYPE: "crt-type.wav",
  CRT_ON: "crt-on.mp3",
  CRT_OFF: "crt-off.mp3",
};
