const DEMO_GAME_RESULT_1 = {
  mode: "score",
  difficulty: "normal",
  stage: 0,
  score: 5000,
  date: "2023-10-01T12:00:00Z",
  game_over: false,
  saved_pokemon: [1, 2, 3],
};

const DEMO_GAME_RESULT_2 = {
  mode: "score",
  difficulty: "hard",
  stage: 1,
  score: 7000,
  date: "2023-10-02T12:00:00Z",
  game_over: true,
  saved_pokemon: [4, 5],
};

const DEMO_RANKING_DATA = {
  story_mode: {
    easy: [
      { rank: 1, name: "AAA", score: 5020, date: "2025-05-23 18:25" },
      { rank: 2, name: "BBB", score: 4900, date: "2025-05-22 09:11" },
      { rank: 3, name: "CCC", score: 4880, date: "2025-05-21 21:54" },
      { rank: 4, name: "111", score: 300, date: "2025-05-23 18:25" },
      { rank: 5, name: "222", score: 200, date: "2025-05-22 09:11" },
      { rank: 6, name: "333", score: 100, date: "2025-05-22 09:11" },
      { rank: 7, name: "444", score: 0, date: "2025-05-22 09:11" },
    ],
    normal: [
      { rank: 1, name: "DDD", score: 7350, date: "2025-05-22 14:44" },
      { rank: 2, name: "EEE", score: 7100, date: "2025-05-20 23:32" },
      { rank: 3, name: "FFF", score: 7000, date: "2025-05-19 08:02" },
    ],
    hard: [
      { rank: 1, name: "GGG", score: 8200, date: "2025-05-23 01:04" },
      { rank: 2, name: "HHH", score: 8030, date: "2025-05-22 22:41" },
    ],
  },
  score_mode: {
    easy: [
      { rank: 1, name: "III", score: 11000, date: "2025-05-23 17:37" },
      { rank: 2, name: "JJJ", score: 10950, date: "2025-05-22 13:13" },
    ],
    normal: [
      { rank: 1, name: "KKK", score: 13250, date: "2025-05-21 12:54" },
      { rank: 2, name: "LLL", score: 13100, date: "2025-05-20 07:01" },
    ],
    hard: [
      { rank: 1, name: "MMM", score: 21000, date: "2025-05-23 03:24" },
      { rank: 2, name: "NNN", score: 20550, date: "2025-05-22 18:10" },
    ],
  },
};
