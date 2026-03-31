const countryMetadata = {
  AE: { countryName: "United Arab Emirates", currencyCode: "AED" },
  AT: { countryName: "Austria", currencyCode: "EUR" },
  AU: { countryName: "Australia", currencyCode: "AUD" },
  CA: { countryName: "Canada", currencyCode: "CAD" },
  CH: { countryName: "Switzerland", currencyCode: "CHF" },
  CN: { countryName: "China", currencyCode: "CNY" },
  CZ: { countryName: "Czechia", currencyCode: "CZK" },
  EG: { countryName: "Egypt", currencyCode: "EGP" },
  ES: { countryName: "Spain", currencyCode: "EUR" },
  FR: { countryName: "France", currencyCode: "EUR" },
  GB: { countryName: "United Kingdom", currencyCode: "GBP" },
  GU: { countryName: "Guam", currencyCode: "USD" },
  HK: { countryName: "Hong Kong", currencyCode: "HKD" },
  ID: { countryName: "Indonesia", currencyCode: "IDR" },
  IT: { countryName: "Italy", currencyCode: "EUR" },
  JP: { countryName: "Japan", currencyCode: "JPY" },
  KE: { countryName: "Kenya", currencyCode: "KES" },
  MA: { countryName: "Morocco", currencyCode: "MAD" },
  MO: { countryName: "Macau", currencyCode: "MOP" },
  MP: { countryName: "Northern Mariana Islands", currencyCode: "USD" },
  NL: { countryName: "Netherlands", currencyCode: "EUR" },
  PH: { countryName: "Philippines", currencyCode: "PHP" },
  PT: { countryName: "Portugal", currencyCode: "EUR" },
  SG: { countryName: "Singapore", currencyCode: "SGD" },
  TH: { countryName: "Thailand", currencyCode: "THB" },
  TZ: { countryName: "Tanzania", currencyCode: "TZS" },
  TW: { countryName: "Taiwan", currencyCode: "TWD" },
  US: { countryName: "United States", currencyCode: "USD" },
  VN: { countryName: "Vietnam", currencyCode: "VND" },
  ZA: { countryName: "South Africa", currencyCode: "ZAR" },
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
