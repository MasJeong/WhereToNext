import { randomInt } from "node:crypto";

const nicknameAdjectives = [
  "다정한",
  "말랑한",
  "포근한",
  "느긋한",
  "반짝이는",
  "몽실몽실한",
  "조곤조곤한",
  "폭신한",
  "명랑한",
  "사뿐한",
  "보드라운",
  "상냥한",
  "동글동글한",
  "재잘재잘한",
  "해맑은",
  "엉뚱한",
  "산뜻한",
] as const;

const nicknameNouns = [
  "참새",
  "찰떡",
  "토끼",
  "병아리",
  "고양이",
  "곰돌이",
  "푸딩",
  "젤리",
  "쿠키",
  "복숭아",
  "구름",
  "도토리",
  "햄찌",
  "오리",
  "라떼",
  "마카롱",
  "솜사탕",
] as const;

/**
 * 사용자가 이름을 정하지 않았을 때 기본 랜덤 닉네임을 만든다.
 * @returns 예: 다정한참새871
 */
export function buildRandomUserDisplayName(): string {
  const adjective = nicknameAdjectives[randomInt(0, nicknameAdjectives.length)];
  const noun = nicknameNouns[randomInt(0, nicknameNouns.length)];
  const suffix = randomInt(100, 1000);

  return `${adjective}${noun}${suffix}`;
}

/**
 * 사용자 입력 이름을 정리하고, 비어 있으면 랜덤 닉네임으로 대체한다.
 * @param name 사용자 입력 또는 외부 프로필 이름
 * @returns 저장/표시에 사용할 닉네임
 */
export function resolveUserDisplayName(name: string | null | undefined): string {
  const normalizedName = name?.trim();
  return normalizedName ? normalizedName : buildRandomUserDisplayName();
}
