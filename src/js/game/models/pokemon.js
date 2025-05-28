// 포켓몬 타입 enum
export const PokemonType = Object.freeze({
  GRASS:    0,
  FIRE:     1,
  ELECTRIC: 2, // 피카츄 전용
  WATER:    3, // 팽도리 전용
  ICE:      4,
});

// 포켓몬 타입 문자열 (enum 대응)
export const PokemonTypeName = {
  [PokemonType.GRASS]:    "풀",
  [PokemonType.FIRE]:     "불",
  [PokemonType.ELECTRIC]: "전기",
  [PokemonType.WATER]:    "물",
  [PokemonType.ICE]:      "얼음",
};