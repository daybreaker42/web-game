const GAME_TIME = 1000 * 10;

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
  GAME_OVER: "game-over.mp3",
  // game
  MEWTWO_HURT: 'mewtwo.ogg',
  BALL_BOUNCE: 'ball-bounce.mp3',
  ITEM: 'item.wav',
  CLEAR: 'clear.wav',
};

// gameManager config
const LIVES_CONFIG = {
  brick: { easy: 20, normal: 15, hard: 10 }, // 주석 추가: 벽돌깨기 모드 생명 (현재는 동일)
  boss: { easy: 1000, normal: 700, hard: 500 }, // 주석 추가: 보스전 모드 생명 (현재는 동일)
};

const POKEMON_ABLILITY_SYSTEM = {
  cooldowns: [0, 0, 0, 0], // 각 슬롯별 쿨타임 (밀리초)
  lastUsed: [0, 0, 0, 0], // 각 슬롯별 마지막 사용 시간
  defaultCooldown: 3000, // 기본 쿨타임: 3초
  throttleInterval: 200, // 입력 throttling 간격: 200ms
  lastInputTime: [0, 0, 0, 0], // 각 슬롯별 마지막 입력 시간
};

const POKEMON_HEALTH_SYSTEM = {
  maxHealth: [100, 100, 100, 100], // 각 슬롯별 최대 체력
  currentHealth: [100, 100, 100, 100], // 각 슬롯별 현재 체력
  healthConsumption: 20, // 능력 사용 시 소모 체력
  isDizzy: [false, false, false, false], // 각 슬롯별 기절 상태
  dizzyImages: [null, null, null, null], // 기절 상태 이미지
  originalImages: [null, null, null, null], // 원본 이미지 저장
};

// brickGame config
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 80;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 30;

// 난이도별 최소 점수
const MIN_REQUIRED_SCORE = {
  easy: 30,
  normal: 500,
  hard: 800
};

const TOTAL_POKEMON_COUNT = 107;

const SPECIAL_POKEMON = {
  1: 105, // stage1: 피카츄
  2: 106  // stage2: 팽도리
};

const TARGET_POKEMON_SPAWN_CHANCE = 0.2; // 목표 포켓몬 등장 확률 (20%)

// bossGame config
const PLAYER_POWER = 30; // 플레이어 공격력
const BOSS_POWER = {
  phase1: 10,
  laser: 20,
  phase2: 15
};