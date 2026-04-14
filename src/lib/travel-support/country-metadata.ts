const countryMetadata = {
  AE: { countryName: "United Arab Emirates", countryNameKo: "아랍에미리트", currencyCode: "AED" },
  AT: { countryName: "Austria", countryNameKo: "오스트리아", currencyCode: "EUR" },
  AU: { countryName: "Australia", countryNameKo: "호주", currencyCode: "AUD" },
  CA: { countryName: "Canada", countryNameKo: "캐나다", currencyCode: "CAD" },
  CH: { countryName: "Switzerland", countryNameKo: "스위스", currencyCode: "CHF" },
  CN: { countryName: "China", countryNameKo: "중국", currencyCode: "CNY" },
  CZ: { countryName: "Czechia", countryNameKo: "체코", currencyCode: "CZK" },
  EG: { countryName: "Egypt", countryNameKo: "이집트", currencyCode: "EGP" },
  ES: { countryName: "Spain", countryNameKo: "스페인", currencyCode: "EUR" },
  FR: { countryName: "France", countryNameKo: "프랑스", currencyCode: "EUR" },
  GB: { countryName: "United Kingdom", countryNameKo: "영국", currencyCode: "GBP" },
  GU: { countryName: "Guam", countryNameKo: "괌", currencyCode: "USD" },
  HK: { countryName: "Hong Kong", countryNameKo: "홍콩", currencyCode: "HKD" },
  ID: { countryName: "Indonesia", countryNameKo: "인도네시아", currencyCode: "IDR" },
  IT: { countryName: "Italy", countryNameKo: "이탈리아", currencyCode: "EUR" },
  JP: { countryName: "Japan", countryNameKo: "일본", currencyCode: "JPY" },
  KE: { countryName: "Kenya", countryNameKo: "케냐", currencyCode: "KES" },
  MA: { countryName: "Morocco", countryNameKo: "모로코", currencyCode: "MAD" },
  MO: { countryName: "Macau", countryNameKo: "마카오", currencyCode: "MOP" },
  MP: { countryName: "Northern Mariana Islands", countryNameKo: "북마리아나 제도", currencyCode: "USD" },
  NL: { countryName: "Netherlands", countryNameKo: "네덜란드", currencyCode: "EUR" },
  NZ: { countryName: "New Zealand", countryNameKo: "뉴질랜드", currencyCode: "NZD" },
  PH: { countryName: "Philippines", countryNameKo: "필리핀", currencyCode: "PHP" },
  PT: { countryName: "Portugal", countryNameKo: "포르투갈", currencyCode: "EUR" },
  SG: { countryName: "Singapore", countryNameKo: "싱가포르", currencyCode: "SGD" },
  TH: { countryName: "Thailand", countryNameKo: "태국", currencyCode: "THB" },
  TZ: { countryName: "Tanzania", countryNameKo: "탄자니아", currencyCode: "TZS" },
  TW: { countryName: "Taiwan", countryNameKo: "대만", currencyCode: "TWD" },
  US: { countryName: "United States", countryNameKo: "미국", currencyCode: "USD" },
  VN: { countryName: "Vietnam", countryNameKo: "베트남", currencyCode: "VND" },
  ZA: { countryName: "South Africa", countryNameKo: "남아프리카공화국", currencyCode: "ZAR" },
} as const;

type CountryCode = keyof typeof countryMetadata;

/**
 * 목적지 국가 코드에 맞는 국가명과 통화 코드를 반환한다.
 * @param countryCode ISO 3166-1 alpha-2 국가 코드
 * @returns 국가 메타데이터 또는 null
 */
export function getCountryMetadata(countryCode: string) {
  return countryMetadata[countryCode as CountryCode] ?? null;
}
