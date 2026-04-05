import type { AffiliatePartner } from "@/lib/domain/contracts";

export type FlightAffiliateRouteTarget = {
  entityId: string;
  slug: string;
};

export type DestinationFlightAffiliateCatalogEntry = {
  destinationId: string;
  skyscanner: FlightAffiliateRouteTarget;
  tripCom: FlightAffiliateRouteTarget;
};

export const activeFlightAffiliatePartner: AffiliatePartner = "skyscanner";

export const departureAirportAffiliateTargets: Record<
  "ICN" | "GMP" | "PUS" | "CJU",
  {
    skyscanner: FlightAffiliateRouteTarget;
    tripCom: FlightAffiliateRouteTarget;
  }
> = {
  ICN: {
    skyscanner: { entityId: "ICN", slug: "incheon-international-airport" },
    tripCom: { entityId: "ICN", slug: "seoul" },
  },
  GMP: {
    skyscanner: { entityId: "GMP", slug: "gimpo-international-airport" },
    tripCom: { entityId: "GMP", slug: "seoul" },
  },
  PUS: {
    skyscanner: { entityId: "PUS", slug: "busan-gimhae-airport" },
    tripCom: { entityId: "PUS", slug: "busan" },
  },
  CJU: {
    skyscanner: { entityId: "CJU", slug: "jeju-airport" },
    tripCom: { entityId: "CJU", slug: "jeju" },
  },
};

