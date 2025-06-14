const GAME_TIME = 1000 * 60; // 1분
const BOSS_TIME = 1000 * 60 * 10; // 10분

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
  ITEM: "item.mp3",
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
  BALL_BOUNCE: "ball-bounce.mp3",
  ITEM: "item.wav",
  CLEAR: "clear.wav",
  PAUSE: "pause.wav",
  // brickGame
  FALL: "Stat Fall Down.mp3",
  ITEM: "Safeguard.mp3",
  // pokemon ability
  FIRE_SFX: "Rage.mp3",
  WATER_SFX: "Spark.mp3",
  GRASS_SFX: "Recover.mp3",
  ELECTRIC_SFX: "Teleport.mp3",
  ICE_SFX: "Ice Beam.mp3",
  // bossGame
  MEWTWO_HURT: "mewtwo.ogg",
  // BOSS_ATTACK_1: "Self Destruct.mp3",
  BOSS_ATTACK_1: "Fake Out.mp3",
  BOSS_ATTACK_2: "Fake Out.mp3",
  BOSS_LASER: "Psybeam.mp3",
  PLAYER_ATTACK: "Quick Attack.mp3",
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

const BRICK_SCORE = 10;
const LEGENDARY_POKEMON_SCORE = 50;
const COMBINATION_SCORE = 30;

// 난이도별 최소 점수
const MIN_REQUIRED_SCORE = {
  easy: 30,
  normal: 50,
  hard: 80,
};

const TOTAL_POKEMON_COUNT = 105;  // 피카츄, 펭도리 제외

const SPECIAL_POKEMON = {
  1: 105, // stage1: 피카츄
  2: 106, // stage2: 팽도리
};

const TARGET_POKEMON_SPAWN_CHANCE = 1; // 목표 포켓몬 등장 확률 (20%)
const BALL_SPEED = 5; // 기본 공 속도

// 포켓몬 능력 별 상수
const FIRE_SPEED_BOOST = 1.4; // 불 속성 능력 속도 증가량
const ICE_SPEED_DELAY = 0.3; // 얼음 속성 블록 속도 감소
const GRASS_HEALTH_RESTORE = 1; // 풀 속성 회복
const WATER_PADDLE_EXTEND = 40; // 물 속성 패들 크기 증가량
// const ELEC_POINT_BOOST = 2;       // 전기 - 점수 2배

// bossGame config
const PLAYER_POWER = 30; // 플레이어 공격력
const BOSS_POWER = {
  phase1: 10,
  laser: 20,
  phase2: 15,
};