export const destinationFlightAffiliateCatalog: DestinationFlightAffiliateCatalogEntry[] = [
  { destinationId: "tokyo", skyscanner: { entityId: "TYOA", slug: "tokyo" }, tripCom: { entityId: "TYO", slug: "tokyo" } },
  { destinationId: "osaka", skyscanner: { entityId: "OSAA", slug: "osaka" }, tripCom: { entityId: "OSA", slug: "osaka" } },
  { destinationId: "kyoto", skyscanner: { entityId: "KIX", slug: "kyoto" }, tripCom: { entityId: "KIX", slug: "kyoto" } },
  { destinationId: "fukuoka", skyscanner: { entityId: "FUK", slug: "fukuoka" }, tripCom: { entityId: "FUK", slug: "fukuoka" } },
  { destinationId: "sapporo", skyscanner: { entityId: "CTS", slug: "sapporo" }, tripCom: { entityId: "CTS", slug: "sapporo" } },
  { destinationId: "okinawa", skyscanner: { entityId: "OKA", slug: "okinawa" }, tripCom: { entityId: "OKA", slug: "okinawa" } },
  { destinationId: "taipei", skyscanner: { entityId: "TPE", slug: "taipei" }, tripCom: { entityId: "TPE", slug: "taipei" } },
  { destinationId: "kaohsiung", skyscanner: { entityId: "KHH", slug: "kaohsiung" }, tripCom: { entityId: "KHH", slug: "kaohsiung" } },
  { destinationId: "hong-kong", skyscanner: { entityId: "HKG", slug: "hong-kong" }, tripCom: { entityId: "HKG", slug: "hong-kong" } },
  { destinationId: "macau", skyscanner: { entityId: "MFM", slug: "macau" }, tripCom: { entityId: "MFM", slug: "macau" } },
  { destinationId: "bangkok", skyscanner: { entityId: "BKK", slug: "bangkok" }, tripCom: { entityId: "BKK", slug: "bangkok" } },
  { destinationId: "chiang-mai", skyscanner: { entityId: "CNX", slug: "chiang-mai" }, tripCom: { entityId: "CNX", slug: "chiang-mai" } },
  { destinationId: "phuket", skyscanner: { entityId: "HKT", slug: "phuket" }, tripCom: { entityId: "HKT", slug: "phuket" } },
  { destinationId: "da-nang", skyscanner: { entityId: "DAD", slug: "da-nang" }, tripCom: { entityId: "DAD", slug: "da-nang" } },
  { destinationId: "hoi-an", skyscanner: { entityId: "DAD", slug: "hoi-an" }, tripCom: { entityId: "DAD", slug: "hoi-an" } },
  { destinationId: "singapore", skyscanner: { entityId: "SIN", slug: "singapore" }, tripCom: { entityId: "SIN", slug: "singapore" } },
  { destinationId: "bali", skyscanner: { entityId: "DPS", slug: "bali" }, tripCom: { entityId: "DPS", slug: "bali" } },
  { destinationId: "cebu", skyscanner: { entityId: "CEB", slug: "cebu" }, tripCom: { entityId: "CEB", slug: "cebu" } },
  { destinationId: "boracay", skyscanner: { entityId: "MPH", slug: "boracay" }, tripCom: { entityId: "MPH", slug: "boracay" } },
  { destinationId: "guam", skyscanner: { entityId: "GUM", slug: "guam" }, tripCom: { entityId: "GUM", slug: "guam" } },
  { destinationId: "saipan", skyscanner: { entityId: "SPN", slug: "saipan" }, tripCom: { entityId: "SPN", slug: "saipan" } },
  { destinationId: "melbourne", skyscanner: { entityId: "MEL", slug: "melbourne" }, tripCom: { entityId: "MEL", slug: "melbourne" } },
  { destinationId: "sydney", skyscanner: { entityId: "SYD", slug: "sydney" }, tripCom: { entityId: "SYD", slug: "sydney" } },
  { destinationId: "gold-coast", skyscanner: { entityId: "OOL", slug: "gold-coast" }, tripCom: { entityId: "OOL", slug: "gold-coast" } },
  { destinationId: "brisbane", skyscanner: { entityId: "BNE", slug: "brisbane" }, tripCom: { entityId: "BNE", slug: "brisbane" } },
  { destinationId: "perth", skyscanner: { entityId: "PER", slug: "perth" }, tripCom: { entityId: "PER", slug: "perth" } },
  { destinationId: "cairns", skyscanner: { entityId: "CNS", slug: "cairns" }, tripCom: { entityId: "CNS", slug: "cairns" } },
  { destinationId: "adelaide", skyscanner: { entityId: "ADL", slug: "adelaide" }, tripCom: { entityId: "ADL", slug: "adelaide" } },
  { destinationId: "paris", skyscanner: { entityId: "PAR", slug: "paris" }, tripCom: { entityId: "PAR", slug: "paris" } },
  { destinationId: "rome", skyscanner: { entityId: "ROM", slug: "rome" }, tripCom: { entityId: "ROM", slug: "rome" } },
  { destinationId: "barcelona", skyscanner: { entityId: "BCN", slug: "barcelona" }, tripCom: { entityId: "BCN", slug: "barcelona" } },
  { destinationId: "lisbon", skyscanner: { entityId: "LIS", slug: "lisbon" }, tripCom: { entityId: "LIS", slug: "lisbon" } },
  { destinationId: "prague", skyscanner: { entityId: "PRG", slug: "prague" }, tripCom: { entityId: "PRG", slug: "prague" } },
  { destinationId: "vienna", skyscanner: { entityId: "VIE", slug: "vienna" }, tripCom: { entityId: "VIE", slug: "vienna" } },
  { destinationId: "zurich", skyscanner: { entityId: "ZRH", slug: "zurich" }, tripCom: { entityId: "ZRH", slug: "zurich" } },
  { destinationId: "vancouver", skyscanner: { entityId: "YVR", slug: "vancouver" }, tripCom: { entityId: "YVR", slug: "vancouver" } },
  { destinationId: "honolulu", skyscanner: { entityId: "HNL", slug: "honolulu" }, tripCom: { entityId: "HNL", slug: "honolulu" } },
  { destinationId: "los-angeles", skyscanner: { entityId: "LAX", slug: "los-angeles" }, tripCom: { entityId: "LAX", slug: "los-angeles" } },
  { destinationId: "new-york-city", skyscanner: { entityId: "NYCA", slug: "new-york-city" }, tripCom: { entityId: "NYC", slug: "new-york-city" } },
  { destinationId: "dubai", skyscanner: { entityId: "DXB", slug: "dubai" }, tripCom: { entityId: "DXB", slug: "dubai" } },
  { destinationId: "miyakojima", skyscanner: { entityId: "MMY", slug: "miyakojima" }, tripCom: { entityId: "MMY", slug: "miyakojima" } },
  { destinationId: "nha-trang", skyscanner: { entityId: "CXR", slug: "nha-trang" }, tripCom: { entityId: "CXR", slug: "nha-trang" } },
  { destinationId: "phu-quoc", skyscanner: { entityId: "PQC", slug: "phu-quoc" }, tripCom: { entityId: "PQC", slug: "phu-quoc" } },
  { destinationId: "beijing", skyscanner: { entityId: "BJSA", slug: "beijing" }, tripCom: { entityId: "BJS", slug: "beijing" } },
  { destinationId: "guangzhou", skyscanner: { entityId: "CAN", slug: "guangzhou" }, tripCom: { entityId: "CAN", slug: "guangzhou" } },
  { destinationId: "chongqing", skyscanner: { entityId: "CKG", slug: "chongqing" }, tripCom: { entityId: "CKG", slug: "chongqing" } },
  { destinationId: "shanghai", skyscanner: { entityId: "SHAA", slug: "shanghai" }, tripCom: { entityId: "SHA", slug: "shanghai" } },
  { destinationId: "shenzhen", skyscanner: { entityId: "SZX", slug: "shenzhen" }, tripCom: { entityId: "SZX", slug: "shenzhen" } },
  { destinationId: "banff", skyscanner: { entityId: "YYC", slug: "banff" }, tripCom: { entityId: "YYC", slug: "banff" } },
  { destinationId: "toronto", skyscanner: { entityId: "YTOA", slug: "toronto" }, tripCom: { entityId: "YTO", slug: "toronto" } },
  { destinationId: "montreal", skyscanner: { entityId: "YMQA", slug: "montreal" }, tripCom: { entityId: "YMQ", slug: "montreal" } },
  { destinationId: "auckland", skyscanner: { entityId: "AKL", slug: "auckland" }, tripCom: { entityId: "AKL", slug: "auckland" } },
  { destinationId: "queenstown", skyscanner: { entityId: "ZQN", slug: "queenstown" }, tripCom: { entityId: "ZQN", slug: "queenstown" } },
  { destinationId: "christchurch", skyscanner: { entityId: "CHC", slug: "christchurch" }, tripCom: { entityId: "CHC", slug: "christchurch" } },
  { destinationId: "london", skyscanner: { entityId: "LOND", slug: "london" }, tripCom: { entityId: "LON", slug: "london" } },
  { destinationId: "amsterdam", skyscanner: { entityId: "AMS", slug: "amsterdam" }, tripCom: { entityId: "AMS", slug: "amsterdam" } },
  { destinationId: "madrid", skyscanner: { entityId: "MAD", slug: "madrid" }, tripCom: { entityId: "MAD", slug: "madrid" } },
  { destinationId: "san-francisco", skyscanner: { entityId: "SFO", slug: "san-francisco" }, tripCom: { entityId: "SFO", slug: "san-francisco" } },
  { destinationId: "las-vegas", skyscanner: { entityId: "LAS", slug: "las-vegas" }, tripCom: { entityId: "LAS", slug: "las-vegas" } },
  { destinationId: "milan", skyscanner: { entityId: "MILA", slug: "milan" }, tripCom: { entityId: "MIL", slug: "milan" } },
  { destinationId: "venice", skyscanner: { entityId: "VCE", slug: "venice" }, tripCom: { entityId: "VCE", slug: "venice" } },
  { destinationId: "nice", skyscanner: { entityId: "NCE", slug: "nice" }, tripCom: { entityId: "NCE", slug: "nice" } },
  { destinationId: "seville", skyscanner: { entityId: "SVQ", slug: "seville" }, tripCom: { entityId: "SVQ", slug: "seville" } },
  { destinationId: "cairo", skyscanner: { entityId: "CAIA", slug: "cairo" }, tripCom: { entityId: "CAI", slug: "cairo" } },
  { destinationId: "marrakech", skyscanner: { entityId: "RAK", slug: "marrakech" }, tripCom: { entityId: "RAK", slug: "marrakech" } },
  { destinationId: "casablanca", skyscanner: { entityId: "CMN", slug: "casablanca" }, tripCom: { entityId: "CMN", slug: "casablanca" } },
  { destinationId: "cape-town", skyscanner: { entityId: "CPT", slug: "cape-town" }, tripCom: { entityId: "CPT", slug: "cape-town" } },
  { destinationId: "luxor", skyscanner: { entityId: "LXR", slug: "luxor" }, tripCom: { entityId: "LXR", slug: "luxor" } },
  { destinationId: "zanzibar", skyscanner: { entityId: "ZNZ", slug: "zanzibar" }, tripCom: { entityId: "ZNZ", slug: "zanzibar" } },
  { destinationId: "serengeti", skyscanner: { entityId: "JRO", slug: "serengeti" }, tripCom: { entityId: "JRO", slug: "serengeti" } },
  { destinationId: "maasai-mara", skyscanner: { entityId: "NBO", slug: "maasai-mara" }, tripCom: { entityId: "NBO", slug: "maasai-mara" } },
  { destinationId: "rabat", skyscanner: { entityId: "RBA", slug: "rabat" }, tripCom: { entityId: "RBA", slug: "rabat" } },
  { destinationId: "nairobi", skyscanner: { entityId: "NBO", slug: "nairobi" }, tripCom: { entityId: "NBO", slug: "nairobi" } },
  { destinationId: "johannesburg", skyscanner: { entityId: "JNBA", slug: "johannesburg" }, tripCom: { entityId: "JNB", slug: "johannesburg" } },
];
